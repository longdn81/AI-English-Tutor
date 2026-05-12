import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

async def test_conn():
    load_dotenv()
    uri = os.getenv("MONGO_URI")
    print(f"Testing connection to: {uri[:20]}...")
    try:
        client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=5000)
        # The 'ping' command is cheap and does not require auth.
        await client.admin.command('ping')
        print("Ping successful!")
    except Exception as e:
        print(f"Ping failed: {e}")

    print("Testing password hashing...")
    try:
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        h = pwd_context.hash("password123")
        print(f"Hash successful: {h[:10]}...")
    except Exception as e:
        print(f"Hashing failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_conn())
