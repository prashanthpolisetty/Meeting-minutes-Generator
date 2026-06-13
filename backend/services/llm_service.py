"""
LLM Service
Handles interaction with Google Gemini API or Groq API in the cloud for:
- Meeting summarization
- Action item extraction
- Key decision identification
"""

import json
import logging
import asyncio
import requests
import google.generativeai as genai
from backend.config.settings import settings

logger = logging.getLogger(__name__)

async def generate_meeting_minutes(transcript: str) -> dict:
    """Generate structured meeting minutes from a transcript using Gemini or Groq cloud APIs."""
    
    if not transcript or not transcript.strip():
        logger.error("Empty transcript provided to LLM service.")
        raise ValueError("Cannot summarize an empty transcript")

    # Prompt schema specification
    prompt = f"""
    You are an expert executive assistant. Analyze the following meeting transcript and generate a structured JSON object containing the meeting minutes.
    
    The JSON object MUST have exactly these three keys:
    - "summary": A highly detailed and extensive summary of the meeting's purpose and general discussion. This summary MUST be very thorough, deeply describing the analysis and insights, and MUST be strictly more than 10 sentences/lines long.
    - "action_items": A list of strings, each describing a specific task, assignee (if mentioned), and deadline (if mentioned).
    - "key_decisions": A list of strings detailing the final decisions made during the meeting.
    
    Return ONLY valid JSON.
    
    Meeting Transcript:
    ---
    {transcript}
    ---
    """

    # --- ROUTE 1: Google Gemini API (Online Cloud Model) ---
    if settings.LLM_PROVIDER.lower() == "gemini":
        if not settings.GEMINI_API_KEY or not settings.GEMINI_API_KEY.strip():
            logger.error("Gemini API requested but GEMINI_API_KEY is not configured.")
            return {
                "summary": "AI Summarization Failed: GEMINI_API_KEY is missing from environment. Please add it to your .env file.",
                "action_items": [],
                "key_decisions": []
            }

        logger.info(f"Using Google Gemini API (model: {settings.GEMINI_MODEL}) in the cloud...")
        
        def _call_gemini():
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel(
                model_name=settings.GEMINI_MODEL,
                generation_config={"response_mime_type": "application/json"}
            )
            response = model.generate_content(prompt)
            return response.text

        try:
            logger.info("Awaiting online response from Gemini API...")
            text = await asyncio.to_thread(_call_gemini)
            text = text.strip()
            
            # Parse into dictionary
            result = json.loads(text)
            logger.info(f"✅ Successfully generated structured meeting minutes via Gemini API ({settings.GEMINI_MODEL}).")
            return result
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Gemini response into JSON. Decoding Error: {e}")
            logger.error(f"Raw response text: {text}")
            return {
                "summary": "Failed to extract structured summary due to formatting error from Gemini API.",
                "action_items": [],
                "key_decisions": []
            }
        except Exception as e:
            logger.error(f"Error during Gemini API execution: {e}")
            return {
                "summary": f"AI Summarization Failed: An error occurred during Gemini API execution. Details: {str(e)}",
                "action_items": [],
                "key_decisions": []
            }

    # --- ROUTE 2: Groq API (Online Cloud Model) ---
    else:
        if not settings.GROQ_API_KEY or not settings.GROQ_API_KEY.strip():
            logger.error("Groq API requested but GROQ_API_KEY is not configured.")
            return {
                "summary": "AI Summarization Failed: GROQ_API_KEY is missing from environment. Please add it to your .env file.",
                "action_items": [],
                "key_decisions": []
            }

        logger.info(f"Using Groq API (model: {settings.GROQ_MODEL}) in the cloud...")
        
        def _call_groq():
            payload = {
                "model": settings.GROQ_MODEL,
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "response_format": { "type": "json_object" }
            }
            headers = {
                "Authorization": f"Bearer {settings.GROQ_API_KEY}"
            }
            response = requests.post(settings.GROQ_URL, json=payload, headers=headers, timeout=300)
            response.raise_for_status() 
            res_json = response.json()
            
            choices = res_json.get("choices", [])
            if choices:
                return choices[0].get("message", {}).get("content", "").strip()
            raise ValueError("No choices returned from Groq API")

        try:
            logger.info("Awaiting online response from Groq API...")
            text = await asyncio.to_thread(_call_groq)
            
            # Defensive cleanup
            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]
                
            text = text.strip()
            
            # Parse into dictionary
            result = json.loads(text)
            logger.info(f"✅ Successfully generated structured meeting minutes via Groq API ({settings.GROQ_MODEL}).")
            return result
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to connect to Groq server. Error: {e}")
            return {
                "summary": f"AI Summarization Failed: Could not connect to the Groq API endpoint. Ensure internet connection and API key are valid.",
                "action_items": [],
                "key_decisions": []
            }
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Groq response into JSON. Decoding Error: {e}")
            logger.error(f"Raw response text: {text}")
            return {
                "summary": "Failed to extract structured summary due to formatting error from Groq API.",
                "action_items": [],
                "key_decisions": []
            }
        except Exception as e:
             logger.error(f"Unexpected Error during Groq execution: {e}")
             raise

