# Product Requirements Document (PRD)
## Sistema de Notas com Chat Integrado

**Versão:** 1.0  
**Data:** Dezembro 2024  
**Status:** Em Desenvolvimento  
**Autor:** Product Team  

---

## 📋 Sumário Executivo

### Visão Geral
Integração completa de um sistema de notas com chat incorporado ao aplicativo existente, permitindo aos usuários criar, editar e gerenciar notas com suporte a rich text, além de ter conversas contextuais através de um chat integrado em cada nota.

### Objetivo Principal
Adicionar uma seção de "Notas" na sidebar do aplicativo atual que, ao ser clicada, oferece todas as funcionalidades de criação, edição e gerenciamento de notas com chat integrado, exatamente como funciona no aplicativo Open-notes.

### Valor de Negócio
- **Produtividade**: Centralização de informações e comunicação em um único local
- **Colaboração**: Chat contextual para discussões sobre notas específicas
- **Organização**: Sistema robusto de gerenciamento de conhecimento
- **Eficiência**: Redução de alternância entre diferentes ferramentas

---

## 🎯 Objetivos e Metas

### Objetivos Primários
1. **Integrar sistema de notas** completo na aplicação existente
2. **Manter paridade de funcionalidades** com o Open-notes
3. **Garantir experiência fluida** e consistente com o design atual
4. **Implementar chat contextual** para cada nota

### Metas de Sucesso
- [ ] 100% das funcionalidades do Open-notes migradas
- [ ] Tempo de resposta < 200ms para operações básicas
- [ ] Zero perda de dados durante a migração
- [ ] Suporte a 1000+ notas por usuário sem degradação
- [ ] Chat em tempo real com latência < 100ms

### KPIs
- Taxa de adoção: 80% dos usuários ativos em 30 dias
- Notas criadas por usuário: média de 10/semana
- Engajamento no chat: 50% das notas com conversas
- Performance: 99.9% uptime

---

## 👥 Personas e Casos de Uso

### Persona Principal: Profissional do Conhecimento
**Nome:** Ana Silva  
**Cargo:** Gerente de Projetos  
**Necessidades:**
- Documentar reuniões e decisões rapidamente
- Organizar informações por projeto/contexto
- Colaborar com equipe em tempo real
- Acessar histórico de discussões

### Casos de Uso Principais

#### UC1: Criar e Editar Notas
```
COMO usuário
QUERO criar e editar notas com formatação rica
PARA documentar informações importantes de forma organizada
```

#### UC2: Organizar Notas
```
COMO usuário
QUERO organizar notas com tags e favoritos
PARA encontrar informações rapidamente
```

#### UC3: Chat Contextual
```
COMO usuário
QUERO conversar sobre uma nota específica
PARA discutir e esclarecer o conteúdo com minha equipe
```

#### UC4: Busca Inteligente
```
COMO usuário
QUERO buscar em todas as minhas notas
PARA encontrar informações específicas rapidamente
```

---

## 🔧 Requisitos Funcionais

### RF1: Acesso via Sidebar
- **RF1.1** Adicionar item "Notas" na sidebar principal
- **RF1.2** Ícone distintivo (📝) para identificação visual
- **RF1.3** Badge com contador de notas não lidas/novas
- **RF1.4** Tooltip com resumo ao hover
- **RF1.5** Atalho de teclado (Cmd/Ctrl + N)

### RF2: Interface de Notas

#### RF2.1: Lista de Notas (Painel Esquerdo)
- **RF2.1.1** Listagem com scroll infinito
- **RF2.1.2** Preview de 2 linhas do conteúdo
- **RF2.1.3** Data de última modificação
- **RF2.1.4** Indicador de favorito (estrela)
- **RF2.1.5** Tags visuais
- **RF2.1.6** Busca com filtros
- **RF2.1.7** Ordenação (data, nome, favoritos)
- **RF2.1.8** Menu de contexto (editar, excluir, duplicar)

