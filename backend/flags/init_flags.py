"""
Initialize feature flags for self-hosting environments.
This module automatically enables all necessary feature flags when running in self-hosted mode.
"""

import os
import asyncio
import logging
from typing import List, Dict

from flags import enable_flag, is_enabled

logger = logging.getLogger(__name__)

# List of feature flags that should be enabled for self-hosting
SELF_HOSTING_FLAGS: List[Dict[str, str]] = [
    {
        "name": "custom_agents",
        "description": "Enable custom agent creation and management"
    },
    {
        "name": "agent_marketplace", 
        "description": "Enable agent marketplace for sharing and discovering agents"
    },
    {
        "name": "knowledge_base",
        "description": "Enable knowledge base feature for agents"
    },
    {
        "name": "agent_triggers",
        "description": "Enable agent triggers for automated workflows"
    }
]

async def init_self_hosting_flags() -> None:
    """
    Initialize feature flags for self-hosting environments.
    This function checks if we're in a self-hosted environment and enables all necessary flags.
    """
    # Check if we're in a self-hosted environment
    # You can customize this check based on your deployment setup
    is_self_hosted = os.environ.get("SELF_HOSTED", "false").lower() == "true"
    
    # Also check for common self-hosting indicators
    if not is_self_hosted:
        # If no SELF_HOSTED env var, check for absence of cloud provider indicators
        is_cloud_hosted = any([
            os.environ.get("VERCEL_ENV"),
            os.environ.get("NETLIFY"),
            os.environ.get("RENDER"), 
            os.environ.get("RAILWAY_PROJECT_ID"),
            os.environ.get("FLY_APP_NAME"),
            os.environ.get("HEROKU_APP_NAME"),
        ])
        is_self_hosted = not is_cloud_hosted
    
    if not is_self_hosted:
        logger.info("Running in cloud environment, skipping self-hosting flag initialization")
        return
    
    logger.info("Detected self-hosted environment, initializing feature flags...")
    
    for flag in SELF_HOSTING_FLAGS:
        try:
            # Check if flag is already enabled
            if await is_enabled(flag["name"]):
                logger.info(f"Feature flag '{flag['name']}' is already enabled")
                continue
            
            # Enable the flag
            result = await enable_flag(flag["name"], flag["description"])
            if result:
                logger.info(f"Enabled feature flag: {flag['name']}")
            else:
                logger.warning(f"Failed to enable feature flag: {flag['name']}")
        except Exception as e:
            logger.error(f"Error enabling feature flag '{flag['name']}': {str(e)}")

def init_flags_sync() -> None:
    """
    Synchronous wrapper for flag initialization.
    This can be called during application startup.
    """
    try:
        asyncio.run(init_self_hosting_flags())
    except Exception as e:
        logger.error(f"Failed to initialize self-hosting flags: {str(e)}")

# Optional: Auto-initialize on module import if SELF_HOSTED is set
if __name__ == "__main__":
    init_flags_sync()