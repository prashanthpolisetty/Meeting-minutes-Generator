"""
Email Routes
Handles API endpoints for email operations:
- Send meeting minutes via email
- Resend email
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from bson.objectid import ObjectId
from backend.database.mongo import get_db
from backend.services.email_service import send_meeting_email

router = APIRouter(prefix="/api/email", tags=["Email"])

@router.post("/resend/{meeting_id}")
async def resend_email(meeting_id: str, background_tasks: BackgroundTasks):
    db = get_db()
    try:
        meeting = db.meetings.find_one({"_id": ObjectId(meeting_id)})
        if not meeting:
            raise HTTPException(status_code=404, detail="Meeting not found")
            
        recipients = meeting.get("participants", [])
        if not recipients:
            raise HTTPException(status_code=400, detail="No participants found to send email to")
            
        email_payload = {
            "agenda": meeting.get("agenda", ""),
            "summary": meeting.get("summary", ""),
            "action_items": meeting.get("action_items", []),
            "key_decisions": meeting.get("key_decisions", []),
            "candidates": meeting.get("candidates", []),
            "best_candidate_index": meeting.get("best_candidate_index", 0),
            "best_candidate_reasoning": meeting.get("best_candidate_reasoning", "")
        }
        
        # Dispatch in background so the API returns quickly
        background_tasks.add_task(send_meeting_email, recipients, email_payload)
        
        return {"message": "Email dispatch triggered successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