#### RF2.2: Editor de Notas (Painel Central)
- **RF2.2.1** Editor TipTap com toolbar completa
- **RF2.2.2** Suporte a Markdown
- **RF2.2.3** Formatação rica:
  - Negrito, itálico, sublinhado, tachado
  - Cabeçalhos (H1-H6)
  - Listas (ordenadas e não ordenadas)
  - Checkboxes
  - Citações (blockquote)
  - Código (inline e bloco com syntax highlighting)
  - Tabelas
  - Links
  - Imagens (upload e URL)
  - Vídeos YouTube (embed)
- **RF2.2.4** Autocompletar com @menções
- **RF2.2.5** Comandos slash (/)
- **RF2.2.6** Histórico de edições (undo/redo)
- **RF2.2.7** Salvamento automático
- **RF2.2.8** Indicador de salvamento
- **RF2.2.9** Modo de visualização/edição
- **RF2.2.10** Exportar (PDF, Markdown, HTML)

#### RF2.3: Chat Integrado (Painel Direito ou Bottom)
- **RF2.3.1** Thread de conversa por nota
- **RF2.3.2** Mensagens em tempo real (WebSocket)
- **RF2.3.3** Indicador de digitação
- **RF2.3.4** Timestamps nas mensagens
- **RF2.3.5** Avatar e nome do usuário
- **RF2.3.6** Suporte a:
  - Texto formatado
  - Emojis
  - Anexos (imagens, documentos)
  - Code snippets
  - @menções
- **RF2.3.7** Notificações de novas mensagens
- **RF2.3.8** Histórico persistente
- **RF2.3.9** Busca no chat
- **RF2.3.10** Reações às mensagens

### RF3: Funcionalidades de Organização

#### RF3.1: Sistema de Tags
- **RF3.1.1** Criar tags personalizadas
- **RF3.1.2** Cores para tags
- **RF3.1.3** Autocompletar tags existentes
- **RF3.1.4** Filtrar por múltiplas tags
- **RF3.1.5** Gerenciar tags (renomear, excluir, mesclar)

#### RF3.2: Favoritos
- **RF3.2.1** Marcar/desmarcar como favorito
- **RF3.2.2** Seção dedicada de favoritos
- **RF3.2.3** Acesso rápido via atalho

#### RF3.3: Busca
- **RF3.3.1** Busca em tempo real
- **RF3.3.2** Busca em título e conteúdo
- **RF3.3.3** Busca em tags
- **RF3.3.4** Busca no chat
- **RF3.3.5** Highlighting dos termos encontrados
- **RF3.3.6** Filtros avançados (data, autor, tipo)

### RF4: Colaboração

#### RF4.1: Compartilhamento
- **RF4.1.1** Compartilhar nota com usuários
- **RF4.1.2** Níveis de permissão (visualizar, editar, comentar)
- **RF4.1.3** Link público (opcional)
- **RF4.1.4** Controle de acesso

#### RF4.2: Atividade
- **RF4.2.1** Log de atividades da nota
- **RF4.2.2** Quem visualizou
- **RF4.2.3** Histórico de edições
- **RF4.2.4** Reversão de versões

### RF5: Integrações

#### RF5.1: IA Assistente
- **RF5.1.1** Sugestões de escrita
- **RF5.1.2** Resumo automático
- **RF5.1.3** Correção gramatical
- **RF5.1.4** Tradução
- **RF5.1.5** Geração de conteúdo

#### RF5.2: Mídia
- **RF5.2.1** Upload de imagens (drag & drop)
- **RF5.2.2** Preview de links
- **RF5.2.3** Embed de vídeos YouTube
- **RF5.2.4** Gravação de áudio (opcional)

---

## 💻 Requisitos Não Funcionais

