import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

client = AsyncIOMotorClient(MONGO_URI)
db = client["english_tutor_db"]
conversations_collection = db["conversations"]


async def save_conversation(data: dict):
    """Insert a conversation document into the conversations collection."""
    result = await conversations_collection.insert_one(data)
    return result
