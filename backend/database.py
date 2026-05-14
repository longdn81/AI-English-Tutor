import os
from datetime import datetime
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from bson import ObjectId

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

client = AsyncIOMotorClient(MONGO_URI)
db = client["english_tutor_db"]
conversations_collection = db["conversations"]
quiz_results_collection = db["quiz_results"]
user_progress_collection = db["user_progress"]
users_collection = db["users"]

DEFAULT_PREFERENCES = {
    "notifications": {
        "reminders": True,
        "reflections": True,
        "new_content": False
    },
    "dataSharing": False
}


# ─────────────────────────────────────────────
# USER AUTH
# ─────────────────────────────────────────────

async def get_or_create_user(email: str, name: str = "", picture: str = "") -> dict:
    """Find existing user by email or create a new one. Returns the user document."""
    existing = await users_collection.find_one({"email": email})
    if existing:
        existing["_id"] = str(existing["_id"])
        return existing

    new_user = {
        "email": email,
        "name": name,
        "picture": picture,
        "preferences": DEFAULT_PREFERENCES,
        "created_at": datetime.utcnow(),
    }
    result = await users_collection.insert_one(new_user)
    new_user["_id"] = str(result.inserted_id)
    return new_user


async def create_user_with_password(email: str, name: str, plain_password: str) -> dict:
    """Register a new user with a hashed password. Raises ValueError if email already exists."""
    existing = await users_collection.find_one({"email": email})
    if existing:
        raise ValueError("Email already registered. Please log in instead.")

    # Validate password is a string and within bcrypt limits
    if not isinstance(plain_password, str):
        raise ValueError(f"Password must be a string, got {type(plain_password)}")
    
    if len(plain_password.encode('utf-8')) > 72:
        raise ValueError("Password is too long. Maximum 72 bytes allowed.")
    
    if len(plain_password) < 6:
        raise ValueError("Password must be at least 6 characters long.")

    new_user = {
        "email": email,
        "name": name,
        "picture": "",
        "password_hash": pwd_context.hash(plain_password),
        "auth_provider": "email",
        "preferences": DEFAULT_PREFERENCES,
        "created_at": datetime.utcnow(),
    }
    result = await users_collection.insert_one(new_user)
    new_user["_id"] = str(result.inserted_id)
    return new_user


async def verify_user_password(email: str, plain_password: str) -> dict:
    """Verify email + password. Returns user if valid, raises ValueError if not."""
    user = await users_collection.find_one({"email": email})
    if not user:
        raise ValueError("No account found with this email.")
    if not user.get("password_hash"):
        raise ValueError("This account was registered via Google. Please sign in with Google.")
    if not pwd_context.verify(plain_password, user["password_hash"]):
        raise ValueError("Incorrect password. Please try again.")
    user["_id"] = str(user["_id"])
    return user


async def get_user_preferences(user_id: str) -> dict:
    """Fetch preferences for a specific user_id."""
    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if user:
        return user.get("preferences", DEFAULT_PREFERENCES)
    return DEFAULT_PREFERENCES


async def update_user_preferences(user_id: str, preferences: dict):
    """Update preferences for a specific user_id."""
    await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"preferences": preferences}}
    )


async def delete_user_account(user_id: str):
    """Permanently delete user and all associated data."""
    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        return False
    
    email = user.get("email")
    
    # 1. Delete user document
    await users_collection.delete_one({"_id": ObjectId(user_id)})
    
    # 2. Delete all related data by email (as currently indexed)
    if email:
        await conversations_collection.delete_many({"user_email": email})
        await user_progress_collection.delete_many({"user_email": email})
        await quiz_results_collection.delete_many({"user_email": email})
    
    return True


async def update_user_profile(user_id: str, profile_data: dict):
    """Update user profile information."""
    allowed_fields = ["name", "picture", "address", "phone"]
    update_data = {k: v for k, v in profile_data.items() if k in allowed_fields}
    
    if not update_data:
        return None
        
    await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_data}
    )
    return await users_collection.find_one({"_id": ObjectId(user_id)})


# ─────────────────────────────────────────────
# CONVERSATIONS
# ─────────────────────────────────────────────

async def save_conversation(user_id: str, topic: str, ai_result: dict):
    """Insert a conversation document into the conversations collection."""
    data = {
        "user_email": user_id,
        "topic": topic,
        "ai_result": ai_result,
        "created_at": datetime.utcnow()
    }
    result = await conversations_collection.insert_one(data)
    return result

async def get_conversations_by_user(user_email: str):
    """Fetch all conversations for a specific user, sorted by date descending."""
    cursor = conversations_collection.find({"user_email": user_email}).sort("created_at", -1)
    conversations = await cursor.to_list(length=100)
    
    for conv in conversations:
        conv["_id"] = str(conv["_id"])
        if "created_at" in conv:
            conv["created_at"] = conv["created_at"].isoformat()
            
    return conversations


# ─────────────────────────────────────────────
# QUIZ RESULTS
# ─────────────────────────────────────────────

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


# ─────────────────────────────────────────────
# USER PROGRESS
# ─────────────────────────────────────────────

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


# ─────────────────────────────────────────────
# UNIFIED HISTORY (DASHBOARD)
# ─────────────────────────────────────────────

async def get_unified_history(user_email: str):
    """Fetch and combine conversations and progress into a single sorted timeline."""
    conversations = await get_conversations_by_user(user_email)
    progress = await get_user_progress(user_email)

    unified = []
    
    for c in conversations:
        c["type"] = "conversation"
        c["timestamp"] = c.get("created_at")
        unified.append(c)
        
    for p in progress:
        p["type"] = "progress"
        p["timestamp"] = p.get("updated_at")
        unified.append(p)
        
    unified.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    return unified
