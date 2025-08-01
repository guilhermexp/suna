from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import uuid

from services.supabase import DBConnection
from utils.auth_utils import get_current_user_id_from_jwt, verify_thread_access
from utils.logger import logger, structlog

router = APIRouter()
db = DBConnection()

class ToggleFavoriteRequest(BaseModel):
    is_favorite: Optional[bool] = None  # If not provided, will toggle current state

@router.patch("/thread/{thread_id}/favorite")
async def toggle_thread_favorite(
    thread_id: str,
    body: Optional[ToggleFavoriteRequest] = None,
    user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Toggle or set the favorite status of a thread."""
    structlog.contextvars.bind_contextvars(
        thread_id=thread_id,
        user_id=user_id
    )
    
    logger.info(f"Toggling favorite status for thread: {thread_id}")
    
    try:
        client = await db.client
        
        # Verify user has access to this thread
        await verify_thread_access(client, thread_id, user_id)
        
        # If is_favorite is not provided, get current state and toggle it
        if body is None or body.is_favorite is None:
            # Get current favorite status
            thread_result = await client.table('threads').select('is_favorite').eq('thread_id', thread_id).single().execute()
            
            if not thread_result.data:
                raise HTTPException(status_code=404, detail="Thread not found")
            
            current_status = thread_result.data.get('is_favorite', False)
            new_status = not current_status
        else:
            new_status = body.is_favorite
        
        # Update the favorite status
        update_result = await client.table('threads').update({
            'is_favorite': new_status
        }).eq('thread_id', thread_id).execute()
        
        if not update_result.data:
            raise HTTPException(status_code=500, detail="Failed to update favorite status")
        
        logger.info(f"Successfully updated favorite status for thread {thread_id} to {new_status}")
        
        return {
            "thread_id": thread_id,
            "is_favorite": new_status,
            "status": "success"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error toggling favorite status: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/threads")
async def get_threads(
    include_favorites_only: Optional[bool] = False,
    user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Get all threads for the current user, optionally filtered by favorite status."""
    structlog.contextvars.bind_contextvars(
        user_id=user_id,
        include_favorites_only=include_favorites_only
    )
    
    logger.info(f"Fetching threads for user: {user_id}")
    
    try:
        client = await db.client
        
        # Build query
        query = client.table('threads').select(
            'thread_id, account_id, project_id, is_public, is_favorite, created_at, updated_at'
        ).eq('account_id', user_id)
        
        # Apply favorite filter if requested
        if include_favorites_only:
            query = query.eq('is_favorite', True)
        
        # Order by favorites first, then by created_at
        query = query.order('is_favorite', desc=True).order('created_at', desc=True)
        
        result = await query.execute()
        
        logger.info(f"Found {len(result.data)} threads for user {user_id}")
        
        return {
            "threads": result.data,
            "count": len(result.data)
        }
        
    except Exception as e:
        logger.error(f"Error fetching threads: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")