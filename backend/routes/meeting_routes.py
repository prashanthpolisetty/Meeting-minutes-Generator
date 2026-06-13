"""
Meeting Routes
Handles API endpoints for meeting operations:
- Upload audio
- Get meeting details
- List all meetings
"""

import os
import shutil
from fastapi import APIRouter, File, UploadFile, Form, BackgroundTasks, HTTPException
from typing import List
from bson.objectid import ObjectId
from backend.database.mongo import get_db
from backend.services.processing_pipeline import process_meeting
from backend.config.settings import settings

router = APIRouter(prefix="/api/meetings", tags=["Meetings"])

@router.post("/upload")
async def upload_meeting(
    background_tasks: BackgroundTasks,
    title: str = Form(...),
    participants: str = Form(""),
    file: UploadFile = File(...)
):
    """Upload an audio file, create database skeleton, and fire the background pipeline."""
    settings.ensure_storage_dirs()

    # Save the file locally using a safe ObjectID to avoid collisions
    file_extension = os.path.splitext(file.filename)[1]
    unique_id = ObjectId()
    safe_filename = f"meeting_{unique_id}{file_extension}"
    file_path = settings.AUDIO_DIR / safe_filename
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    participant_list = [email.strip() for email in participants.split(",") if email.strip()]

    # Insert initial pending record to DB
    db = get_db()
    meeting_record = {
        "_id": unique_id,
        "title": title,
        "participants": participant_list,
        "audio_path": str(file_path),
        "status": "pending",
        "transcript": None,
        "summary": None,
        "action_items": [],
        "key_decisions": [],
        "error": None
    }
    
    db.meetings.insert_one(meeting_record)
    meeting_id = str(unique_id)
    
    # Trigger the autonomous pipeline as an async background task
    # This prevents the user from having to sit and wait on an HTTP threshold
    background_tasks.add_task(process_meeting, meeting_id)
    
    return {
        "message": "Meeting successfully uploaded. Processing has begun.", 
        "meeting_id": meeting_id
    }


@router.get("/")
def list_meetings():
    """List all meetings in the system."""
    db = get_db()
    meetings = []
    # Find all, sorting by _id descending gives us the latest first
    for m in db.meetings.find().sort("_id", -1):
        m["_id"] = str(m["_id"])
        meetings.append(m)
    return {"meetings": meetings}


@router.get("/{meeting_id}")
def get_meeting(meeting_id: str):
    """Retrieve full details for a single meeting by its ID."""
    db = get_db()
    try:
        meeting = db.meetings.find_one({"_id": ObjectId(meeting_id)})
        if not meeting:
            raise HTTPException(status_code=404, detail="Meeting not found")
        meeting["_id"] = str(meeting["_id"])
        return meeting
    except Exception:
         raise HTTPException(status_code=400, detail="Invalid Meeting ID Format")
