# Sistema de Upload de Arquivos para Notas

Este documento descreve como configurar e usar o sistema de upload de arquivos para as notas.

## Configuração

### 1. Banco de Dados

Execute a migração SQL para criar a tabela de anexos e configurar as políticas de segurança:

```sql
-- Execute o arquivo: migrations/create_note_attachments_table.sql
```

### 2. Supabase Storage

O sistema utiliza o bucket `note-attachments` no Supabase Storage. A migração já cria automaticamente:

- Bucket `note-attachments` com limite de 10MB por arquivo
- Políticas de segurança (RLS) para acesso restrito por usuário
- Tipos MIME permitidos (imagens, PDFs, documentos, etc.)

### 3. Estrutura de Arquivos

Os arquivos são organizados da seguinte forma no storage:
```
note-attachments/
├── {note-id}/
│   ├── {timestamp}-{random-id}.{extension}
│   └── ...
```

## Componentes

### 1. NoteFileUpload

Componente principal para upload de arquivos com:
- Drag & drop
- Preview de imagens
- Progress bar
- Validação de tipos e tamanhos
- Suporte para múltiplos arquivos

```tsx
<NoteFileUpload
  noteId={noteId}
  onFileUploaded={handleFileUploaded}
  maxFiles={5}
  maxFileSize={10 * 1024 * 1024} // 10MB
  allowedTypes={['image/*', 'application/pdf', 'text/*']}
/>
```

### 2. NoteAttachments

Componente para listar e gerenciar anexos:
- Lista de anexos com preview
- Download e visualização
- Exclusão com confirmação
- Modo compacto

```tsx
<NoteAttachments
  attachments={attachments}
  onAttachmentDeleted={handleAttachmentDeleted}
  maxVisible={3}
/>
```

### 3. EditorToolbar

Integração com o editor TipTap:
- Botão de upload na toolbar
- Inserção automática de imagens no editor
- Dialog modal para upload

## Funcionalidades

### Upload de Arquivos

1. **Drag & Drop**: Arraste arquivos diretamente para a área de upload
2. **Seleção Manual**: Clique para abrir o seletor de arquivos
3. **Validação**: Verifica tipo, tamanho e quantidade de arquivos
4. **Preview**: Mostra preview para imagens
5. **Progress**: Barra de progresso durante o upload

### Tipos de Arquivo Suportados

- **Imagens**: JPEG, PNG, GIF, WebP, SVG
- **Documentos**: PDF, Word (DOC/DOCX), Excel (XLS/XLSX)
- **Texto**: TXT, Markdown, CSV, JSON
- **Compressão**: ZIP

### Integração com Editor

- **Imagens**: Inseridas automaticamente no editor após upload
- **Links**: Outros tipos de arquivo podem ser linkados no texto
- **Anexos**: Lista de anexos exibida no final da nota

## Segurança

### Row Level Security (RLS)

- Usuários só podem ver/editar anexos de suas próprias notas
- Políticas automáticas baseadas na propriedade da nota
- Isolamento completo entre usuários

### Storage Policies

- Acesso restrito por pasta baseado no ID da nota
- Upload apenas para notas próprias
- Exclusão apenas de arquivos próprios

### Validação

- Verificação de tipos MIME no frontend e backend
- Limite de tamanho por arquivo (10MB)
- Limite de quantidade de arquivos por upload
- Sanitização de nomes de arquivo

## API Functions

### Upload Functions

```typescript
// Upload de arquivo único
const result = await uploadNoteAttachment(file, noteId, {
  onProgress: (progress) => console.log(progress)
});

// Upload múltiplo
const results = await uploadMultipleFiles(files, 'note-attachments', basePath, {
  onProgress: (index, total, file) => console.log(`${index}/${total}: ${file.name}`),
  onFileComplete: (file, result) => console.log('Completed:', file.name),
  onError: (file, error) => console.error('Error:', error)
});
```

### Management Functions

```typescript
// Listar anexos
const { data: attachments } = await getNoteAttachments(noteId);

// Excluir anexo
await deleteAttachment(attachmentId);

// Obter informações do arquivo
const { data: fileInfo } = await getFileInfo('note-attachments', filePath);
```

## Utilities

### File Utils

```typescript
import { fileUtils } from '@/lib/supabase/storage';

// Verificar se é imagem
const isImage = fileUtils.isImage(file);

// Verificar tipo permitido
const isAllowed = fileUtils.isAllowedType(file, allowedTypes);

// Formatar tamanho
const sizeText = fileUtils.formatFileSize(file.size);

// Gerar thumbnail
const thumbnail = await fileUtils.generateThumbnail(file, 200, 200);
```

## Troubleshooting

### Problemas Comuns

1. **Upload falha**: Verificar políticas RLS e permissões do bucket
2. **Imagem não aparece**: Verificar se o bucket é público
3. **Tipo não permitido**: Adicionar MIME type na lista de permitidos
4. **Limite de tamanho**: Ajustar limite no bucket e no código

### Debug

```typescript
// Ativar logs detalhados
localStorage.setItem('debug-uploads', 'true');

// Verificar permissões
const { data, error } = await supabase.storage
  .from('note-attachments')
  .list(noteId);
```

## Performance

### Otimizações

1. **Lazy Loading**: Anexos carregados sob demanda
2. **Thumbnails**: Gerados no frontend para preview
3. **Compression**: Imagens podem ser comprimidas antes do upload
4. **Caching**: URLs públicas são cacheadas

### Limites Recomendados

- **Máximo 10 arquivos por upload**
- **Máximo 10MB por arquivo**
- **Máximo 100MB total por nota**
- **Preview apenas para primeiros 3-5 anexos**