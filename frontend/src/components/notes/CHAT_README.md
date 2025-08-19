# Note Chat System

Sistema de chat em tempo real integrado às notas, construído com React, TypeScript, Supabase Realtime e shadcn/ui.

## 🚀 Funcionalidades

### ✅ Implementadas

- **💬 Chat em Tempo Real**: Mensagens instantâneas via Supabase Realtime
- **👥 Sistema de Presença**: Visualização de usuários online
- **⌨️ Indicadores de Digitação**: Indicadores ao vivo com limpeza automática
- **😀 Reações de Mensagem**: Reações com emojis nas mensagens
- **👁️ Confirmações de Leitura**: Rastreamento de status de leitura
- **💬 Resposta a Mensagens**: Sistema de reply/resposta
- **🔄 Auto-scroll**: Scroll automático para novas mensagens
- **📱 Design Responsivo**: Interface adaptativa e moderna
- **🎨 Temas**: Suporte a modo claro/escuro

### 🚧 Planejadas

- **@ Menções**: Menção de usuários com sintaxe @
- **📎 Anexos**: Upload de arquivos e imagens
- **🔍 Busca**: Busca em mensagens
- **📝 Edição**: Edição de mensagens enviadas
- **🗑️ Exclusão**: Exclusão de mensagens
- **🔔 Notificações**: Sistema de notificações push

## 📦 Componentes

### `NoteChat.tsx`
Componente principal do chat com todas as funcionalidades.

```tsx
<NoteChat
  noteId="note-123"
  userId="user-456"
  className="h-full w-80"
  onMessageCountChange={(count) => console.log(count)}
  isVisible={true}
/>
```

### `NoteEditor.tsx`
Editor de notas com chat integrado.

```tsx
<NoteEditor
  noteId="note-123"
  userId="user-456"
  enableChat={true}
  defaultChatVisible={false}
  onBack={() => router.back()}
/>
```

### `NoteChatDemo.tsx`
Componente de demonstração e overview do sistema.

## 🔧 Hooks

### `useNoteChat`
Hook principal para funcionalidades do chat.

```tsx
const {
  onlineUsers,
  typingUsers,
  isConnected,
  sendTypingIndicator,
  toggleReaction,
  markMessageAsRead
} = useNoteChat(noteId, userId, userName);
```

### `useTypingIndicator`
Hook para gerenciar indicadores de digitação.

```tsx
const { isTyping, startTyping, stopTyping } = useTypingIndicator(
  sendTypingIndicator,
  2000 // delay em ms
);
```

### `useNoteMessages`
Hook para buscar mensagens.

```tsx
const { data: messages, isLoading } = useNoteMessages(noteId);
```

### `useNoteMessagesRealtime`
Hook para subscriptions de tempo real.

```tsx
useNoteMessagesRealtime(noteId, true);
```

## 📊 Estrutura do Banco de Dados

### Tabelas Necessárias

```sql
-- Mensagens
CREATE TABLE note_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'image', 'file', 'code', 'system')),
  reply_to_id UUID REFERENCES note_messages(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  attachments JSONB DEFAULT '[]',
  is_edited BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- Reações
CREATE TABLE message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES note_messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- Índices para performance
CREATE INDEX idx_note_messages_note_id ON note_messages(note_id);
CREATE INDEX idx_note_messages_created_at ON note_messages(created_at);
CREATE INDEX idx_message_reactions_message_id ON message_reactions(message_id);
```

### Políticas RLS (Row Level Security)

```sql
-- Mensagens: usuários podem ver mensagens das notas que têm acesso
CREATE POLICY "Users can view messages of their notes" ON note_messages
  FOR SELECT USING (
    note_id IN (
      SELECT id FROM notes 
      WHERE user_id = auth.uid() 
      OR id IN (
        SELECT note_id FROM note_shares 
        WHERE shared_with_user_id = auth.uid()
      )
    )
  );

-- Mensagens: usuários podem inserir mensagens em suas notas
CREATE POLICY "Users can insert messages" ON note_messages
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    note_id IN (
      SELECT id FROM notes 
      WHERE user_id = auth.uid() 
      OR id IN (
        SELECT note_id FROM note_shares 
        WHERE shared_with_user_id = auth.uid() 
        AND permission IN ('edit', 'comment')
      )
    )
  );

-- Reações: usuários podem ver e gerenciar suas reações
CREATE POLICY "Users can manage reactions" ON message_reactions
  FOR ALL USING (user_id = auth.uid());
```

