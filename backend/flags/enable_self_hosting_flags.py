#!/usr/bin/env python3
"""
Enable all feature flags for self-hosting.
This script enables all feature flags that are typically disabled by default.
"""

import asyncio
import sys
from flags import enable_flag, list_flags

# List of all feature flags that should be enabled for self-hosting
SELF_HOSTING_FLAGS = [
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

async def enable_all_flags():
    """Enable all feature flags for self-hosting"""
    print("Enabling all feature flags for self-hosting...")
    print("-" * 60)
    
    success_count = 0
    failed_count = 0
    
    for flag in SELF_HOSTING_FLAGS:
        try:
            result = await enable_flag(flag["name"], flag["description"])
            if result:
                print(f"✓ Enabled: {flag['name']}")
                print(f"  Description: {flag['description']}")
                success_count += 1
            else:
                print(f"✗ Failed to enable: {flag['name']}")
                failed_count += 1
        except Exception as e:
            print(f"✗ Error enabling {flag['name']}: {str(e)}")
            failed_count += 1
        print()
    
    print("-" * 60)
    print(f"Summary: {success_count} flags enabled, {failed_count} failed")
    
    # List all flags to confirm
    print("\nCurrent feature flags status:")
    print("-" * 60)
    flags = await list_flags()
    for flag_name, enabled in flags.items():
        status_icon = "✓" if enabled else "✗"
        status_text = "ENABLED" if enabled else "DISABLED"
        print(f"{status_icon} {flag_name}: {status_text}")
    
    return success_count == len(SELF_HOSTING_FLAGS)

async def main():
    """Main function"""
    try:
        success = await enable_all_flags()
        if success:
            print("\n✓ All self-hosting feature flags have been enabled successfully!")
            sys.exit(0)
        else:
            print("\n⚠ Some feature flags could not be enabled. Please check the errors above.")
            sys.exit(1)
    except KeyboardInterrupt:
        print("\nOperation cancelled.")
        sys.exit(1)
    except Exception as e:
        print(f"\nError: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())