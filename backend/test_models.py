import asyncio
import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

async def test():
    client = genai.Client()
    models = [
        'gemini-2.5-flash',
        'gemini-flash-latest',
        'gemini-2.0-flash',
        'gemini-2.0-flash-lite',
        'gemini-1.5-flash',
        'gemini-pro-latest'
    ]
    for m in models:
        try:
            resp = await client.aio.models.generate_content(model=m, contents='Hello')
            print(f'SUCCESS: {m}')
        except Exception as e:
            print(f'FAILED: {m} - {type(e).__name__}: {str(e)}')

if __name__ == "__main__":
    asyncio.run(test())
