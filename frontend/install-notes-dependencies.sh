#!/bin/bash

echo "📦 Instalando dependências para Notas e Chat..."

# Frontend dependencies
echo "📱 Instalando dependências do Frontend..."
npm install --save \
  @tiptap/core@^3.0.7 \
  @tiptap/starter-kit@^3.0.7 \
  @tiptap/extension-bubble-menu@^2.26.1 \
  @tiptap/extension-code-block-lowlight@^3.0.7 \
  @tiptap/extension-drag-handle@^3.0.7 \
  @tiptap/extension-file-handler@^3.0.7 \
  @tiptap/extension-floating-menu@^2.26.1 \
  @tiptap/extension-highlight@^3.0.7 \
  @tiptap/extension-image@^3.0.7 \
  @tiptap/extension-link@^3.0.7 \
  @tiptap/extension-mention@^3.0.9 \
  @tiptap/extension-table@^3.0.7 \
  @tiptap/extension-typography@^3.0.7 \
  @tiptap/extension-youtube@^3.0.7 \
  @tiptap/pm@^3.0.7 \
  @tiptap/react@^2.1.13 \
  socket.io-client@^4.2.0 \
  prosemirror-state \
  prosemirror-view \
  prosemirror-model \
  y-prosemirror@^1.3.7 \
  yjs@^13.6.27 \
  marked@^9.1.0 \
  katex@^0.16.22 \
  dompurify@^3.2.5 \
  lowlight@^3.0.0

echo "✅ Dependências do Frontend instaladas!"

# Backend dependencies
echo "🔧 Criando requirements.txt para o backend..."
cat > backend/requirements.txt << EOF
fastapi==0.115.7
uvicorn[standard]==0.35.0
python-socketio==5.13.0
python-jose==3.4.0
passlib[bcrypt]==1.7.4
sqlalchemy==2.0.38
alembic==1.14.0
pydantic==2.11.7
python-multipart==0.0.20
aiofiles
httpx
psycopg2-binary==2.9.9
pymysql==1.1.1
bcrypt==4.3.0
python-dotenv
EOF

echo "📝 requirements.txt criado!"
echo ""
echo "Para instalar as dependências do backend, execute:"
echo "  cd backend && pip install -r requirements.txt"
echo ""
echo "✨ Script concluído! Próximos passos:"
echo "1. Converter componentes Svelte para React"
echo "2. Configurar o backend FastAPI"
echo "3. Integrar autenticação"
echo "4. Configurar banco de dados"
echo ""
echo "Consulte NOTES_CHAT_MIGRATION.md para instruções detalhadas!"