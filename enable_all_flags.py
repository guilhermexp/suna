#!/usr/bin/env python3
import asyncio
import redis.asyncio as redis
import json
from datetime import datetime

async def enable_all_flags():
    """Enable all feature flags in Redis"""
    
    # Connect to Redis
    r = await redis.Redis(host='localhost', port=6379, decode_responses=True)
    
    # List of all feature flags to enable
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
        'voice_mode',
        'agent_templates',
        'agent_library',
        'web_search',
        'code_interpreter',
        'function_calling',
        'streaming',
        'file_upload',
        'image_generation',
        'embeddings',
        'vector_search',
        'multi_modal',
        'realtime_collaboration',
        'analytics_dashboard',
        'billing_management',
        'team_management',
        'api_keys_management',
        'webhook_integration',
        'slack_integration',
        'discord_integration',
        'github_integration',
        'google_drive_integration',
        'notion_integration',
        'linear_integration',
        'jira_integration',
        'confluence_integration',
        'zapier_integration',
        'make_integration'
    ]
    
    print("🚀 Enabling all feature flags...")
    
    for flag in flags:
        flag_key = f"feature_flag:{flag}"
        flag_data = {
            'enabled': 'true',
            'description': f'Auto-enabled flag: {flag}',
            'updated_at': datetime.utcnow().isoformat()
        }
        
        # Set the flag data
        await r.hset(flag_key, mapping=flag_data)
        
        # Add to the list of flags
        await r.sadd("feature_flags:list", flag)
        
        print(f"✅ Enabled: {flag}")
    
    # Also set in the Edge Config format
    edge_config = {flag: True for flag in flags}
    await r.set("edge_config:flags", json.dumps(edge_config))
    
    # Set individual edge flags
    for flag in flags:
        await r.set(f"edge_flag:{flag}", "true")
    
    print("\n✨ All feature flags have been enabled!")
    print("🔄 Please refresh your browser to see the changes.")
    
    await r.close()

if __name__ == "__main__":
    asyncio.run(enable_all_flags())