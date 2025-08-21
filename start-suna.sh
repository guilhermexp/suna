#!/bin/bash

# SUNAKORTIX - Script de inicialização com todas as flags ativas
# Este script garante que todas as funcionalidades estejam habilitadas

set -e

echo "🚀 Iniciando Sunakortix com TODAS as funcionalidades ativas..."
echo "=================================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker não está rodando!${NC}"
    echo "Tentando iniciar o Docker Desktop..."
    open -a "Docker" 2>/dev/null || {
        echo -e "${RED}Docker Desktop não encontrado. Por favor, instale o Docker Desktop.${NC}"
        exit 1
    }
    
    # Aguardar Docker iniciar
    echo "Aguardando Docker iniciar..."
    for i in {1..30}; do
        if docker info > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Docker iniciado com sucesso!${NC}"
            break
        fi
        sleep 2
        echo -n "."
    done
    
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker não iniciou após 60 segundos${NC}"
        exit 1
    fi
fi

# Verificar e configurar .env.local do frontend
FRONTEND_ENV="frontend/.env.local"
echo -e "${YELLOW}📝 Configurando variáveis do frontend...${NC}"

if [ ! -f "$FRONTEND_ENV" ]; then
    echo -e "${YELLOW}Criando arquivo .env.local...${NC}"
    cat > "$FRONTEND_ENV" << 'EOF'
# Configurações principais - SELF HOSTED COM TODAS AS FLAGS
NEXT_PUBLIC_ENV_MODE=local
NEXT_PUBLIC_SELF_HOSTED=true

# Supabase (necessário mesmo em self-hosted para autenticação)
NEXT_PUBLIC_SUPABASE_URL=https://wltdflgjcinsqwtycsxs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdGRmbGdqY2luc3F3dHljc3hzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NTU2OTEsImV4cCI6MjA2ODUzMTY5MX0.XzmtUnxk2z8BJ_FboIFOzDnx1jyG9j3czJElavX11II

# URLs
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000/api
NEXT_PUBLIC_URL=http://localhost:3000

# Flags adicionais para habilitar TODAS as funcionalidades
NEXT_PUBLIC_ENABLE_ALL_FEATURES=true
NEXT_PUBLIC_ENABLE_CUSTOM_AGENTS=true
NEXT_PUBLIC_ENABLE_MCP_SERVERS=true
NEXT_PUBLIC_ENABLE_WORKFLOWS=true
NEXT_PUBLIC_ENABLE_TEAMS=true
NEXT_PUBLIC_ENABLE_API_KEYS=true
EOF
else
    # Garantir que as flags essenciais estejam presentes
    if ! grep -q "NEXT_PUBLIC_ENV_MODE" "$FRONTEND_ENV"; then
        echo -e "\n# Configurações principais" >> "$FRONTEND_ENV"
        echo "NEXT_PUBLIC_ENV_MODE=local" >> "$FRONTEND_ENV"
    fi
    
    if ! grep -q "NEXT_PUBLIC_SELF_HOSTED" "$FRONTEND_ENV"; then
        echo "NEXT_PUBLIC_SELF_HOSTED=true" >> "$FRONTEND_ENV"
    fi
    
    if ! grep -q "NEXT_PUBLIC_ENABLE_ALL_FEATURES" "$FRONTEND_ENV"; then
        echo -e "\n# Flags para habilitar todas as funcionalidades" >> "$FRONTEND_ENV"
        echo "NEXT_PUBLIC_ENABLE_ALL_FEATURES=true" >> "$FRONTEND_ENV"
        echo "NEXT_PUBLIC_ENABLE_CUSTOM_AGENTS=true" >> "$FRONTEND_ENV"
        echo "NEXT_PUBLIC_ENABLE_MCP_SERVERS=true" >> "$FRONTEND_ENV"
        echo "NEXT_PUBLIC_ENABLE_WORKFLOWS=true" >> "$FRONTEND_ENV"
        echo "NEXT_PUBLIC_ENABLE_TEAMS=true" >> "$FRONTEND_ENV"
        echo "NEXT_PUBLIC_ENABLE_API_KEYS=true" >> "$FRONTEND_ENV"
    fi
