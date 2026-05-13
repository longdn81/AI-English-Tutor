import traceback
import os
import jwt
from datetime import datetime, timedelta, timezone
from fastapi import FastAPI, File, Form, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List

from ai_service import get_ai_feedback, get_session_summary, generate_library_content, evaluate_pronunciation, generate_weekly_insight
from database import (
    save_conversation, get_conversations_by_user, save_quiz_result, 
    get_user_progress, update_user_progress, get_unified_history, 
    get_or_create_user, create_user_with_password, verify_user_password,
    get_user_preferences, update_user_preferences, delete_user_account,
    update_user_profile
)

app = FastAPI(title="AI English Tutor API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────
# JWT HELPER
# ─────────────────────────────────────────────

JWT_SECRET = os.getenv("JWT_SECRET", "lingoflow-super-secret-change-in-prod")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_DAYS = 30

def make_jwt(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRE_DAYS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def user_response(user: dict) -> dict:
    """Standard user response shape including a JWT token."""
    return {
        "user_id": user["_id"],
        "email": user["email"],
        "name": user.get("name", ""),
        "picture": user.get("picture", ""),
        "address": user.get("address", ""),
        "phone": user.get("phone", ""),
        "preferences": user.get("preferences", {}),
        "token": make_jwt(user["_id"], user["email"])
    }


# ─────────────────────────────────────────────
# AUTH
# ─────────────────────────────────────────────

class GoogleAuthRequest(BaseModel):
    email: str
    name: str = ""
    picture: str = ""

@app.post("/api/auth/google")
async def google_auth(req: GoogleAuthRequest):
    """Receive Google user info from frontend, upsert user in DB, return user + JWT."""
    try:
        user = await get_or_create_user(email=req.email, name=req.name, picture=req.picture)
        return user_response(user)
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})


class EmailRegisterRequest(BaseModel):
    email: str
    name: str
    password: str

@app.post("/api/auth/register")
async def register(req: EmailRegisterRequest):
    """Register a new account with email + password."""
    try:
        user = await create_user_with_password(req.email, req.name, req.password)
        return user_response(user)
    except ValueError as e:
        return JSONResponse(status_code=400, content={"error": str(e)})
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})


class EmailLoginRequest(BaseModel):
    email: str
    password: str

@app.post("/api/auth/login")
async def login_email(req: EmailLoginRequest):
    """Log in with email + password."""
    try:
        user = await verify_user_password(req.email, req.password)
        return user_response(user)
    except ValueError as e:
        return JSONResponse(status_code=401, content={"error": str(e)})
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})


# ─────────────────────────────────────────────
# USER PREFERENCES & ACCOUNT
# ─────────────────────────────────────────────

@app.get("/api/user/preferences/{user_id}")
async def get_prefs(user_id: str):
    """Fetch user preferences."""
    try:
        prefs = await get_user_preferences(user_id)
        return prefs
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.put("/api/user/preferences/{user_id}")
async def update_prefs(user_id: str, prefs: dict):
    """Update user preferences."""
    try:
        await update_user_preferences(user_id, prefs)
        return {"status": "success"}
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.delete("/api/user/account/{user_id}")
async def delete_account(user_id: str):
    """Delete user account and all associated data."""
    try:
        success = await delete_user_account(user_id)
        if not success:
            return JSONResponse(status_code=404, content={"error": "User not found"})
        return {"status": "success"}
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.put("/api/user/profile/{user_id}")
async def update_profile(user_id: str, profile: dict):
    """Update user profile information."""
    try:
        user = await update_user_profile(user_id, profile)
        if not user:
            return JSONResponse(status_code=404, content={"error": "User not found"})
        # Return updated user response
        user["_id"] = str(user["_id"])
        return user_response(user)
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})


# ─────────────────────────────────────────────
# CHAT
# ─────────────────────────────────────────────

