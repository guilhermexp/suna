# 📝 Migração de Notas e Chat do Open-notes

## ✅ Arquivos Migrados

### Frontend (Next.js)

#### 1. Componentes de Notas
- `src/components/notes/` - Todos os componentes de notas
  - `Notes.svelte` → Converter para React/Next.js
  - `NoteEditor.svelte` → Converter para React/Next.js
  - `NotePanel.svelte` → Converter para React/Next.js
  - `AIMenu.svelte` → Converter para React/Next.js
  - `RecordMenu.svelte` → Converter para React/Next.js
  - `YouTubePreviewHandler.svelte` → Converter para React/Next.js

#### 2. Componentes de Chat
- `src/components/chat/` - Sistema completo de chat
  - `Chat.svelte` → Converter para React/Next.js
  - `Messages/` → Componentes de mensagens
  - `MessageInput/` → Input com comandos e menções
  - `ChatControls.svelte` → Controles do chat
  - `Settings/` → Configurações do chat

#### 3. Editor Rich Text (TipTap)
- `src/components/common/RichTextInput/` - Editor TipTap completo
  - Suporte para markdown
  - Formatação avançada
  - Imagens e YouTube embeds

#### 4. APIs do Frontend
- `src/lib/apis/notes/` - APIs para gerenciar notas
- `src/lib/apis/chats/` - APIs para gerenciar chat

#### 5. Rotas
- `src/routes/notes/` - Páginas de notas

### Backend (Python/FastAPI)

#### 1. Modelos de Dados
- `backend/models/notes.py` - Modelo de notas
- `backend/models/chats.py` - Modelo de chats
- `backend/models/messages.py` - Modelo de mensagens
- `backend/models/users.py` - Modelo de usuários

#### 2. Routers/APIs
- `backend/routers/notes.py` - Endpoints de notas
- `backend/routers/chats.py` - Endpoints de chat

#### 3. WebSocket
- `backend/socket/` - Servidor WebSocket para chat em tempo real

## 🔧 Dependências Necessárias

### Frontend (package.json)
```json
{
  "dependencies": {
    // Editor TipTap
    "@tiptap/core": "^3.0.7",
    "@tiptap/starter-kit": "^3.0.7",
    "@tiptap/extension-bubble-menu": "^2.26.1",
    "@tiptap/extension-code-block-lowlight": "^3.0.7",
    "@tiptap/extension-drag-handle": "^3.0.7",
    "@tiptap/extension-file-handler": "^3.0.7",
    "@tiptap/extension-floating-menu": "^2.26.1",
    "@tiptap/extension-highlight": "^3.0.7",
    "@tiptap/extension-image": "^3.0.7",
    "@tiptap/extension-link": "^3.0.7",
    "@tiptap/extension-mention": "^3.0.9",
    "@tiptap/extension-table": "^3.0.7",
    "@tiptap/extension-typography": "^3.0.7",
    "@tiptap/extension-youtube": "^3.0.7",
    "@tiptap/pm": "^3.0.7",
    "@tiptap/react": "^2.1.13",
    
    // Utilidades
    "socket.io-client": "^4.2.0",
    "prosemirror-*": "várias versões",
    "y-prosemirror": "^1.3.7",
    "yjs": "^13.6.27",
    "dayjs": "^1.11.10",
    "marked": "^9.1.0",
    "katex": "^0.16.22",
    "dompurify": "^3.2.5"
  }
}
```

### Backend (requirements.txt)
```txt
# Principais para notas e chat
fastapi==0.115.7
uvicorn[standard]==0.35.0
python-socketio==5.13.0
sqlalchemy==2.0.38
alembic==1.14.0
pydantic==2.11.7
python-multipart==0.0.20
```

## 🚀 Próximos Passos

### 1. Conversão Svelte → React

Os componentes estão em Svelte e precisam ser convertidos para React/Next.js. Principais tarefas:

1. **Converter sintaxe Svelte para React**:
   - `{#if}` → Operador ternário ou `&&`
   - `{#each}` → `.map()`
   - `on:click` → `onClick`
   - `bind:value` → Controlled components com useState
   - `$:` (reactive) → useEffect/useMemo

2. **Adaptar stores do Svelte**:
   - Converter para Context API ou Zustand
   - Migrar reactive statements para hooks

3. **Ajustar roteamento**:
   - Adaptar de SvelteKit para Next.js App Router
   - Converter `+page.svelte` para `page.tsx`
   - Converter `+layout.svelte` para `layout.tsx`

### 2. Integração do Backend

1. **Criar main.py FastAPI**:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import notes, chats
from backend.socket import sio
import socketio

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(notes.router, prefix="/api/notes")
app.include_router(chats.router, prefix="/api/chats")

# WebSocket
socket_app = socketio.ASGIApp(sio, app)
```

2. **Configurar banco de dados**:
   - Criar migrations com Alembic
   - Configurar conexão SQLAlchemy

3. **Ajustar imports nos modelos**:
   - Atualizar caminhos de importação
   - Resolver dependências circulares

### 3. Integração Frontend-Backend

1. **Configurar proxy no Next.js** (next.config.ts):
```typescript
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: 'http://localhost:8000/api/:path*',
    },
  ]
}
```

2. **Configurar Socket.IO no cliente**:
```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:8000', {
  transports: ['websocket'],
});
```

### 4. Estilos e Assets

1. **Copiar estilos do TailwindCSS**
2. **Copiar ícones e imagens da pasta** `src/lib/components/icons/`

## 📋 Checklist de Validação

- [ ] Componentes de notas convertidos para React
- [ ] Componentes de chat convertidos para React
- [ ] Editor TipTap funcionando
- [ ] APIs do backend respondendo
- [ ] WebSocket conectando
- [ ] CRUD de notas funcionando
- [ ] Chat em tempo real funcionando
- [ ] Autenticação integrada
- [ ] Banco de dados configurado
- [ ] Migrations executadas

## 🎯 Estrutura Final Esperada

```
seu-projeto/
├── src/
│   ├── app/
│   │   └── notes/
│   │       ├── page.tsx
│   │       └── [id]/
│   │           └── page.tsx
│   ├── components/
│   │   ├── notes/
│   │   │   ├── NoteEditor.tsx
│   │   │   ├── NotesList.tsx
│   │   │   └── NotePanel.tsx
│   │   ├── chat/
│   │   │   ├── Chat.tsx
│   │   │   ├── Messages.tsx
│   │   │   └── MessageInput.tsx
│   │   └── common/
│   │       └── RichTextEditor.tsx
│   └── lib/
│       └── api/
│           ├── notes.ts
│           └── chat.ts
├── backend/
│   ├── main.py
│   ├── models/
│   ├── routers/
│   └── socket/
└── package.json
```

## 💡 Notas Importantes

1. **Autenticação**: Os componentes esperam um sistema de autenticação. Você precisará integrar com seu sistema existente.

2. **Stores/Estado**: O Open-notes usa stores do Svelte. Você precisará converter para Context API, Redux ou Zustand.

3. **Banco de Dados**: Configure as variáveis de ambiente para conexão com o banco.

4. **WebSocket**: Essencial para o chat em tempo real. Certifique-se de que está configurado corretamente.

5. **Uploads**: Se quiser suportar upload de imagens, configure o storage (local ou S3).

## 🆘 Suporte

Se precisar de ajuda com:
- Conversão de componentes específicos
- Configuração do backend
- Integração de funcionalidades
- Resolução de erros

Me avise e posso ajudar com cada etapa!