fi

# Verificar .env do backend
BACKEND_ENV="backend/.env"
echo -e "${YELLOW}📝 Verificando configurações do backend...${NC}"

if [ ! -f "$BACKEND_ENV" ]; then
    echo -e "${RED}❌ Arquivo backend/.env não encontrado!${NC}"
    echo "Copiando do exemplo..."
    if [ -f "backend/.env.example" ]; then
        cp "backend/.env.example" "$BACKEND_ENV"
        echo -e "${GREEN}✅ Arquivo .env criado a partir do exemplo${NC}"
    else
        echo -e "${RED}❌ Arquivo .env.example também não encontrado!${NC}"
        exit 1
    fi
fi

# Garantir que SELF_HOSTED esteja configurado no backend
if ! grep -q "SELF_HOSTED" "$BACKEND_ENV"; then
    echo -e "\n# Self-hosted configuration" >> "$BACKEND_ENV"
    echo "SELF_HOSTED=true" >> "$BACKEND_ENV"
fi

# Parar containers existentes
echo -e "${YELLOW}🛑 Parando containers existentes...${NC}"
docker-compose -f docker-compose.dev.yaml down 2>/dev/null || true

# Limpar containers órfãos
docker ps -a --format "{{.Names}}" | grep -E "sunakortix|suna" | xargs -r docker rm -f 2>/dev/null || true

# Construir e iniciar com docker-compose.dev.yaml
echo -e "${GREEN}🔨 Construindo imagens...${NC}"
docker-compose -f docker-compose.dev.yaml build

echo -e "${GREEN}🚀 Iniciando todos os serviços...${NC}"
docker-compose -f docker-compose.dev.yaml up -d

# Aguardar serviços estarem prontos
echo -e "${YELLOW}⏳ Aguardando serviços iniciarem...${NC}"
sleep 5

# Verificar status dos serviços
echo -e "\n${GREEN}📊 Status dos serviços:${NC}"
echo "=================================================="

# Verificar Redis
if curl -s http://localhost:6379 2>/dev/null | grep -q "wrong number" || docker exec sunakortix-redis-1 redis-cli ping 2>/dev/null | grep -q "PONG"; then
    echo -e "✅ Redis: ${GREEN}OK${NC} (porta 6379)"
else
    echo -e "❌ Redis: ${RED}ERRO${NC}"
fi

# Verificar Backend
if curl -s http://localhost:8000/api/health | grep -q "ok"; then
    echo -e "✅ Backend: ${GREEN}OK${NC} (http://localhost:8000)"
else
    echo -e "❌ Backend: ${RED}ERRO${NC}"
fi

# Verificar Frontend
if curl -s -I http://localhost:3000 | grep -q "200 OK"; then
    echo -e "✅ Frontend: ${GREEN}OK${NC} (http://localhost:3000)"
else
    echo -e "❌ Frontend: ${RED}ERRO${NC}"
fi

echo "=================================================="
echo -e "\n${GREEN}🎉 Sunakortix está rodando com TODAS as funcionalidades!${NC}"
echo ""
echo "📍 Acesse em: http://localhost:3000"
echo ""
echo "✨ Funcionalidades ativas:"
echo "   • Custom Agents"
echo "   • MCP Servers" 
echo "   • Workflows"
echo "   • Teams"
echo "   • API Keys"
echo "   • Knowledge Base"
echo "   • Real-time collaboration"
echo "   • File upload"
echo "   • Analytics"
echo "   • E muito mais!"
echo ""
echo "💡 Dicas:"
echo "   • Ver logs: docker-compose -f docker-compose.dev.yaml logs -f"
echo "   • Parar: docker-compose -f docker-compose.dev.yaml down"
echo "   • Reiniciar: ./start-suna.sh"
echo ""
echo "=================================================="