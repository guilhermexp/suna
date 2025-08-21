#!/usr/bin/env python3
"""
Script to enable the custom_agents feature flag in Redis
"""
import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from flags.flags import FeatureFlagManager

async def main():
    manager = FeatureFlagManager()
    
    # Enable custom_agents feature flag
    result = await manager.set_flag(
        key="custom_agents",
        enabled=True,
        description="Enable custom agents functionality"
    )
    
    if result:
        print("✅ Successfully enabled custom_agents feature flag")
        
        # Verify it's enabled
        is_enabled = await manager.is_enabled("custom_agents")
        print(f"Verification: custom_agents is {'enabled' if is_enabled else 'disabled'}")
        
        # List all flags
        all_flags = await manager.list_flags()
        print(f"\nAll feature flags: {all_flags}")
    else:
        print("❌ Failed to enable custom_agents feature flag")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())