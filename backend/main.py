"""
Meeting Minutes AI — FastAPI Application Entry Point
Run with: uvicorn backend.main:app --reload
"""

import sys

# Reconfigure stdout and stderr to handle UTF-8 symbols on Windows consoles
for stream in (sys.stdout, sys.stderr):
    if stream and hasattr(stream, "reconfigure"):
        try:
            stream.reconfigure(encoding="utf-8")
        except Exception:
            pass

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config.settings import settings

# Initialize FastAPI app
app = FastAPI(
    title="Meeting Minutes AI",
    description="AI-powered autonomous meeting minutes generator",
    version="1.0.0",
)

# CORS middleware — allows frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Run on application startup."""
    # Ensure storage directories exist
    settings.ensure_storage_dirs()
    print("✅ Meeting Minutes AI server started")
    print(f"📁 Storage directory: {settings.STORAGE_DIR}")


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "running",
        "app": "Meeting Minutes AI",
        "version": "1.0.0",
    }


# Routes will be registered here in Phase 2
from backend.routes import meeting_routes
from backend.routes import email_routes
app.include_router(meeting_routes.router)
app.include_router(email_routes.router)
