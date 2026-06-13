"""
Processing Pipeline
Orchestrates the autonomous flow: Audio -> Transcription -> LLM -> Database -> Email
"""

import os
import logging
from bson.objectid import ObjectId
from backend.database.mongo import get_db
from backend.services.transcription_service import transcribe_audio
from backend.services.llm_service import generate_meeting_minutes
from backend.services.email_service import send_meeting_email

logger = logging.getLogger(__name__)

async def process_meeting(meeting_id: str):
    """Background task to process the meeting audio from start to finish."""
    db = get_db()
    try:
        # 1. Fetch meeting record
        meeting = db.meetings.find_one({"_id": ObjectId(meeting_id)})
        if not meeting:
            logger.error(f"Meeting {meeting_id} not found in database.")
            return

        # Update status
        db.meetings.update_one({"_id": ObjectId(meeting_id)}, {"$set": {"status": "processing"}})
        logger.info(f"Pipeline: Meeting {meeting_id} status updated to processing.")
        
        audio_path = meeting.get("audio_path")
        if not audio_path or not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio file missing for meeting {meeting_id}")

        # 2. Transcription Agent Execution
        logger.info(f"Pipeline: Executing Transcription Agent for {meeting_id}...")
        try:
            transcript = await transcribe_audio(audio_path)
        except Exception as e:
            logger.error(f"Transcription failed: {str(e)}")
            raise RuntimeError(f"Transcription Error: {str(e)}")
        
        # Save transcript to DB incrementally
        db.meetings.update_one({"_id": ObjectId(meeting_id)}, {"$set": {"transcript": transcript}})
        logger.info(f"Pipeline: Transcription saved for {meeting_id}")

        # 3. LLM Summarization Agent Execution
        logger.info(f"Pipeline: Executing Summarization Agent for {meeting_id}...")
        try:
            minutes = await generate_meeting_minutes(transcript)
        except Exception as e:
            logger.error(f"LLM Summarization failed: {str(e)}")
            raise RuntimeError(f"Summarization Error: {str(e)}")
        
        # Format the parsed dict back into the database shape
        summary = minutes.get("summary", "No summary generated.")
        action_items = minutes.get("action_items", [])
        key_decisions = minutes.get("key_decisions", [])
        
        update_data = {
            "summary": summary,
            "action_items": action_items,
            "key_decisions": key_decisions,
            "status": "completed"
        }
        
        # Save final minutes to DB
        db.meetings.update_one({"_id": ObjectId(meeting_id)}, {"$set": update_data})
        logger.info(f"Pipeline: Summary saved to DB for {meeting_id}.")

        # 4. Email Notification Agent Execution
        recipients = meeting.get("participants", [])
        if recipients:
            logger.info(f"Pipeline: Executing Email Agent for {meeting_id}...")
            # We bundle the data so the email agent can format it
            email_payload = {
                "summary": summary,
                "action_items": action_items,
                "key_decisions": key_decisions
            }
            try:
                await send_meeting_email(recipients, email_payload)
            except Exception as e:
                logger.error(f"Email Dispatch failed: {str(e)}")
                # We do not raise here because we don't want to mark the whole meeting as 'failed' if only the email failed.
                db.meetings.update_one({"_id": ObjectId(meeting_id)}, {"$set": {"email_status": "failed", "error": f"Email Error: {str(e)}"}})
            
        logger.info(f"✅ Pipeline: Successfully completed processing meeting {meeting_id}")

    except Exception as e:
        logger.error(f"❌ Pipeline failed for meeting {meeting_id}: {e}")
        db.meetings.update_one({"_id": ObjectId(meeting_id)}, {"$set": {"status": "failed", "error": str(e)}})
