"""
Meeting Data Models
Defines the schema for how meetings are represented in the API and Database.
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class MeetingBase(BaseModel):
    title: str
    date: datetime = Field(default_factory=datetime.utcnow)
    participants: List[str] = []

class MeetingCreate(MeetingBase):
    pass

class MeetingResponse(MeetingBase):
    id: str = Field(alias="_id")
    status: str = "pending" # pending, processing, completed, failed
    audio_path: Optional[str] = None
    transcript: Optional[str] = None
    agenda: Optional[str] = None
    summary: Optional[str] = None
    action_items: List[str] = []
    key_decisions: List[str] = []
    error: Optional[str] = None

    class Config:
        populate_by_name = True
