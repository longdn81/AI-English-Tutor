import traceback
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from ai_service import get_ai_feedback
from database import save_conversation

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
    audio_file: UploadFile = File(...),
    topic: str = Form(...),
):
    try:
        # Read the uploaded audio bytes
        audio_bytes = await audio_file.read()
        mime_type = audio_file.content_type or "audio/webm"

        # Get AI feedback from Gemini
        ai_result = await get_ai_feedback(audio_bytes, mime_type, topic)

        # Save the conversation to MongoDB
        await save_conversation({
            "topic": topic,
            "mime_type": mime_type,
            "ai_result": ai_result,
        })

        return ai_result

    except Exception as e:
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"error": str(e)},
        )
