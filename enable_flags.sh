#!/bin/bash

echo "🚀 Enabling all feature flags in Suna..."
echo ""

# Run the Python script to enable flags in Redis
echo "📝 Setting flags in Redis..."
docker exec sunadev-backend-1 python3 /app/enable_all_flags.py

# Also run the backend init script
echo "📝 Initializing backend flags..."
docker exec sunadev-backend-1 python3 /app/init_flags.py

# Clear any cached data
echo "🧹 Clearing Redis cache..."
docker exec sunadev-redis-1 redis-cli FLUSHDB

# Re-enable all flags after clearing cache
echo "📝 Re-enabling flags after cache clear..."
docker exec sunadev-backend-1 python3 /app/enable_all_flags.py

# Test the API endpoints
echo ""
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
echo "3. Check browser console for any errors"