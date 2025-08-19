#!/bin/bash

# Quick version - sem remover imagens, mais rápido
# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      SUNA QUICK UPDATE SCRIPT        ║${NC}"
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
git commit -m "Quick update: $(date '+%Y-%m-%d %H:%M:%S')" 2>/dev/null
git push origin main 2>/dev/null || git push 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Changes pushed successfully${NC}"
else
    echo -e "${YELLOW}⚠️  No changes to push or push failed${NC}"
fi
echo ""

# 3. Restart containers with rebuild
echo -e "${YELLOW}🔄 Rebuilding and restarting services...${NC}"
docker-compose down
docker-compose up -d --build
echo -e "${GREEN}✅ Services restarted${NC}"
echo ""

# 4. Show running containers
echo -e "${BLUE}📊 Running containers:${NC}"
docker-compose ps
echo ""

echo -e "${GREEN}╔══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   QUICK UPDATE COMPLETED SUCCESSFULLY ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Services available at:${NC}"
echo -e "  Frontend: ${GREEN}http://localhost:3000${NC}"
echo -e "  Backend:  ${GREEN}http://localhost:8000${NC}"
echo ""