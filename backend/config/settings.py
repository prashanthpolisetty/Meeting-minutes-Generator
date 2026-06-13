"""
Application Settings Module
Loads environment variables from .env and exposes them as a configuration object.
All backend modules should import settings from here.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from project root
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)


class Settings:
    """Central configuration class for the application."""

    # MongoDB
    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017/meeting_minutes_db")
    DATABASE_NAME: str = "meeting_minutes_db"

    # Google Gemini API
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

    # LLM Provider selection: gemini, groq
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "groq")

    # Groq API Configuration (Online Cloud Model)
    GROQ_URL: str = os.getenv("GROQ_URL", "https://api.groq.com/openai/v1/chat/completions")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")

    # SMTP Email Configuration
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASS: str = os.getenv("SMTP_PASS", "")

    # Storage Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    STORAGE_DIR: Path = BASE_DIR / "storage"
    AUDIO_DIR: Path = STORAGE_DIR / "audio"
    TRANSCRIPTS_DIR: Path = STORAGE_DIR / "transcripts"
    OUTPUT_DIR: Path = STORAGE_DIR / "output"

    @classmethod
    def ensure_storage_dirs(cls):
        """Create storage directories if they don't exist."""
        cls.AUDIO_DIR.mkdir(parents=True, exist_ok=True)
        cls.TRANSCRIPTS_DIR.mkdir(parents=True, exist_ok=True)
        cls.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# Singleton instance — import this across the app
settings = Settings()
