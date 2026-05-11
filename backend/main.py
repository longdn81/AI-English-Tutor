from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import os

from ai_service import generate_tutor_response

load_dotenv()

app = FastAPI(title="AI English Tutor API")

# Setup CORS
origins = [
    "http://localhost:5173",  # default Vite dev server
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    text: str

@app.get("/")
async def root():
    return {"message": "Welcome to AI English Tutor API"}

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        response_data = generate_tutor_response(request.text)
        return response_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
