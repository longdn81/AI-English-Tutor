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

async def get_ai_feedback(audio_bytes: bytes = None, mime_type: str = None, topic: str = "General", text_message: str = None) -> dict:
    """Gửi audio hoặc text đến Gemini và nhận kết quả JSON."""
    
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("❌ LỖI: Thiếu API KEY trong .env")
        return {"error": "Missing API Key"}

    try:
        # 1. Khởi tạo client
        client = genai.Client(api_key=api_key)

        # 2. Chuẩn bị nội dung
        prompt = SYSTEM_PROMPT.format(topic=topic)
        contents = [prompt]
        
        if text_message:
            contents.append(f"User message: {text_message}")
        elif audio_bytes and mime_type:
            audio_part = types.Part.from_bytes(data=audio_bytes, mime_type=mime_type)
            contents.append(audio_part)
        else:
            return {"error": "Missing both audio and text message"}

        # 3. Gọi Gemini 
        # Sử dụng model flash-latest
        response = await client.aio.models.generate_content(
            model="gemini-flash-latest", 
            contents=contents,
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

SUMMARY_PROMPT = """
You are an expert English Tutor evaluating a conversation session.
Below is the chat history between the User and the AI Tutor.
Review the user's performance and provide a summary.
Strictly output a JSON object with keys: 
- overall_score (number out of 10),
- grammar_review (string explaining strengths and weaknesses),
- pronunciation_review (string, if applicable, based on correction history),
- vocabulary_review (string),
- encouraging_message (string).

Chat History:
{chat_history}
"""

async def get_session_summary(messages: list) -> dict:
    """Gửi toàn bộ hội thoại đến Gemini để nhận đánh giá tổng kết."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return {"error": "Missing API Key"}
        
    try:
        client = genai.Client(api_key=api_key)
        
        # Format chat history for the prompt
        formatted_history = ""
        for msg in messages:
            role = msg.get("role", "unknown")
            text = msg.get("text", "")
            formatted_history += f"{role.upper()}: {text}\n"
            
            # Include corrections to help AI evaluate
            if "correction" in msg:
                corr = msg["correction"]
                formatted_history += f"(Feedback given: Suggested '{corr.get('suggested')}' instead of '{corr.get('original')}'. Reason: {corr.get('explanation')})\n"
                
        prompt = SUMMARY_PROMPT.format(chat_history=formatted_history)
        
        response = await client.aio.models.generate_content(
            model="gemini-flash-latest",
            contents=[prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            ),
        )
        return json.loads(response.text)
    except Exception as e:
        print("❌ Lỗi thực thi get_session_summary:")
        traceback.print_exc()
        return {"error": str(e)}

LIBRARY_GENERATOR_PROMPT = """
You are an expert English Tutor creating learning materials.
Task Type: {task_type}
Context/Topic: {context}

Please generate the content in a STRICT JSON format based on the Task Type.

If Task Type is "grammar_quiz":
Output JSON format:
{{
  "theory_summary": "A 3-sentence clear explanation of the grammar rule in Vietnamese.",
  "example_sentence": "One practical English example illustrating the rule.",
  "questions": [
    {{
      "question": "The sentence with a ___ blank.",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "A",
      "explanation_vn": "Detailed explanation in Vietnamese of why A is correct and the others are wrong."
    }}
  ]
}}

If Task Type is "vocab_story":
Output JSON format:
{{
  "title": "Story Title",
  "story_text": "The full story with some advanced vocabulary words used naturally.",
  "vocabulary": [
    {{
      "word": "advanced_word",
      "definition": "definition of the word",
      "example": "example sentence"
    }}
  ]
}}

If Task Type is "custom_topic":
Output JSON format:
{{
  "title": "Topic Title",
  "content": "Detailed text about the context.",
  "key_takeaways": ["Point 1", "Point 2"]
}}
"""

async def generate_library_content(task_type: str, context: str) -> dict:
    """Generate dynamic learning content for the Library page."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return {"error": "Missing API Key"}
        
    try:
        client = genai.Client(api_key=api_key)
        prompt = LIBRARY_GENERATOR_PROMPT.format(task_type=task_type, context=context)
        
        response = await client.aio.models.generate_content(
            model="gemini-flash-latest",
            contents=[prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            ),
        )
        return json.loads(response.text)
    except Exception as e:
        print("❌ Lỗi thực thi generate_library_content:")
        traceback.print_exc()
        return {"error": str(e)}