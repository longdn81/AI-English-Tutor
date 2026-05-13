import os
import json
import traceback
from dotenv import load_dotenv
from google import genai
from google.genai import types
import re

# Load file .env - force override to ensure new key is picked up
load_dotenv(override=True)

# Centralized fallback list for all AI functions
GLOBAL_FALLBACK_MODELS = [
    'gemini-3.1-flash-lite',  # Highest priority, 500 quota
    'gemini-2.5-flash-lite',  # 20 quota
    'gemini-3-flash',         # Fallback
    'gemini-2.5-flash'        # Fallback
]

def clean_and_parse_json(ai_text: str):
    """
    Cleans the AI response by removing markdown code blocks and conversational text,
    then parses it into a JSON object.
    """
    # Remove markdown code blocks if present (handle ```json or just ```)
    cleaned_text = re.sub(r'```(?:json)?\n?(.*?)\n?```', r'\1', ai_text, flags=re.DOTALL)
    
    # Find the outermost curly braces to isolate the JSON object
    start_index = cleaned_text.find('{')
    end_index = cleaned_text.rfind('}')
    
    if start_index != -1 and end_index != -1:
        cleaned_text = cleaned_text[start_index:end_index+1]
    
    return json.loads(cleaned_text)

SYSTEM_PROMPT = """
You are a friendly and expert AI English Tutor. You are having a voice-to-voice conversation with a Vietnamese English learner.
The chosen conversation topic is: "{topic}".
Listen to the audio, transcribe it, check for errors, explain in Vietnamese, suggest advanced vocabulary, and respond naturally in English.
Strictly output a JSON object with keys: has_error (boolean), original_text, corrected_text, error_explanation, advanced_suggestions (array), ai_response.
CRITICAL: Return ONLY raw, valid JSON. DO NOT wrap in markdown code blocks. NO conversational text.
"""

async def get_ai_feedback(audio_bytes: bytes = None, mime_type: str = None, topic: str = "General", text_message: str = None) -> dict:
    """Gửi audio hoặc text đến Gemini và nhận kết quả JSON."""
    
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is missing from the environment variables!")

    try:
        # 1. Khởi tạo client với api_key tường minh
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

        # 3. Gọi Gemini với fallback mechanism
        for model_name in GLOBAL_FALLBACK_MODELS:
            try:
                response = await client.aio.models.generate_content(
                    model=model_name, 
                    contents=contents,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json"
                    ),
                )
                # 4. Parse kết quả và trả về ngay nếu thành công
                return clean_and_parse_json(response.text)
            except Exception as e:
                error_msg = str(e)
                print(f"❌ [DEBUG] Model '{model_name}' FAILED. Reason: {error_msg}")
                
                # Check for 429, 404, OR 503 errors to bypass
                error_keywords = ['429', 'ResourceExhausted', '404', 'NotFound', '503', 'Unavailable', 'InternalServerError']
                
                if any(keyword in error_msg for keyword in error_keywords) or any(keyword in type(e).__name__ for keyword in error_keywords):
                    print(f"⚠️ Bypassing {model_name} due to temporary API issue...")
                    continue
                    
                # If it's a completely different error, raise it
                raise e
        
        # Nếu chạy hết vòng lặp mà không return được
        raise Exception("All Gemini models are currently out of quota. Please wait a moment and try again.")

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
CRITICAL: Return ONLY raw, valid JSON. DO NOT wrap in markdown code blocks. NO conversational text.

Chat History:
{chat_history}
"""

async def get_session_summary(messages: list) -> dict:
    """Gửi toàn bộ hội thoại đến Gemini để nhận đánh giá tổng kết."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is missing from the environment variables!")
        
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
        
        for model_name in GLOBAL_FALLBACK_MODELS:
            try:
                response = await client.aio.models.generate_content(
                    model=model_name,
                    contents=[prompt],
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json"
                    ),
                )
                return clean_and_parse_json(response.text)
            except Exception as e:
                error_msg = str(e)
                print(f"❌ [DEBUG] Model '{model_name}' FAILED (summary). Reason: {error_msg}")
                
                error_keywords = ['429', 'ResourceExhausted', '404', 'NotFound', '503', 'Unavailable', 'InternalServerError']
                
                if any(keyword in error_msg for keyword in error_keywords) or any(keyword in type(e).__name__ for keyword in error_keywords):
                    print(f"⚠️ Bypassing {model_name} (summary) due to temporary issue...")
                    continue
                raise e
                    
        raise Exception("All Gemini models are currently out of quota. Please wait a moment and try again.")
    except Exception as e:
        print("❌ Lỗi thực thi get_session_summary:")
        traceback.print_exc()
        return {"error": str(e)}

