"""
Processing Pipeline
Orchestrates the autonomous flow: Audio -> Transcription -> LLM -> Database -> Email
"""

import os
import logging
import asyncio
from bson.objectid import ObjectId
from backend.config.settings import settings
from backend.database.mongo import get_db
from backend.services.transcription_service import transcribe_audio
from backend.services.llm_service import generate_meeting_minutes_for_model, judge_candidates
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

        # 3. LLM Summarization Agent Execution (Multi-LLM + Judge)
        logger.info(f"Pipeline: Executing Summarization Agents for {meeting_id}...")
        
        # Configure models to run
        candidates_config = [
            {"name": "Gemini 1.5 Flash", "provider": settings.LLM_1_PROVIDER, "model": settings.LLM_1_MODEL},
            {"name": "LLaMA 3.1 8B", "provider": settings.LLM_2_PROVIDER, "model": settings.LLM_2_MODEL},
            {"name": "Mixtral 8x7B", "provider": settings.LLM_3_PROVIDER, "model": settings.LLM_3_MODEL}
        ]

        # Helper task for concurrent execution with error resilience
        async def safe_generate(conf):
            try:
                res = await generate_meeting_minutes_for_model(transcript, conf["provider"], conf["model"])
                return {
                    "model_name": conf["name"],
                    "provider": conf["provider"],
                    "model_id": conf["model"],
                    "agenda": res.get("agenda", "No agenda generated."),
                    "summary": res.get("summary", "No summary generated."),
                    "action_items": res.get("action_items", []),
                    "key_decisions": res.get("key_decisions", []),
                    "error": None
                }
            except Exception as ex:
                logger.error(f"Generation failed for model {conf['name']} ({conf['model']}): {ex}")
                return {
                    "model_name": conf["name"],
                    "provider": conf["provider"],
                    "model_id": conf["model"],
                    "agenda": "Failed to generate agenda.",
                    "summary": f"Failed to generate: {str(ex)}",
                    "action_items": [],
                    "key_decisions": [],
                    "error": str(ex)
                }

        # Run all 3 LLM models concurrently
        tasks = [safe_generate(conf) for conf in candidates_config]
        candidates = await asyncio.gather(*tasks)

        # Check if all models failed
        if all(c["error"] is not None for c in candidates):
            raise RuntimeError("All LLM models failed to generate minutes.")

        # 3.5. Execute the Judge LLM
        logger.info(f"Pipeline: Executing Judge LLM to evaluate candidates for {meeting_id}...")
        try:
            judge_res = await judge_candidates(transcript, candidates)
            best_idx = int(judge_res.get("best_index", 0))
            if best_idx < 0 or best_idx >= len(candidates):
                logger.warning(f"Judge returned out of bounds index {best_idx}. Defaulting to 0.")
                best_idx = 0
            reasoning = judge_res.get("reasoning", "Chosen by default.")
        except Exception as e:
            logger.error(f"Judge LLM failed: {e}. Defaulting to Candidate 0.")
            best_idx = 0
            reasoning = f"Judge failed to evaluate. Defaulted to candidate 0. Details: {str(e)}"

        # Get winner content
        winner = candidates[best_idx]
        agenda = winner.get("agenda", "No agenda generated.")
        summary = winner.get("summary", "No summary generated.")
        action_items = winner.get("action_items", [])
        key_decisions = winner.get("key_decisions", [])

        update_data = {
            "agenda": agenda,
            "summary": summary,
            "action_items": action_items,
            "key_decisions": key_decisions,
            "candidates": candidates,
            "best_candidate_index": best_idx,
            "best_candidate_reasoning": reasoning,
            "status": "completed"
        }
        
        # Save final minutes to DB
        db.meetings.update_one({"_id": ObjectId(meeting_id)}, {"$set": update_data})
        logger.info(f"Pipeline: Summary and candidates saved to DB for {meeting_id}.")

        # 4. Email Notification Agent Execution
        recipients = meeting.get("participants", [])
        if recipients:
            logger.info(f"Pipeline: Executing Email Agent for {meeting_id}...")
            # We bundle the full data so the email agent can format it with candidates
            email_payload = {
                "agenda": agenda,
                "summary": summary,
                "action_items": action_items,
                "key_decisions": key_decisions,
                "candidates": candidates,
                "best_candidate_index": best_idx,
                "best_candidate_reasoning": reasoning
            }
            try:
                await send_meeting_email(recipients, email_payload)
            except Exception as e:
                logger.error(f"Email Dispatch failed: {str(e)}")
                db.meetings.update_one({"_id": ObjectId(meeting_id)}, {"$set": {"email_status": "failed", "error": f"Email Error: {str(e)}"}})
            
        logger.info(f"✅ Pipeline: Successfully completed processing meeting {meeting_id}")

    except Exception as e:
        logger.error(f"❌ Pipeline failed for meeting {meeting_id}: {e}")
        db.meetings.update_one({"_id": ObjectId(meeting_id)}, {"$set": {"status": "failed", "error": str(e)}})
