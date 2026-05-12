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
user_progress_collection = db["user_progress"]


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

async def update_user_progress(email: str, category: str, sub_category: str, item_id: str, status: str, score: int = None):
    """
    Update or insert user progress for a specific item.
    Only updates score and status if the new score is higher.
    """
    filter_query = {
        "user_email": email,
        "category": category,
        "sub_category": sub_category,
        "item_id": item_id
    }
    
    existing = await user_progress_collection.find_one(filter_query)
    
    if existing:
        current_score = existing.get("score")
        if score is not None and current_score is not None:
            if score <= current_score:
                return existing
    
    update_data = {
        "$set": {
            "status": status,
            "updated_at": datetime.utcnow()
        }
    }
    
    if score is not None:
        update_data["$set"]["score"] = score
        
    result = await user_progress_collection.update_one(
        filter_query, 
        update_data, 
        upsert=True
    )
    return result

async def get_user_progress(email: str):
    """Fetch all progress items for a user."""
    cursor = user_progress_collection.find({"user_email": email})
    progress = await cursor.to_list(length=1000)
    for p in progress:
        p["_id"] = str(p["_id"])
        if "updated_at" in p:
            p["updated_at"] = p["updated_at"].isoformat()
    return progress
