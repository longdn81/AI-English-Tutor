import traceback
from fastapi import FastAPI, File, Form, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List

from ai_service import get_ai_feedback, get_session_summary, generate_library_content, evaluate_pronunciation
from database import save_conversation, get_conversations_by_user, save_quiz_result, get_user_progress, update_user_progress

app = FastAPI(title="AI English Tutor API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
