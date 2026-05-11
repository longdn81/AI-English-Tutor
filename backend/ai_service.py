import os
import json
import traceback
from dotenv import load_dotenv
from google import genai
from google.genai import types

# Load file .env
load_dotenv()

SYSTEM_PROMPT = """
You are a friendly and expert AI English Tutor. You are having a voice-to-voice conversation with a Vietnamese English learner.
The chosen conversation topic is: "{topic}".
Listen to the audio, transcribe it, check for errors, explain in Vietnamese, suggest advanced vocabulary, and respond naturally in English.
Strictly output a JSON object with keys: has_error (boolean), original_text, corrected_text, error_explanation, advanced_suggestions (array), ai_response.
"""

async def get_ai_feedback(audio_bytes: bytes, mime_type: str, topic: str) -> dict:
    """Gửi audio đến Gemini và nhận kết quả JSON."""
    
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("❌ LỖI: Thiếu API KEY trong .env")
        return {"error": "Missing API Key"}

    try:
        # 1. Khởi tạo client
        client = genai.Client(api_key=api_key)

        # 2. Chuẩn bị nội dung (Bản 2.0 flash là bản ổn định nhất cho Audio hiện nay)
        prompt = SYSTEM_PROMPT.format(topic=topic)
        audio_part = types.Part.from_bytes(data=audio_bytes, mime_type=mime_type)

        # 3. Gọi Gemini 
        # Lưu ý quan trọng: Dùng 'gemini-2.5-flash' 
        # SDK mới này tự xử lý prefix 'models/' nên bạn CHỈ cần viết tên model
        # Các model 2.0 hiện tại có thể bị giới hạn (Quota Exceeded) trên tài khoản của bạn, 
        # bản 2.5 Flash là bản mới nhất và đang có sẵn quota miễn phí ổn định.
        response = await client.aio.models.generate_content(
            model="gemini-2.5-flash",  # Đổi sang 2.5 flash
            contents=[prompt, audio_part],
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            ),
        )

        # 4. Parse kết quả
        return json.loads(response.text)

    except Exception as e:
        print("❌ Lỗi thực thi tại ai_service.py:")
        # In ra lỗi chi tiết của Google để biết chính xác tại sao nó từ chối
        if hasattr(e, 'message'):
            print(f"Chi tiết lỗi từ Google: {e.message}")
        traceback.print_exc()
        raise e