### RNF1: Performance
- **RNF1.1** Carregamento inicial < 2 segundos
- **RNF1.2** Resposta de digitação < 50ms
- **RNF1.3** Salvamento automático < 1 segundo
- **RNF1.4** Busca < 200ms para 10k notas
- **RNF1.5** Chat em tempo real < 100ms latência

### RNF2: Escalabilidade
- **RNF2.1** Suportar 10k+ notas por usuário
- **RNF2.2** 100+ usuários simultâneos no chat
- **RNF2.3** Mensagens ilimitadas por thread
- **RNF2.4** Anexos até 50MB

### RNF3: Usabilidade
- **RNF3.1** Interface responsiva (mobile, tablet, desktop)
- **RNF3.2** Acessibilidade WCAG 2.1 AA
- **RNF3.3** Suporte a dark/light mode
- **RNF3.4** Atalhos de teclado completos
- **RNF3.5** Onboarding para novos usuários

### RNF4: Segurança
- **RNF4.1** Criptografia em trânsito (HTTPS/WSS)
- **RNF4.2** Autenticação via Supabase Auth
- **RNF4.3** Autorização com RLS (Row Level Security)
- **RNF4.4** Rate limiting (Supabase built-in)
- **RNF4.5** Sanitização de input (XSS prevention)
- **RNF4.6** Backup automático (Supabase managed)

### RNF5: Confiabilidade
- **RNF5.1** 99.9% uptime
- **RNF5.2** Recovery < 5 minutos
- **RNF5.3** Zero perda de dados
- **RNF5.4** Modo offline com sync

### RNF6: Compatibilidade
- **RNF6.1** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **RNF6.2** Node.js 18+
- **RNF6.3** Python 3.9+
- **RNF6.4** PostgreSQL 13+ / MySQL 8+

---

## 🔌 Integração com Supabase

### Estrutura de Tabelas

#### Tabela: `notes`
```sql
CREATE TABLE notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  content JSONB, -- TipTap JSON format
  content_text TEXT, -- Plain text for search
  is_starred BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_starred ON notes(is_starred) WHERE is_starred = true;
CREATE INDEX idx_notes_updated ON notes(updated_at DESC);
CREATE INDEX idx_notes_search ON notes USING gin(to_tsvector('portuguese', content_text));
```

#### Tabela: `note_tags`
```sql
CREATE TABLE note_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(note_id, tag_name)
);

CREATE INDEX idx_note_tags_note ON note_tags(note_id);
CREATE INDEX idx_note_tags_name ON note_tags(tag_name);
```

#### Tabela: `note_messages`
```sql
CREATE TABLE note_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'text', -- text, image, file, code
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  edited_at TIMESTAMPTZ,
  is_deleted BOOLEAN DEFAULT false
);

CREATE INDEX idx_messages_note ON note_messages(note_id);
CREATE INDEX idx_messages_created ON note_messages(created_at DESC);
```

#### Tabela: `note_shares`
```sql
CREATE TABLE note_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  shared_with_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  permission TEXT CHECK (permission IN ('view', 'edit', 'comment')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(note_id, shared_with_user_id)
);
```

### RLS (Row Level Security) Policies

```sql
-- Notes policies
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Users can CRUD their own notes
CREATE POLICY "Users can manage own notes" ON notes
  FOR ALL USING (auth.uid() = user_id);

-- Users can view shared notes
CREATE POLICY "Users can view shared notes" ON notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM note_shares 
      WHERE note_shares.note_id = notes.id 
      AND note_shares.shared_with_user_id = auth.uid()
    )
  );

-- Messages policies
ALTER TABLE note_messages ENABLE ROW LEVEL SECURITY;

-- Users can manage messages in their notes or shared notes
CREATE POLICY "Users can manage messages" ON note_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM notes 
      WHERE notes.id = note_messages.note_id 
      AND (notes.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM note_shares 
        WHERE note_shares.note_id = notes.id 
        AND note_shares.shared_with_user_id = auth.uid()
      ))
    )
  );
```

### Supabase Client Configuration