@app.post("/api/chat")
async def chat(
    audio_file: Optional[UploadFile] = File(None),
    topic: str = Form(...),
    text_message: Optional[str] = Form(None),
):
    try:
        audio_bytes = None
        mime_type = None
        if audio_file:
            audio_bytes = await audio_file.read()
            mime_type = audio_file.content_type or "audio/webm"

        # Get AI feedback from Gemini
        ai_result = await get_ai_feedback(audio_bytes=audio_bytes, mime_type=mime_type, topic=topic, text_message=text_message)

        # Mock Auth: Hardcode user_email for now
        user_email = "student_vku@gmail.com"

        # Save the conversation to MongoDB
        await save_conversation({
            "topic": topic,
            "mime_type": mime_type,
            "ai_result": ai_result,
        }, user_email=user_email)

        return ai_result

    except Exception as e:
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"error": str(e)},
        )

class SummaryRequest(BaseModel):
    messages: List[dict]

@app.post("/api/chat/summary")
async def chat_summary(req: SummaryRequest):
    try:
        summary_result = await get_session_summary(req.messages)
        return summary_result
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"error": str(e)},
        )

@app.get("/api/history/{user_email}")
async def get_history(user_email: str):
    try:
        conversations = await get_conversations_by_user(user_email)
        return {"conversations": conversations}
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"error": str(e)},
        )

class LibraryRequest(BaseModel):
    user_email: str
    task_type: str
    context: str

@app.post("/api/library/generate")
async def generate_library(req: LibraryRequest):
    try:
        content = await generate_library_content(req.task_type, req.context)
        return content
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"error": str(e)},
        )

class QuizScoreRequest(BaseModel):
    user_email: str
    topic: str
    score: int
    total_questions: int

@app.post("/api/library/save-score")
async def save_score(req: QuizScoreRequest):
    try:
        await save_quiz_result(req.user_email, req.topic, req.score, req.total_questions)
        return {"status": "success"}
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"error": str(e)},
        )

class ProgressUpdateRequest(BaseModel):
    user_email: str
    category: str
    sub_category: str
    item_id: str
    status: str
    score: Optional[int] = None

@app.post("/api/library/update-progress")
@app.post("/api/progress/update")
async def update_progress(req: ProgressUpdateRequest):
    try:
        await update_user_progress(req.user_email, req.category, req.sub_category, req.item_id, req.status, req.score)
        return {"status": "success"}
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"error": str(e)},
        )

@app.get("/api/progress/{user_email}")
async def get_progress(user_email: str):
    try:
        progress = await get_user_progress(user_email)
        return {"progress": progress}
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"error": str(e)},
        )

@app.post("/api/library/pronunciation")
async def evaluate_pronunciation_endpoint(
    audio_file: UploadFile = File(...),
    target_text: str = Form(...),
):
    try:
        audio_bytes = await audio_file.read()
        mime_type = audio_file.content_type or "audio/webm"
        
        result = await evaluate_pronunciation(audio_bytes, mime_type, target_text)
        return result
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"error": str(e)},
        )

@app.get("/api/history/dashboard/{user_email}")
async def get_history_dashboard(user_email: str):
    try:
        unified = await get_unified_history(user_email)
        recent_feed = unified[:15]
        
        summary_data = []
        for item in recent_feed:
            if item["type"] == "conversation":
                score = None
                if "ai_result" in item and "summary" in item["ai_result"]:
                    score = item["ai_result"]["summary"].get("overall_score")
                summary_data.append({
                    "type": "conversation", 
                    "topic": item.get("topic"), 
                    "score": score
                })
            else:
                summary_data.append({
                    "type": "progress", 
                    "module": item.get("sub_category"), 
                    "status": item.get("status"), 
                    "score": item.get("score")
                })
                
        insight_result = await generate_weekly_insight(summary_data)
        insight_text = insight_result.get("ai_insight", "Keep up the good work! Your progress is being tracked.")
        
        return {"feed": recent_feed, "insight": insight_text}
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"error": str(e)},
        )
