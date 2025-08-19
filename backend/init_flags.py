#!/usr/bin/env python3
import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from flags.flags import set_flag

async def init_all_flags():
    """Initialize all feature flags to enabled"""
    
    flags = [
        'custom_agents',
        'knowledge_base', 
        'quick_actions',
        'playground',
        'canvas',
        'assistant_file_search',
        'prompt_improver',
        'advanced_agent_settings',
        'workflow_triggers',
        'composio_integration',
        'mcp_servers',
        'marketplace',
        'one_click_deploy',
        'playbooks',
        'composio_connections',
        'new_chat_ux',
        'thread_forking',
        'thread_sharing',
        'auth_management',
        'scheduled_tasks',
        'mcp_module',
        'templates_api',
        'triggers_api',
        'workflows_api',
        'pipedream',
        'credentials_api',
        'suna_default_agent'
    ]
    
    print("🚀 Initializing all feature flags...")
    
    for flag in flags:
        success = await set_flag(flag, True, f"Auto-enabled: {flag}")
        if success:
            print(f"✅ Enabled: {flag}")
        else:
            print(f"❌ Failed to enable: {flag}")
    
    print("\n✨ All feature flags initialized!")

if __name__ == "__main__":
    asyncio.run(init_all_flags())