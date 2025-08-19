# Notes System Components

Sistema completo de notas em React com TipTap editor integrado, suporte a tempo real e design responsivo.

## Componentes Principais

### `NotesContainer`
Componente principal que orquestra todo o sistema de notas.

```tsx
import { NotesContainer } from '@/components/notes';

function App() {
  return (
    <NotesContainer
      userId="user-123"
      initialNoteId="note-456" // Opcional
      showSidebar={true}
      onBack={() => console.log('Back clicked')}
    />
  );
}
```

### `NotesList`
Lista completa de notas com filtros e busca.

```tsx
import { NotesList } from '@/components/notes';

function NotesPage() {
  return (
    <NotesList
      userId="user-123"
      viewMode="grid" // ou "list"
      onNoteSelect={(note) => console.log('Note selected:', note)}
      onNoteCreate={() => console.log('Note created')}
      onNoteEdit={(noteId) => console.log('Edit note:', noteId)}
      onNoteDelete={(noteId) => console.log('Delete note:', noteId)}
    />
  );
}
```

### `NoteEditor`
Editor rico com TipTap para edição de notas.

```tsx
import { NoteEditor } from '@/components/notes';

function EditNote({ noteId }) {
  return (
    <NoteEditor
      noteId={noteId}
      userId="user-123"
      enableRealtime={true}
      onBack={() => console.log('Back to list')}
      onSave={(note) => console.log('Note saved:', note)}
      onDelete={(noteId) => console.log('Note deleted:', noteId)}
    />
  );
}
```

### `NotesSidebar`
Sidebar compacta para navegação entre notas.

```tsx
import { NotesSidebar } from '@/components/notes';

function Sidebar() {
  return (
    <NotesSidebar
      userId="user-123"
      selectedNoteId="note-456"
      onNoteSelect={(note) => console.log('Note selected:', note)}
      onNoteCreate={() => console.log('Note created')}
    />
  );
}
```

## Recursos Principais

### ✅ Editor Rico (TipTap)
- Formatação de texto (negrito, itálico, sublinhado, etc.)
- Cabeçalhos (H1, H2, H3)
- Listas (bullets, numeradas, tarefas)
- Links e imagens
- Tabelas
- Blocos de código com syntax highlighting
- Alinhamento de texto
- Quotes e divisores

### ✅ Funcionalidades Avançadas
- Auto-save com debounce
- Contagem de palavras e caracteres
- Tempo de leitura estimado
- Histórico de undo/redo
- Exportação (Markdown, HTML, TXT)
- Busca em tempo real
- Filtros por tags, estrelas, arquivados
- Agrupamento por data

### ✅ Design Responsivo
- Layout adaptativo (mobile/desktop)
- Modo grid e lista
- Sidebar colapsável
- Dark mode support
- Animações suaves

### ✅ Estados de Loading
- Skeletons durante carregamento
- Estados vazios informativos
- Tratamento de erros
- Indicadores de salvamento

## Dependências

As seguintes dependências são necessárias:

```json
{
  "@tiptap/react": "^3.2.0",
  "@tiptap/starter-kit": "^3.2.0",
  "@tiptap/extension-placeholder": "^3.2.0",
  "@tiptap/extension-character-count": "^3.2.0",
  "@tiptap/extension-typography": "^3.2.0",
  "@tiptap/extension-link": "^3.2.0",
  "@tiptap/extension-image": "^3.2.0",
  "@tiptap/extension-task-list": "^3.2.0",
  "@tiptap/extension-task-item": "^3.2.0",
  "@tiptap/extension-table": "^3.2.0",
  "@tiptap/extension-table-row": "^3.2.0",
  "@tiptap/extension-table-cell": "^3.2.0",
  "@tiptap/extension-table-header": "^3.2.0",
  "@tiptap/extension-code-block-lowlight": "^3.2.0",
  "@tiptap/extension-text-align": "^3.2.0",
  "@tiptap/extension-underline": "^3.2.0",
  "lowlight": "^3.3.0",
  "date-fns": "^3.6.0",
  "sonner": "^2.0.3"
}
```

## Integração com Hooks

Os componentes usam os hooks do sistema de notas:

```tsx
import { useNotes, useNoteTags, useSingleNote } from '@/hooks/useNotes';

// Lista de notas
const { notes, createNote, deleteNote, toggleStar } = useNotes(userId);

// Nota específica
const { note, updateNote, isLoading } = useSingleNote(noteId);

// Tags
const { tags, createTag, addTagToNote } = useNoteTags(userId);
```

## Configuração de Tipos

Certifique-se de que os tipos estão configurados corretamente:

```tsx
// types/supabase.ts
export interface Note {
  id: string;
  user_id: string;
  title?: string;
  content: any; // TipTap JSON
  content_text?: string;
  is_starred: boolean;
  is_archived: boolean;
  word_count: number;
  reading_time: number;
  created_at: string;
  updated_at: string;
}
```

## Customização

### Tema e Estilos
Os componentes usam classes do Tailwind CSS e shadcn/ui. Para customizar:

```tsx
// Custom styling
<NotesContainer className="bg-custom-bg" />

// Custom theme colors
<NoteEditor className="prose-custom" />
```

### Configurações do Editor
Customize o editor TipTap:

```tsx
// Adicione extensões personalizadas
const editor = useEditor({
  extensions: [
    StarterKit,
    // Suas extensões personalizadas
  ],
});
```

## Tempo Real (Colaboração)

O sistema inclui suporte básico para colaboração em tempo real através do componente `TiptapCollaboration`. Para uma implementação completa, considere:

1. **Liveblocks** - Solução completa de colaboração
2. **Yjs** - CRDT para sincronização
3. **Socket.io** - WebSockets customizados
4. **Supabase Realtime** - Para casos simples

## Melhores Práticas

### Performance
- Use `React.memo` para componentes pesados
- Implemente virtualização para listas grandes
- Debounce nas operações de busca

### Acessibilidade
- Suporte completo a navegação por teclado
- Labels adequados para screen readers
- Contraste apropriado para texto

### SEO
- Meta tags dinâmicas baseadas no conteúdo
- URLs amigáveis para notas
- Sitemap para notas públicas

## Exemplos de Uso

Consulte `NotesExample.tsx` para exemplos completos de integração.

## Troubleshooting

### Problema: Editor não carrega
- Verifique se todas as dependências do TipTap estão instaladas
- Confirme que o `lowlight` está configurado corretamente

### Problema: Auto-save não funciona
- Verifique a configuração dos hooks
- Confirme que o `userId` é válido
- Teste a conectividade com o backend

### Problema: Tempo real não sincroniza
- Verifique a configuração do WebSocket/Supabase
- Confirme as permissões de acesso
- Teste a conectividade de rede

## Próximos Passos

1. **Colaboração em Tempo Real** - Implementar CRDT completo
2. **Plugins do Editor** - Adicionar mais extensões TipTap
3. **Tags Visuais** - Sistema de tags mais avançado
4. **Templates** - Templates de notas pré-definidos
5. **Exportação Avançada** - PDF, DOCX, etc.
6. **Integração com IA** - Sugestões e correções automáticas