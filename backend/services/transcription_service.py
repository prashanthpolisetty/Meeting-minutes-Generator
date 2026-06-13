"""
Transcription Service
Handles audio-to-text transcription using OpenAI Whisper.
"""

import os
import asyncio
import whisper
import logging

logger = logging.getLogger(__name__)

# Global variable to cache the model in memory
_model = None

def _get_whisper_model(model_size: str = "base"):
    """Loads and caches the Whisper model."""
    global _model
    if _model is None:
        logger.info(f"Loading Whisper model ('{model_size}')... This might take a moment.")
        # Load the whisper model
        _model = whisper.load_model(model_size)
        logger.info("Whisper model loaded successfully.")
    return _model

def _transcribe_sync(audio_path: str) -> str:
    """Synchronous function to perform transcription."""
    model = _get_whisper_model()
    logger.info(f"Starting transcription for {audio_path}")
    try:
        if os.path.getsize(audio_path) < 1000:
            return "[Error: The uploaded audio file was empty. Please check your browser microphone permissions if you are recording.]"
            
        result = model.transcribe(audio_path)
        logger.info(f"Transcription complete for {audio_path}")
        text = result.get("text", "").strip()
        if not text:
            return "[Error: The AI determined the audio track was completely silent or empty.]"
        return text
    except Exception as e:
        logger.error(f"Whisper Transcription Exception: {e}")
        return f"[Error: Whisper Transcription failed. Likely an empty or corrupted audio file. Details: {e}]"

async def transcribe_audio(audio_path: str) -> str:
    """
    Transcribe an audio file to text using Whisper.
    Runs in a separate thread to prevent blocking the async event loop.
    """
    if not os.path.exists(audio_path):
        error_msg = f"Audio file not found: {audio_path}"
        logger.error(error_msg)
        raise FileNotFoundError(error_msg)

    # Run the blocking Whisper transcription in a threadpool
    loop = asyncio.get_running_loop()
    transcription = await loop.run_in_executor(None, _transcribe_sync, audio_path)
    
    return transcription.strip()
