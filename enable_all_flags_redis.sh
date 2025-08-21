#!/bin/bash

echo "🚀 Enabling all feature flags directly in Redis..."
echo ""

# List of all feature flags
FLAGS=(
    "custom_agents"
    "knowledge_base"
    "quick_actions"
    "playground"
    "canvas"
    "assistant_file_search"
    "prompt_improver"
    "advanced_agent_settings"
    "workflow_triggers"
    "composio_integration"
    "mcp_servers"
    "marketplace"
    "one_click_deploy"
    "playbooks"
    "composio_connections"
    "new_chat_ux"
    "thread_forking"
    "thread_sharing"
    "auth_management"
    "scheduled_tasks"
    "mcp_module"
    "templates_api"
    "triggers_api"
    "workflows_api"
    "pipedream"
    "credentials_api"
    "suna_default_agent"
)

# Enable each flag in Redis
for flag in "${FLAGS[@]}"; do
    echo "✅ Enabling: $flag"
    
    # Set the flag data using Redis hash
    docker exec sunadev-redis-1 redis-cli HSET "feature_flag:$flag" enabled "true" description "Auto-enabled flag: $flag" updated_at "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)" > /dev/null
    
    # Add to the list of flags
    docker exec sunadev-redis-1 redis-cli SADD "feature_flags:list" "$flag" > /dev/null
    
    # Set in edge config format
    docker exec sunadev-redis-1 redis-cli SET "edge_flag:$flag" "true" > /dev/null
done

# Create a JSON object with all flags enabled
JSON_FLAGS="{"
for i in "${!FLAGS[@]}"; do
    if [ $i -ne 0 ]; then
        JSON_FLAGS+=","
    fi
    JSON_FLAGS+="\"${FLAGS[$i]}\":true"
done
JSON_FLAGS+="}"

# Set the edge_config:flags with all flags enabled
echo "$JSON_FLAGS" | docker exec -i sunadev-redis-1 redis-cli -x SET "edge_config:flags" > /dev/null

echo ""
echo "✨ All ${#FLAGS[@]} feature flags have been enabled in Redis!"
echo ""

# Test the API endpoints
echo "🔍 Testing API endpoints..."
echo "Testing /api/feature-flags:"
curl -s http://localhost:8000/api/feature-flags | python3 -m json.tool | head -20

echo ""
echo "Testing /api/feature-flags/custom_agents:"
curl -s http://localhost:8000/api/feature-flags/custom_agents | python3 -m json.tool

echo ""
echo "✅ Feature flags have been enabled!"
echo "🔄 Please refresh your browser at http://localhost:3000"
echo ""
echo "If features still don't appear, try:"
echo "1. Clear browser cache (Cmd+Shift+R on Mac)"
echo "2. Open in incognito/private window"
echo "3. Restart the frontend: docker-compose restart frontend"