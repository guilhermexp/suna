#!/bin/bash

# Script para iniciar o ambiente Docker

set -e

echo "🚀 Iniciando Sunakortix Docker Environment..."

# Verificar se o arquivo .env.local existe
if [ ! -f .env.local ]; then
    echo "⚠️  Arquivo .env.local não encontrado!"
    echo "📝 Criando arquivo .env.local de exemplo..."
    cat > .env.local << EOF
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Vercel (opcional)
NEXT_PUBLIC_VERCEL_ENV=development

# Posthog (opcional)
NEXT_PUBLIC_POSTHOG_KEY=your-posthog-key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Cal.com (opcional)
NEXT_PUBLIC_CAL_LINK=your-cal-link
EOF
    echo "✅ Arquivo .env.local criado. Por favor, configure suas variáveis de ambiente."
    exit 1
fi

# Função para escolher o ambiente
choose_environment() {
    echo ""
    echo "Escolha o ambiente:"
    echo "1) Produção (otimizado)"
    echo "2) Desenvolvimento (hot-reload)"
    echo "3) Ambos"
    read -p "Opção [1-3]: " choice
    
    case $choice in
        1)
            start_production
            ;;
        2)
            start_development
            ;;
        3)
            start_both
            ;;
        *)
            echo "❌ Opção inválida!"
            exit 1
            ;;
    esac
}

# Iniciar ambiente de produção
start_production() {
    echo "📦 Construindo imagem de produção..."
    docker-compose build frontend
    
    echo "🚀 Iniciando container de produção..."
    docker-compose up -d frontend
    
    echo "✅ Ambiente de produção iniciado!"
    echo "🌐 Acesse: http://localhost:3000"
    
    # Mostrar logs
    echo ""
    read -p "Deseja ver os logs? (s/n): " show_logs
    if [ "$show_logs" = "s" ]; then
        docker-compose logs -f frontend
    fi
}

# Iniciar ambiente de desenvolvimento
start_development() {
    echo "🔧 Construindo imagem de desenvolvimento..."
    docker-compose --profile dev build frontend-dev
    
    echo "🚀 Iniciando container de desenvolvimento..."
    docker-compose --profile dev up -d frontend-dev
    
    echo "✅ Ambiente de desenvolvimento iniciado!"
    echo "🌐 Acesse: http://localhost:3001"
    echo "📝 Hot-reload habilitado!"
    
    # Mostrar logs
    echo ""
    read -p "Deseja ver os logs? (s/n): " show_logs
    if [ "$show_logs" = "s" ]; then
        docker-compose logs -f frontend-dev
    fi
}

# Iniciar ambos os ambientes
start_both() {
    echo "📦 Construindo imagens..."
    docker-compose build
    docker-compose --profile dev build
    
    echo "🚀 Iniciando containers..."
    docker-compose up -d frontend
    docker-compose --profile dev up -d frontend-dev
    
    echo "✅ Ambos os ambientes iniciados!"
    echo "🌐 Produção: http://localhost:3000"
    echo "🌐 Desenvolvimento: http://localhost:3001"
    
    # Mostrar status
    docker-compose ps
}

# Menu principal
echo ""
echo "==================================="
echo "   Sunakortix Docker Manager"
echo "==================================="

# Verificar se o Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando!"
    echo "Por favor, inicie o Docker Desktop e tente novamente."
    exit 1
fi

# Escolher ação
echo ""
echo "O que deseja fazer?"
echo "1) Iniciar ambiente"
echo "2) Parar containers"
echo "3) Reiniciar containers"
echo "4) Ver logs"
echo "5) Limpar tudo (containers, imagens, volumes)"
echo "6) Status dos containers"
read -p "Opção [1-6]: " action

case $action in
    1)
        choose_environment
        ;;
    2)
        echo "🛑 Parando containers..."
        docker-compose down
        docker-compose --profile dev down
        echo "✅ Containers parados!"
        ;;
    3)
        echo "🔄 Reiniciando containers..."
        docker-compose restart
        docker-compose --profile dev restart
        echo "✅ Containers reiniciados!"
        ;;
    4)
        echo "Qual log deseja ver?"
        echo "1) Produção"
        echo "2) Desenvolvimento"
        read -p "Opção [1-2]: " log_choice
        
        case $log_choice in
            1)
                docker-compose logs -f frontend
                ;;
            2)
                docker-compose logs -f frontend-dev
                ;;
            *)
                echo "❌ Opção inválida!"
                ;;
        esac
        ;;
    5)
        echo "⚠️  ATENÇÃO: Isso removerá todos os containers, imagens e volumes!"
        read -p "Tem certeza? (s/n): " confirm
        
        if [ "$confirm" = "s" ]; then
            echo "🧹 Limpando ambiente Docker..."
            docker-compose down -v --rmi all
            docker-compose --profile dev down -v --rmi all
            echo "✅ Limpeza completa!"
        else
            echo "❌ Operação cancelada!"
        fi
        ;;
    6)
        echo "📊 Status dos containers:"
        docker-compose ps
        docker-compose --profile dev ps
        ;;
    *)
        echo "❌ Opção inválida!"
        exit 1
        ;;
esac

echo ""
echo "==================================="
echo "          Operação concluída!"
echo "===================================="