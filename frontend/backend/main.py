"""
FastAPI backend for Notes and Chat functionality
"""

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import socketio
from typing import Optional
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import routers (you'll need to adapt these imports)
try:
    from routers import notes, chats
    from socket import main as socket_main
except ImportError:
    print("Warning: Some modules not found. Please check imports.")
    notes = None
    chats = None
    socket_main = None

# Database setup (you'll need to configure this)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./notes.db")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting up...")
    # Initialize database connection here
    yield
    # Shutdown
    print("Shutting down...")
    # Close database connection here

# Create FastAPI app
app = FastAPI(
    title="Notes & Chat API",
    description="Backend API for Notes and Chat functionality",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js dev server
        "http://localhost:3001",  # Alternative port
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Socket.IO setup
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins="*",
    logger=True,
    engineio_logger=True
)

# Combine Socket.IO with FastAPI
socket_app = socketio.ASGIApp(sio, app)

# Include routers
if notes:
    app.include_router(notes.router, prefix="/api/notes", tags=["notes"])
if chats:
    app.include_router(chats.router, prefix="/api/chats", tags=["chats"])

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "notes-chat-backend"}

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Notes & Chat API",
        "endpoints": {
            "notes": "/api/notes",
            "chats": "/api/chats",
            "health": "/health",
            "docs": "/docs",
            "redoc": "/redoc"
        }
    }

# Socket.IO events
@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")
    await sio.emit('welcome', {'message': 'Connected to chat server'}, to=sid)

@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")

@sio.event
async def join_room(sid, data):
    room = data.get('room')
    if room:
        sio.enter_room(sid, room)
        await sio.emit('joined_room', {'room': room}, to=sid)
        print(f"Client {sid} joined room {room}")

@sio.event
async def leave_room(sid, data):
    room = data.get('room')
    if room:
        sio.leave_room(sid, room)
        await sio.emit('left_room', {'room': room}, to=sid)
        print(f"Client {sid} left room {room}")

@sio.event
async def send_message(sid, data):
    """Handle chat messages"""
    room = data.get('room')
    message = data.get('message')
    user = data.get('user')
    
    if room and message:
        # Broadcast message to room
        await sio.emit('new_message', {
            'message': message,
            'user': user,
            'timestamp': str(datetime.now())
        }, room=room, skip_sid=sid)
        
        # You can also save to database here
        print(f"Message from {sid} in room {room}: {message}")

@sio.event
async def typing(sid, data):
    """Handle typing indicators"""
    room = data.get('room')
    user = data.get('user')
    
    if room:
        await sio.emit('user_typing', {
            'user': user
        }, room=room, skip_sid=sid)

@sio.event
async def stop_typing(sid, data):
    """Handle stop typing indicators"""
    room = data.get('room')
    user = data.get('user')
    
    if room:
        await sio.emit('user_stopped_typing', {
            'user': user
        }, room=room, skip_sid=sid)

# Example note creation without full model (for testing)
from pydantic import BaseModel
from datetime import datetime
from typing import List

class NoteCreate(BaseModel):
    title: str
    content: str
    tags: List[str] = []

class NoteResponse(BaseModel):
    id: str
    title: str
    content: str
    tags: List[str]
    created_at: datetime
    updated_at: datetime
    is_starred: bool = False

# Temporary in-memory storage (replace with database)
notes_storage = {}

@app.post("/api/notes/test", response_model=NoteResponse)
async def create_test_note(note: NoteCreate):
    """Test endpoint for note creation"""
    import uuid
    
    note_id = str(uuid.uuid4())
    now = datetime.now()
    
    new_note = {
        "id": note_id,
        "title": note.title,
        "content": note.content,
        "tags": note.tags,
        "created_at": now,
        "updated_at": now,
        "is_starred": False
    }
    
    notes_storage[note_id] = new_note
    
    return NoteResponse(**new_note)

@app.get("/api/notes/test")
async def get_test_notes():
    """Test endpoint to get all notes"""
    return list(notes_storage.values())

if __name__ == "__main__":
    import uvicorn
    
    # Run with: python main.py
    uvicorn.run(
        "main:socket_app",  # Use socket_app to include WebSocket support
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )