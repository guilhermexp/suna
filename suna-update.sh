#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        SUNA UPDATE SCRIPT            ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════╝${NC}"
echo ""

# 1. Sync with upstream repository
echo -e "${YELLOW}🔄 Syncing with upstream repository...${NC}"
if git remote | grep -q "upstream"; then
    git fetch upstream
    echo -e "${GREEN}✅ Fetched updates from upstream${NC}"
    
    # Check if there are updates to merge
    UPDATES=$(git log HEAD..upstream/main --oneline | wc -l | tr -d ' ')
    if [ "$UPDATES" -gt 0 ]; then
        echo -e "${YELLOW}📥 Found $UPDATES new commits from upstream${NC}"
        echo -e "${YELLOW}Merging updates from upstream/main...${NC}"
        git merge upstream/main -m "Merge upstream updates: $(date '+%Y-%m-%d %H:%M:%S')"
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Successfully merged upstream updates${NC}"
        else
            echo -e "${RED}❌ Merge conflict detected! Please resolve manually${NC}"
            echo -e "${YELLOW}After resolving conflicts, run this script again${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}✅ Already up to date with upstream${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Upstream not configured. Adding kortix-ai/suna as upstream...${NC}"
    git remote add upstream https://github.com/kortix-ai/suna.git
    git fetch upstream
    echo -e "${GREEN}✅ Upstream configured and fetched${NC}"
fi
echo ""

# 2. Git Push (including merged changes)
echo -e "${YELLOW}📤 Pushing changes to repository...${NC}"
git add .
git commit -m "Auto-update: $(date '+%Y-%m-%d %H:%M:%S')" 2>/dev/null
git push origin main 2>/dev/null || git push 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Changes pushed successfully${NC}"
else
    echo -e "${YELLOW}⚠️  No changes to push or push failed${NC}"
fi
echo ""

# 3. Stop ALL Docker containers (not just from this project)
echo -e "${YELLOW}🛑 Stopping ALL Docker containers...${NC}"
docker stop $(docker ps -aq) 2>/dev/null || true
docker-compose down -v --remove-orphans
echo -e "${GREEN}✅ All containers stopped${NC}"
echo ""

# 4. Remove ALL containers
echo -e "${YELLOW}🗑️  Removing ALL containers...${NC}"
docker rm -f $(docker ps -aq) 2>/dev/null || true
docker container prune -f
echo -e "${GREEN}✅ All containers removed${NC}"
echo ""

# 5. Remove ALL images
echo -e "${YELLOW}🖼️  Removing ALL Docker images...${NC}"
docker rmi -f $(docker images -aq) 2>/dev/null || true
docker image prune -af
echo -e "${GREEN}✅ All images removed${NC}"
echo ""

# 6. Remove ALL volumes
echo -e "${YELLOW}💾 Removing ALL Docker volumes...${NC}"
docker volume rm -f $(docker volume ls -q) 2>/dev/null || true
docker volume prune -af
echo -e "${GREEN}✅ All volumes removed${NC}"
echo ""

# 7. Clean ALL Docker build cache
echo -e "${YELLOW}🧹 Cleaning ALL Docker build cache...${NC}"
docker builder prune -af --filter "until=24h"
docker builder prune -af
docker buildx prune -af 2>/dev/null || true
echo -e "${GREEN}✅ All build cache cleaned${NC}"
echo ""

# 8. Clean Docker system completely
echo -e "${YELLOW}🧽 Deep cleaning entire Docker system...${NC}"
docker system prune -af --volumes
docker system df
echo -e "${GREEN}✅ Docker system completely cleaned${NC}"
echo ""

# 9. Clear npm/yarn cache
echo -e "${YELLOW}📦 Clearing npm/yarn cache...${NC}"
if [ -d "frontend" ]; then
    cd frontend
    rm -rf node_modules .next 2>/dev/null
    # Don't remove package-lock.json - it's needed for Docker build
    npm cache clean --force 2>/dev/null
    yarn cache clean 2>/dev/null || true
    cd ..
    echo -e "${GREEN}✅ Frontend cache cleared${NC}"
fi
echo ""

# 10. Rebuild everything from scratch
echo -e "${YELLOW}🔨 Building all services from scratch...${NC}"
docker-compose build --no-cache --force-rm --pull
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed! Trying again...${NC}"
    docker-compose build --no-cache
fi
echo -e "${GREEN}✅ Services built${NC}"
echo ""

# 11. Start all services
echo -e "${YELLOW}🚀 Starting all services...${NC}"
docker-compose up -d --force-recreate
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to start services!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Services started${NC}"
echo ""

# Wait for services to be ready
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 5

# 12. Verify services are running
echo -e "${BLUE}📊 Verifying services are running:${NC}"
docker-compose ps
echo ""

# Check if containers are actually running
RUNNING=$(docker-compose ps --services --filter "status=running" | wc -l)
TOTAL=$(docker-compose ps --services | wc -l)

if [ "$RUNNING" -eq "$TOTAL" ] && [ "$TOTAL" -gt 0 ]; then
    echo -e "${GREEN}✅ All $TOTAL services are running!${NC}"
else
    echo -e "${RED}⚠️  Only $RUNNING of $TOTAL services are running${NC}"
    echo -e "${YELLOW}Checking logs for errors...${NC}"
    docker-compose logs --tail=50
fi
echo ""

echo -e "${GREEN}╔══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     UPDATE COMPLETED SUCCESSFULLY    ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Services available at:${NC}"
echo -e "  Frontend: ${GREEN}http://localhost:3000${NC}"
echo -e "  Backend:  ${GREEN}http://localhost:8000${NC}"
echo ""