#!/usr/bin/env python3
"""Test script to verify feature flags are working correctly"""

import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flags import is_enabled, list_flags

async def test_flags():
    """Test that all self-hosting flags are properly enabled"""
    print("Testing Feature Flags Status")
    print("=" * 60)
    
    # Expected flags for self-hosting
    expected_flags = [
        "custom_agents",
        "agent_marketplace", 
        "knowledge_base",
        "agent_triggers"
    ]
    
    # Get all flags
    all_flags = await list_flags()
    print(f"Total flags found: {len(all_flags)}")
    print()
    
    # Check each expected flag
    all_enabled = True
    for flag_name in expected_flags:
        enabled = await is_enabled(flag_name)
        status = "✓ ENABLED" if enabled else "✗ DISABLED"
        print(f"{flag_name}: {status}")
        if not enabled:
            all_enabled = False
    
    print()
    print("Other flags:")
    for flag_name, enabled in all_flags.items():
        if flag_name not in expected_flags:
            status = "✓ ENABLED" if enabled else "✗ DISABLED" 
            print(f"{flag_name}: {status}")
    
    print("=" * 60)
    if all_enabled:
        print("✓ All self-hosting feature flags are properly enabled!")
        return True
    else:
        print("✗ Some self-hosting feature flags are not enabled.")
        print("Run 'python enable_self_hosting_flags.py' to enable them.")
        return False

async def main():
    try:
        success = await test_flags()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())