#### Frontend (Next.js)
```typescript
// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Hook para realtime
export function useRealtimeNotes(noteId: string) {
  useEffect(() => {
    const channel = supabase
      .channel(`notes:${noteId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'notes',
          filter: `id=eq.${noteId}`
        }, 
        (payload) => {
          console.log('Note changed:', payload);
          // Update local state
        }
      )
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'note_messages',
          filter: `note_id=eq.${noteId}`
        },
        (payload) => {
          console.log('New message:', payload);
          // Add to messages
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [noteId]);
}
```

#### Backend (FastAPI)
```python
# backend/config/supabase.py
from supabase import create_client, Client
import os

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Exemplo de uso
async def create_note(user_id: str, title: str, content: dict):
    response = supabase.table('notes').insert({
        'user_id': user_id,
        'title': title,
        'content': content,
        'content_text': extract_text(content)
    }).execute()
    return response.data
```

### Storage para Uploads

```typescript
// Upload de imagem
async function uploadImage(file: File, noteId: string) {
  const fileName = `${noteId}/${Date.now()}-${file.name}`;
  
  const { data, error } = await supabase.storage
    .from('note-attachments')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('note-attachments')
    .getPublicUrl(fileName);

  return publicUrl;
}
```

### Realtime para Chat

```typescript
// Hook para chat em tempo real
export function useRealtimeChat(noteId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  
  useEffect(() => {
    // Subscribe to new messages
    const channel = supabase
      .channel(`chat:${noteId}`)
      .on('broadcast', 
        { event: 'message' }, 
        (payload) => {
          setMessages(prev => [...prev, payload.payload]);
        }
      )
      .on('presence', 
        { event: 'sync' },
        () => {
          const state = channel.presenceState();
          console.log('Users online:', state);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [noteId]);

  const sendMessage = async (content: string) => {
    // Save to database
    const { data } = await supabase
      .table('note_messages')
      .insert({
        note_id: noteId,
        content,
        user_id: user.id
      })
      .select()
      .single();

    // Broadcast to others
    await channel.send({
      type: 'broadcast',
      event: 'message',
      payload: data
    });
  };

  return { messages, sendMessage };
}
```

### Edge Functions (Opcional)

```typescript
// supabase/functions/summarize-note/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from '@supabase/supabase-js';

serve(async (req) => {
  const { noteId } = await req.json();
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Get note content
  const { data: note } = await supabase
    .from('notes')
    .select('content_text')
    .eq('id', noteId)
    .single();

  // Call AI API to summarize
  const summary = await generateSummary(note.content_text);

  // Update note metadata
  await supabase
    .from('notes')
    .update({ 
      metadata: { 
        summary,
        summarized_at: new Date().toISOString()
      }
    })
    .eq('id', noteId);

  return new Response(JSON.stringify({ summary }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

---

## 🏗️ Arquitetura Técnica

### Stack Frontend
```
- Framework: Next.js 14 (App Router)
- UI: React 18 + TypeScript
- Estilização: TailwindCSS 3
- Editor: TipTap 2 (com todas as extensões)
- Estado: Zustand / Context API
- WebSocket: Socket.io-client
- HTTP: Axios / Fetch API
- Validação: Zod
- Testes: Jest + React Testing Library
```

### Stack Backend
```
- Framework: FastAPI (Python 3.9+)
- WebSocket: python-socketio
- ORM: SQLAlchemy 2.0 com Supabase
- Migrations: Supabase Migrations
- Cache: Redis (opcional) ou Supabase Cache
- Queue: Celery (opcional)
- Autenticação: Supabase Auth (integrado)
- Validação: Pydantic 2
- Testes: Pytest
```

### Banco de Dados - Supabase
```
- Principal: Supabase (PostgreSQL gerenciado)
- Autenticação: Supabase Auth
- Storage: Supabase Storage (para uploads)
- Realtime: Supabase Realtime (WebSocket)
- Edge Functions: Para lógica serverless
- Vector DB: pgvector para busca semântica (opcional)
- RLS: Row Level Security para autorização
```

### Infraestrutura
```
- Container: Docker
- Orquestração: Docker Compose / Kubernetes
- CI/CD: GitHub Actions
- Monitoring: Prometheus + Grafana
- Logs: ELK Stack ou similar
```

---

## 🎨 Design e UX

### Princípios de Design
1. **Consistência**: Manter padrões visuais do app atual
2. **Simplicidade**: Interface limpa e intuitiva
3. **Eficiência**: Mínimo de cliques para ações comuns
4. **Feedback**: Respostas visuais imediatas
5. **Acessibilidade**: Suporte completo a keyboard e screen readers

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  Header (App existente)                                 │
├────┬────────────────────────────────────────────┬───────┤
│    │  Lista de Notas    │   Editor de Nota     │ Chat  │
│ S  │                     │                      │       │
│ i  │  [🔍 Buscar...]     │  # Título da Nota    │ [User]│
│ d  │                     │                      │       │
│ e  │  ⭐ Favoritos       │  Conteúdo em rich    │ Msg1  │
│ b  │  📝 Nota 1         │  text com todas as   │ Msg2  │
│ a  │  📝 Nota 2         │  formatações...      │ Msg3  │
│ r  │  📝 Nota 3         │                      │       │
│    │                     │  [Toolbar Editor]    │ [...] │
│    │  📌 Tags            │                      │       │
│    │  #trabalho         │                      │ [Input]│
│    │  #pessoal          │                      │ [Send]│
└────┴────────────────────────────────────────────┴───────┘
```

### Componentes UI

#### Sidebar Item
```tsx
<SidebarItem
  icon={<NotesIcon />}
  label="Notas"
  badge={unreadCount}
  active={isNotesActive}
  onClick={openNotes}
  shortcut="⌘N"
/>
```

#### Estados Visuais
- **Empty State**: Ilustração + CTA para criar primeira nota
- **Loading State**: Skeleton screens
- **Error State**: Mensagem amigável + retry
- **Success State**: Feedback visual (toast/badge)

---

## 📱 Responsividade

### Desktop (1920px+)
- Layout de 3 colunas (lista | editor | chat)
- Toolbar completa
- Todos os recursos disponíveis

### Tablet (768px - 1919px)
- Layout de 2 colunas (lista + editor OU editor + chat)
- Toggle para alternar chat
- Toolbar adaptativa

### Mobile (< 768px)
- Layout de 1 coluna
- Navegação por tabs
- Toolbar simplificada
- Gestos para navegação

---

## 🚀 Roadmap de Implementação

### Fase 1: Fundação (2 semanas)
- [x] Setup do projeto e estrutura de pastas
- [ ] Conversão dos componentes Svelte → React
- [ ] Configuração do backend FastAPI
- [ ] Setup das tabelas no Supabase
- [ ] Configuração do Supabase Client
- [ ] Integração com Supabase Auth existente
- [ ] Setup das RLS policies

### Fase 2: Core Features (3 semanas)
- [ ] CRUD de notas funcionando
- [ ] Editor TipTap integrado
- [ ] Sistema de tags e favoritos
- [ ] Busca básica
- [ ] Salvamento automático

### Fase 3: Chat Integration (2 semanas)
- [ ] WebSocket server setup
- [ ] Chat UI components
- [ ] Mensagens em tempo real
- [ ] Histórico de conversas
- [ ] Notificações

### Fase 4: Colaboração (2 semanas)
- [ ] Compartilhamento de notas
- [ ] Permissões e controle de acesso
- [ ] Histórico de atividades
- [ ] @menções funcionando

### Fase 5: Polish & Optimization (1 semana)
- [ ] Performance optimization
- [ ] Responsividade completa
- [ ] Dark mode
- [ ] Atalhos de teclado
- [ ] Testes E2E

### Fase 6: Launch (1 semana)
- [ ] Migration de dados (se aplicável)
- [ ] Deploy em produção
- [ ] Monitoramento
- [ ] Documentação
- [ ] Training dos usuários

**Timeline Total: 11 semanas**

---

## ✅ Critérios de Aceitação

### Must Have (P0)
- ✅ Acesso via sidebar
- ✅ Criar, editar, deletar notas
- ✅ Editor com formatação básica
- ✅ Salvamento automático
- ✅ Lista de notas com busca
- ✅ Chat básico por nota
- ✅ Responsividade mobile

### Should Have (P1)
- ⏳ Tags e favoritos
- ⏳ Formatação avançada (tabelas, código)
- ⏳ Upload de imagens
- ⏳ @menções
- ⏳ Exportar notas
- ⏳ Dark mode

### Nice to Have (P2)
- ⏳ IA assistente
- ⏳ Gravação de áudio
- ⏳ Colaboração em tempo real
- ⏳ Versionamento
- ⏳ Templates de notas

---

## 📊 Métricas de Sucesso

### Métricas de Adoção
- **DAU (Daily Active Users)**: 70% dos usuários totais
- **WAU (Weekly Active Users)**: 90% dos usuários totais
- **Notas criadas**: >100/dia no primeiro mês
- **Mensagens no chat**: >500/dia no primeiro mês

### Métricas de Engajamento
- **Tempo médio por sessão**: >10 minutos
- **Notas por usuário**: >5/semana
- **Taxa de retenção**: >80% após 30 dias
- **NPS**: >8

### Métricas Técnicas
- **Uptime**: 99.9%
- **Response time**: P95 < 200ms
- **Error rate**: <0.1%
- **Crash rate**: <0.01%

---

## 🚨 Riscos e Mitigações

### Riscos Técnicos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Conversão Svelte→React complexa | Alta | Alto | Criar componentes incrementalmente, testes extensivos |
| Performance com muitas notas | Média | Alto | Implementar paginação, cache, índices DB |
| Conflitos de WebSocket | Média | Médio | Implementar reconnection strategy, fallback polling |
| Integração com auth existente | Baixa | Alto | Documentar API de auth, criar adapter layer |

### Riscos de Negócio

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Baixa adoção inicial | Média | Alto | Onboarding guiado, migração de dados existentes |
| Resistência à mudança | Média | Médio | Training, documentação, suporte ativo |
| Scope creep | Alta | Médio | PRD bem definido, controle de mudanças |

---

## 📚 Anexos

### A. Mockups e Wireframes
- [Link para Figma com designs]
- [Protótipo interativo]

### B. Documentação Técnica
- [API Specification (OpenAPI)]
- [Database Schema]
- [WebSocket Events Documentation]

### C. Referências
- [Open-notes Original Repository]
- [TipTap Documentation]
- [Socket.io Documentation]

### D. Glossário
- **Rich Text**: Texto com formatação avançada
- **WebSocket**: Protocolo para comunicação em tempo real
- **JWT**: JSON Web Token para autenticação
- **CRUD**: Create, Read, Update, Delete
- **FTS**: Full Text Search

---

## 📝 Aprovações

| Stakeholder | Cargo | Data | Assinatura |
|------------|-------|------|------------|
| Product Owner | PO | - | - |
| Tech Lead | TL | - | - |
| UX Designer | UX | - | - |
| Dev Team | DEV | - | - |

---

## 🔄 Histórico de Revisões

| Versão | Data | Autor | Mudanças |
|--------|------|-------|----------|
| 1.0 | Dez/2024 | Product Team | Versão inicial do PRD |
| - | - | - | - |

---

**Status do Documento**: ✅ Pronto para Revisão

**Próximos Passos**:
1. Revisão com stakeholders
2. Aprovação do escopo
3. Estimativa detalhada da equipe de desenvolvimento
4. Kick-off do projeto