"""
API Keys API Endpoints

This module provides REST API endpoints for managing API keys:
- POST /api/api-keys - Create a new API key
- GET /api/api-keys - List all API keys for the authenticated user
- DELETE /api/api-keys/{key_id} - Revoke/delete an API key
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import List
from uuid import UUID

from services.api_keys import (
    APIKeyService,
    APIKeyCreateRequest,
    APIKeyResponse,
    APIKeyCreateResponse,
)
from services.supabase import DBConnection
from utils.auth_utils import get_current_user_id_from_jwt
from utils.logger import logger
from flags.flags import FeatureFlagManager

router = APIRouter()


async def check_custom_agents_flag():
    """Check if custom_agents feature flag is enabled"""
    flag_manager = FeatureFlagManager()
    is_enabled = await flag_manager.is_enabled("custom_agents")
    if not is_enabled:
        logger.warning("API Keys endpoint accessed but custom_agents flag is disabled")
        raise HTTPException(
            status_code=403, 
            detail="API Keys feature is not enabled. Please enable the 'custom_agents' feature flag."
        )
    return True


async def get_api_key_service() -> APIKeyService:
    """Dependency to get API key service instance"""
    db = DBConnection()
    await db.initialize()
    return APIKeyService(db)


async def get_account_id_from_user_id(user_id: str, api_key_service: APIKeyService) -> UUID:
    """Get account ID from user ID using basejump accounts table"""
    try:
        client = await api_key_service.db.client

        # Query the basejump.accounts table for the user's primary account
        result = (
            await client.schema("basejump")
            .table("accounts")
            .select("id")
            .eq("primary_owner_user_id", user_id)
            .eq("personal_account", True)  # Get the user's personal account
            .limit(1)
            .execute()
        )

        if not result.data:
            logger.error(f"No account found for user_id: {user_id}")
            logger.error(f"Query result: {result}")
            raise HTTPException(status_code=404, detail="User account not found. Make sure you have a personal account in Supabase.")

        return UUID(result.data[0]["id"])
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting account ID for user {user_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get user account: {str(e)}")


@router.post("/api-keys", response_model=APIKeyCreateResponse)
async def create_api_key(
    request: APIKeyCreateRequest,
    user_id: str = Depends(get_current_user_id_from_jwt),
    api_key_service: APIKeyService = Depends(get_api_key_service),
    _: bool = Depends(check_custom_agents_flag),
):
    """
    Create a new API key for the authenticated user

    Args:
        request: API key creation request with title, description, and expiration
        user_id: Authenticated user ID from JWT or API key
        api_key_service: API key service instance

    Returns:
        APIKeyCreateResponse: The newly created API key details including the key value
    """
    try:
        account_id = await get_account_id_from_user_id(user_id, api_key_service)

        logger.info(
            "Creating API key",
            user_id=user_id,
            account_id=str(account_id),
            title=request.title,
        )

        api_key = await api_key_service.create_api_key(account_id, request)

        logger.info(
            "API key created successfully",
            user_id=user_id,
            key_id=str(api_key.key_id),
            title=api_key.title,
        )

        return api_key

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error creating API key: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create API key")


@router.get("/api-keys", response_model=List[APIKeyResponse])
async def list_api_keys(
    user_id: str = Depends(get_current_user_id_from_jwt),
    api_key_service: APIKeyService = Depends(get_api_key_service),
    _: bool = Depends(check_custom_agents_flag),
):
    """
    List all API keys for the authenticated user

    Args:
        user_id: Authenticated user ID from JWT or API key
        api_key_service: API key service instance

    Returns:
        List[APIKeyResponse]: List of API keys (without the actual key values)
    """
    try:
        account_id = await get_account_id_from_user_id(user_id, api_key_service)

        logger.debug("Listing API keys", user_id=user_id, account_id=str(account_id))

        api_keys = await api_key_service.list_api_keys(account_id)

        logger.debug(
            "API keys listed successfully", user_id=user_id, count=len(api_keys)
        )

        return api_keys

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error listing API keys: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to list API keys")


@router.patch("/api-keys/{key_id}/revoke")
async def revoke_api_key(
    key_id: UUID,
    user_id: str = Depends(get_current_user_id_from_jwt),
    api_key_service: APIKeyService = Depends(get_api_key_service),
):
    """
    Revoke an API key

    Args:
        key_id: The ID of the API key to revoke
        user_id: Authenticated user ID from JWT or API key
        api_key_service: API key service instance

    Returns:
        dict: Success message
    """
    try:
        account_id = await get_account_id_from_user_id(user_id, api_key_service)

        logger.info(
            "Revoking API key",
            user_id=user_id,
            account_id=str(account_id),
            key_id=str(key_id),
        )

        success = await api_key_service.revoke_api_key(account_id, key_id)

        if success:
            logger.info(
                "API key revoked successfully", user_id=user_id, key_id=str(key_id)
            )
            return {"message": "API key revoked successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to revoke API key")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error revoking API key: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to revoke API key")


@router.delete("/api-keys/{key_id}")
async def delete_api_key(
    key_id: UUID,
    user_id: str = Depends(get_current_user_id_from_jwt),
    api_key_service: APIKeyService = Depends(get_api_key_service),
):
    """
    Permanently delete an API key

    Args:
        key_id: The ID of the API key to delete
        user_id: Authenticated user ID from JWT or API key
        api_key_service: API key service instance

    Returns:
        dict: Success message
    """
    try:
        account_id = await get_account_id_from_user_id(user_id, api_key_service)

        logger.info(
            "Deleting API key",
            user_id=user_id,
            account_id=str(account_id),
            key_id=str(key_id),
        )

        success = await api_key_service.delete_api_key(account_id, key_id)

        if success:
            logger.info(
                "API key deleted successfully", user_id=user_id, key_id=str(key_id)
            )
            return {"message": "API key deleted successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to delete API key")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error deleting API key: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to delete API key")


@router.get("/api-keys/debug/health")
async def debug_api_keys_health(
    user_id: str = Depends(get_current_user_id_from_jwt),
):
    """
    Debug endpoint to check API keys system health
    """
    health_info = {
        "user_id": user_id,
        "checks": {}
    }
    
    try:
        # Check database connection
        db = DBConnection()
        await db.initialize()
        client = await db.client
        health_info["checks"]["database_connection"] = "OK"
        
        # Check if api_keys table exists
        table_check = await client.table("api_keys").select("key_id").limit(1).execute()
        health_info["checks"]["api_keys_table"] = "OK"
        
        # Check basejump schema
        basejump_check = await client.schema("basejump").table("accounts").select("id").limit(1).execute()
        health_info["checks"]["basejump_schema"] = "OK"
        
        # Try to get account ID
        try:
            api_key_service = APIKeyService(db)
            account_id = await get_account_id_from_user_id(user_id, api_key_service)
            health_info["checks"]["account_lookup"] = "OK"
            health_info["account_id"] = str(account_id)
        except Exception as e:
            health_info["checks"]["account_lookup"] = f"FAILED: {str(e)}"
            
        # Check API_KEY_SECRET configuration
        from utils.config import config
        health_info["checks"]["api_key_secret_configured"] = (
            "OK" if config.API_KEY_SECRET != "default-secret-key-change-in-production" 
            else "WARNING: Using default secret"
        )
        
        return health_info
        
    except Exception as e:
        health_info["checks"]["error"] = str(e)
        logger.error(f"Health check failed: {e}", exc_info=True)
        return health_info
