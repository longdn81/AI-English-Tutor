import os
from datetime import datetime
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

client = AsyncIOMotorClient(MONGO_URI)
db = client["english_tutor_db"]
conversations_collection = db["conversations"]
quiz_results_collection = db["quiz_results"]


async def save_conversation(data: dict, user_email: str):
    """Insert a conversation document into the conversations collection."""
    data["user_email"] = user_email
    if "created_at" not in data:
        data["created_at"] = datetime.utcnow()
    result = await conversations_collection.insert_one(data)
    return result

async def get_conversations_by_user(user_email: str):
    """Fetch all conversations for a specific user, sorted by date descending."""
    cursor = conversations_collection.find({"user_email": user_email}).sort("created_at", -1)
    conversations = await cursor.to_list(length=100)
    
    # Convert ObjectId and datetime to string for JSON serialization
    for conv in conversations:
        conv["_id"] = str(conv["_id"])
        if "created_at" in conv:
            conv["created_at"] = conv["created_at"].isoformat()
            
    return conversations

async def save_quiz_result(user_email: str, topic: str, score: int, total_questions: int):
    """Insert a quiz result into the quiz_results collection."""
    data = {
        "user_email": user_email,
        "topic": topic,
        "score": score,
        "total_questions": total_questions,
        "completed_at": datetime.utcnow()
    }
    result = await quiz_results_collection.insert_one(data)
    return result
