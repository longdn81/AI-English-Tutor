import traceback
from fastapi import FastAPI, File, Form, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List

from ai_service import get_ai_feedback, get_session_summary
from database import save_conversation, get_conversations_by_user

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