LIBRARY_GENERATOR_PROMPT = """
You are an expert English Tutor creating learning materials.
Task Type: {task_type}
Context/Topic: {context}

Please generate the content in a STRICT JSON format based on the Task Type.
CRITICAL: Return ONLY raw, valid JSON. DO NOT wrap in markdown code blocks. NO conversational text.

If Task Type is "grammar_quiz":
CRITICAL REQUIREMENT: You MUST generate EXACTLY 5 questions. Do not generate fewer or more. The output JSON array MUST contain exactly 5 objects.
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
Write a very short, engaging story (max 100 words) using these exact English words: {context}. Highlight the words in bold (e.g. **word**).
Output JSON format:
{{
  "story_en": "The short story in English with highlighted words.",
  "translation_vn": "The full translation of the story in Vietnamese."
}}

If Task Type is "phrases":
Generate 10 practical, ready-to-use English phrases for the situation: {context}.
Output JSON format:
{{
  "phrases": [
    {{
      "english": "The phrase in English",
      "vietnamese": "The Vietnamese translation",
      "nuance": "A short note on when/how to use it or its tone"
    }}
  ]
}}

If Task Type is "pronunciation_sentences":
Generate 5 challenging English sentences for pronunciation practice. They should contain tongue-twisters, common difficult sound combinations (like th, r/l, v/w, sh/ch), or rhythmic phrasing. Do not include any explanations, just the sentences.
Output JSON format:
{{
  "sentences": ["Sentence 1", "Sentence 2", "Sentence 3", "Sentence 4", "Sentence 5"]
}}

If Task Type is "vocab_words":
Generate 5 practical English vocabulary words for an intermediate learner. Only return the words, capitalized.
Output JSON format:
{{
  "words": ["Word1", "Word2", "Word3", "Word4", "Word5"]
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
        raise ValueError("GEMINI_API_KEY is missing from the environment variables!")
        
    try:
        client = genai.Client(api_key=api_key)
        prompt = LIBRARY_GENERATOR_PROMPT.format(task_type=task_type, context=context)
        
        for model_name in GLOBAL_FALLBACK_MODELS:
            try:
                response = await client.aio.models.generate_content(
                    model=model_name,
                    contents=[prompt],
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json"
                    ),
                )
                return clean_and_parse_json(response.text)
            except Exception as e:
                error_msg = str(e)
                print(f"❌ [DEBUG] Model '{model_name}' FAILED (library). Reason: {error_msg}")
                
                error_keywords = ['429', 'ResourceExhausted', '404', 'NotFound', '503', 'Unavailable', 'InternalServerError']
                
                if any(keyword in error_msg for keyword in error_keywords) or any(keyword in type(e).__name__ for keyword in error_keywords):
                    print(f"⚠️ Bypassing {model_name} (library) due to temporary issue...")
                    continue
                raise e

        raise Exception("All Gemini models are currently out of quota. Please wait a moment and try again.")
    except Exception as e:
        print("❌ Lỗi thực thi generate_library_content:")
        return {"error": str(e)}

PRONUNCIATION_PROMPT = """
You are an expert English Pronunciation Tutor.
Listen to the user's audio recording and compare it to this target sentence:
"{target_text}"

Evaluate their pronunciation, intonation, and rhythm.
Strictly output a JSON object with:
- score (number from 0 to 100),
- feedback (string with a concise critique and tips for improvement in Vietnamese),
- words_to_practice (list of strings, the specific words they struggled with, if any).
CRITICAL: Return ONLY raw, valid JSON. DO NOT wrap in markdown code blocks. NO conversational text.
"""

async def evaluate_pronunciation(audio_bytes: bytes, mime_type: str, target_text: str) -> dict:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is missing from the environment variables!")
        
    try:
        client = genai.Client(api_key=api_key)
        audio_part = types.Part.from_bytes(data=audio_bytes, mime_type=mime_type)
        contents = [
            audio_part,
            PRONUNCIATION_PROMPT.format(target_text=target_text)
        ]
        
        for model_name in GLOBAL_FALLBACK_MODELS:
            try:
                response = await client.aio.models.generate_content(
                    model=model_name,
                    contents=contents,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json"
                    ),
                )
                return clean_and_parse_json(response.text)
            except Exception as e:
                error_msg = str(e)
                print(f"❌ [DEBUG] Model '{model_name}' FAILED (pronunciation). Reason: {error_msg}")
                
                error_keywords = ['429', 'ResourceExhausted', '404', 'NotFound', '503', 'Unavailable', 'InternalServerError']
                
                if any(keyword in error_msg for keyword in error_keywords) or any(keyword in type(e).__name__ for keyword in error_keywords):
                    print(f"⚠️ Bypassing {model_name} (pronunciation) due to temporary issue...")
                    continue
                raise e

        raise Exception("All Gemini models are currently out of quota. Please wait a moment and try again.")
    except Exception as e:
        print("❌ Lỗi thực thi evaluate_pronunciation:")
        traceback.print_exc()
        return {"error": str(e)}

INSIGHT_PROMPT = """
You are an encouraging English tutor helping a student prepare for the TOEIC exam. 
Analyze this recent learning activity data: {history_data}. 
Write exactly 2 sentences in Vietnamese: one acknowledging their effort/trend, and one specific recommendation on what to practice next based on their data. 
Return strictly as JSON: {{ "ai_insight": "your text here" }}
CRITICAL: Return ONLY raw, valid JSON. DO NOT wrap in markdown code blocks. NO conversational text.
"""

async def generate_weekly_insight(history_data: list) -> dict:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is missing from the environment variables!")
        
    try:
        client = genai.Client(api_key=api_key)
        prompt = INSIGHT_PROMPT.format(history_data=json.dumps(history_data, ensure_ascii=False))
        
        for model_name in GLOBAL_FALLBACK_MODELS:
            try:
                response = await client.aio.models.generate_content(
                    model=model_name,
                    contents=[prompt],
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json"
                    ),
                )
                return clean_and_parse_json(response.text)
            except Exception as e:
                error_msg = str(e)
                print(f"❌ [DEBUG] Model '{model_name}' FAILED (insight). Reason: {error_msg}")
                
                error_keywords = ['429', 'ResourceExhausted', '404', 'NotFound', '503', 'Unavailable', 'InternalServerError']
                
                if any(keyword in error_msg for keyword in error_keywords) or any(keyword in type(e).__name__ for keyword in error_keywords):
                    print(f"⚠️ Bypassing {model_name} (insight) due to temporary issue...")
                    continue
                raise e

        raise Exception("All Gemini models are currently out of quota. Please wait a moment and try again.")
    except Exception as e:
        print("❌ Lỗi thực thi generate_weekly_insight:")
        traceback.print_exc()
        return {"error": str(e)}