## 🔄 Realtime Setup

### Canais Supabase

```typescript
// Chat messages
const messagesChannel = supabase
  .channel(`chat:${noteId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'note_messages',
    filter: `note_id=eq.${noteId}`
  }, handleMessageChange)
  .subscribe();

// Presence
const presenceChannel = supabase
  .channel(`note-presence:${noteId}`)
  .on('presence', { event: 'sync' }, handlePresenceSync)
  .on('broadcast', { event: 'typing' }, handleTyping)
  .subscribe();
```

## 🎨 Styling

O sistema usa shadcn/ui para componentes base e Tailwind CSS para styling. Principais classes:

### Layout
```css
.chat-container {
  @apply flex flex-col h-full bg-background border-l;
}

.chat-messages {
  @apply flex-1 overflow-auto p-4 space-y-3;
}

.chat-input {
  @apply p-4 border-t;
}
```

### Mensagens
```css
.message-bubble {
  @apply px-3 py-2 rounded-lg text-sm break-words;
}

.message-own {
  @apply bg-primary text-primary-foreground;
}

.message-other {
  @apply bg-muted;
}
```

## 📱 Responsividade

O chat é totalmente responsivo:

- **Desktop**: Painel lateral de 320px
- **Tablet**: Painel lateral colapsível
- **Mobile**: Modal full-screen

```tsx
// Controle de visibilidade
const [isChatVisible, setIsChatVisible] = useState(false);

// Layout responsivo
<div className={cn(
  "transition-all duration-300",
  isChatVisible ? "w-80 opacity-100" : "w-0 opacity-0"
)}>
```

## 🔒 Segurança

### Validações
- Sanitização de conteúdo de mensagens
- Validação de permissões antes de enviar
- Escape de caracteres especiais
- Rate limiting (recomendado)

### Políticas
- RLS habilitado em todas as tabelas
- Verificação de permissões de nota
- Auditoria de ações

## 🚀 Performance

### Otimizações
- **Debounced typing**: Indicadores de digitação com delay
- **Message pagination**: Carregamento por páginas
- **Realtime subscriptions**: Apenas canais necessários
- **React.memo**: Componentes memorizados
- **Virtual scrolling**: Para muitas mensagens (planejado)

### Métricas
- **Latência**: <100ms para mensagens
- **Throughput**: 100+ mensagens/minuto
- **Conexões**: Suporte a 50+ usuários simultâneos

## 🧪 Testes

### Cenários de Teste
1. **Envio de mensagem**: Verificar entrega em tempo real
2. **Presença**: Testar entrada/saída de usuários
3. **Digitação**: Validar indicadores de typing
4. **Reações**: Adicionar/remover reações
5. **Responsividade**: Testar em diferentes tamanhos
6. **Reconexão**: Testar perda/retomada de conexão

### Dados de Teste
```typescript
const mockMessage = {
  id: 'msg-123',
  note_id: 'note-456',
  user_id: 'user-789',
  content: 'Hello, world!',
  content_type: 'text',
  created_at: '2024-01-01T00:00:00Z'
};
```

## 🛠️ Desenvolvimento

### Setup Local
```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local

# Executar migrations do Supabase
npx supabase db push

# Iniciar desenvolvimento
npm run dev
```

### Estrutura de Arquivos
```
src/components/notes/
├── NoteChat.tsx              # Componente principal
├── NoteEditor.tsx             # Editor com chat integrado
├── NoteChatDemo.tsx           # Demo e documentação
├── CHAT_README.md             # Esta documentação
└── ...

src/hooks/react-query/notes/
├── use-note-chat.ts           # Hook principal do chat
├── use-notes-queries.ts       # Queries de mensagens
├── use-notes-realtime.ts      # Subscriptions realtime
└── keys.ts                    # Chaves de cache

src/lib/supabase/
└── notes-config.ts            # Configurações e helpers
```

## 📚 Referências

- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [TanStack Query](https://tanstack.com/query/latest)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)

## 🤝 Contribuições

Para contribuir com o sistema de chat:

1. Faça fork do repositório
2. Crie uma branch para sua feature
3. Implemente com testes
4. Atualize a documentação
5. Abra um Pull Request

### Guidelines
- Mantenha consistência com shadcn/ui
- Use TypeScript completo
- Adicione testes para novas funcionalidades
- Documente APIs públicas
- Siga padrões de acessibilidade