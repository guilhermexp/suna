# Notes Hooks - Supabase Integration

Complete React hooks for integrating with Supabase notes functionality, including CRUD operations, realtime updates, and TypeScript support.

## Overview

This module provides a comprehensive set of hooks for managing notes, tags, messages (chat), and user preferences with Supabase. All hooks include:

- ✅ **React Query integration** with caching and background updates
- ✅ **Realtime subscriptions** for live updates
- ✅ **Optimistic updates** for better UX
- ✅ **Error handling** with proper error contexts
- ✅ **TypeScript support** with full type safety
- ✅ **Loading states** for all operations

## Quick Start

### 1. Setup Providers

Make sure you have the Supabase provider in your app:

```tsx
// app/layout.tsx or app/providers.tsx
import { SupabaseProvider } from '@/hooks/useSupabase';

export function Providers({ children }) {
  return (
    <SupabaseProvider>
      {children}
    </SupabaseProvider>
  );
}
```

### 2. Use the Hooks

```tsx
import { useNotes, useNoteTags, useNoteMessages } from '@/hooks/useNotes';

function NotesComponent() {
  const { notes, createNote, isLoading } = useNotes(userId);
  const { tags, createTag } = useNoteTags(userId);
  
  // Your component logic
}
```

## Available Hooks

### Main Hooks (`useNotes.ts`)

#### `useNotes(userId, options?)`
Complete notes management with CRUD operations and realtime updates.

```tsx
const {
  // Data
  notes,
  isLoading,
  error,
  isError,

  // Actions
  createNote,
  updateNote,
  deleteNote,
  toggleStar,
  toggleArchive,
  
  // Mutation states
  isCreating,
  isUpdating,
  isDeleting,
  isTogglingStatus,
  
  // Utils
  refetch,
} = useNotes(userId, {
  limit: 50,
  orderBy: 'updated_at',
  ascending: false,
  includeArchived: false,
  onlyStarred: false,
  enableRealtime: true,
});
```

#### `useNoteTags(userId)`
Tag management with note association.

```tsx
const {
  // Data
  tags,
  isLoading,
  error,

  // Actions
  createTag,
  updateTag,
  deleteTag,
  addTagToNote,
  removeTagFromNote,

  // Mutation states
  isCreating,
  isUpdating,
  isDeleting,
  isManagingNoteTags,

  // Utils
  refetch,
} = useNoteTags(userId);
```

#### `useNoteMessages(noteId, options?)`
Chat/messaging functionality for notes with realtime updates.

```tsx
const {
  // Data
  messages,
  isLoading,
  error,

  // Actions
  sendMessage,
  updateMessage,
  deleteMessage,

  // Mutation states
  isSending,
  isUpdating,
  isDeleting,

  // Utils
  refetch,
} = useNoteMessages(noteId, {
  limit: 100,
  offset: 0,
  enableRealtime: true,
});
```

#### `useNoteSearch(userId)`
Search functionality with debouncing.

```tsx
const {
  // State
  searchQuery,
  searchResults,
  isSearching,
  searchError,

  // Actions
  setSearchQuery,
  clearSearch,
  searchNotes,
} = useNoteSearch(userId);
```

#### `useNotePreferences(userId)`
User preferences management.

```tsx
const {
  // Data
  preferences,
  isLoading,
  error,

  // Actions
  updatePreferences,

  // Mutation states
  isUpdating,

  // Utils
  refetch,
} = useNotePreferences(userId);
```

#### `useSingleNote(noteId, enableRealtime?)`
Single note management with direct operations.

```tsx
const {
  // Data
  note,
  isLoading,
  error,

  // Actions
  updateNote,
  deleteNote,
  toggleStar,
  toggleArchive,

  // Mutation states
  isUpdating,
  isDeleting,
  isTogglingStatus,

  // Utils
  refetch,
} = useSingleNote(noteId);
```

### Query Hooks (`use-notes-queries.ts`)

Low-level query hooks for specific use cases:

- `useNotes(userId, options)` - Fetch user notes
- `useNote(noteId)` - Fetch single note
- `useNoteSearch(userId, searchQuery)` - Search notes
- `useNoteMessages(noteId, options)` - Fetch note messages
- `useNoteTags(userId)` - Fetch user tags
- `useNotePreferences(userId)` - Fetch user preferences

### Mutation Hooks (`use-notes-mutations.ts`)

Low-level mutation hooks for specific operations:

- `useCreateNote(userId)`
- `useUpdateNote()`
- `useDeleteNote()`
- `useToggleNoteStar()`
- `useToggleNoteArchive()`
- `useCreateTag(userId)`
- `useUpdateTag()`
- `useDeleteTag()`
- `useAddTagToNote()`
- `useRemoveTagFromNote()`
- `useSendNoteMessage(noteId)`
- `useUpdateNoteMessage(noteId)`
- `useDeleteNoteMessage(noteId)`
- `useUpdateNotePreferences(userId)`

### Realtime Hooks (`use-notes-realtime.ts`)

Realtime subscription management:

- `useNotesRealtime(userId, enabled?)` - Subscribe to user notes changes
- `useNoteMessagesRealtime(noteId, enabled?)` - Subscribe to note messages
- `useNoteTagsRealtime(userId, enabled?)` - Subscribe to tag changes
- `useNotesRealtimeSubscriptions(userId, noteId?, options?)` - Comprehensive realtime setup

## Types

All TypeScript types are exported from the main module:

```tsx
import type {
  Note,
  Tag,
  NoteTag,
  NoteMessage,
  UserNotePreferences,
} from '@/hooks/useNotes';
```

### `Note`
```tsx
interface Note {
  id: string;
  user_id: string;
  title?: string;
  content: any; // TipTap JSON format
  content_text?: string;
  is_starred: boolean;
  is_archived: boolean;
  is_deleted: boolean;
  word_count: number;
  reading_time: number;
  last_accessed_at?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}
```

### `Tag`
```tsx
interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon?: string;
  description?: string;
  usage_count: number;
  created_at: string;
  updated_at: string;
}
```

### `NoteMessage`
```tsx
interface NoteMessage {
  id: string;
  note_id: string;
  user_id: string;
  content: string;
  content_type: 'text' | 'image' | 'file' | 'code' | 'system';
  reply_to_id?: string;
  metadata?: Record<string, any>;
  attachments?: any[];
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
  edited_at?: string;
  deleted_at?: string;
}
```

## Configuration

The hooks use the Supabase configuration from `@/lib/supabase/notes-config.ts`, which includes:

- Table names and schema definitions
- Helper functions for common operations
- Storage bucket configurations
- Realtime channel naming conventions

## Error Handling

All mutations include proper error handling with context:

```tsx
// Errors are automatically handled by the error handler
// You can also handle them manually:
try {
  await createNote({ title: 'New Note' });
} catch (error) {
  console.error('Failed to create note:', error);
}
```

## Performance Features

- **Optimistic Updates**: UI updates immediately, reverts on error
- **Intelligent Caching**: React Query caching with smart invalidation
- **Realtime Efficiency**: Selective subscriptions and automatic cleanup
- **Background Refetching**: Automatic data freshness
- **Request Deduplication**: Prevents duplicate network requests

## Examples

See `useNotes.example.ts` for comprehensive usage examples including:

- Complete notes dashboard
- Note with chat sidebar
- Search functionality
- Tag management
- Preferences handling

## Supabase Setup

Make sure your Supabase database has the required tables and functions:

### Required Tables
- `notes`
- `tags`
- `note_tags`
- `note_messages`
- `note_shares`
- `user_note_preferences`

### Required Functions
- `search_notes(search_query, user_uuid, limit_count)`
- `increment_tag_usage(tag_uuid)`
- `decrement_tag_usage(tag_uuid)`

### Required Policies
Ensure Row Level Security (RLS) is enabled with appropriate policies for user data access.

## Troubleshooting

### Common Issues

1. **"useSupabase must be used within a SupabaseProvider"**
   - Make sure `SupabaseProvider` wraps your app

2. **Realtime not working**
   - Check Supabase realtime configuration
   - Verify table policies allow realtime access

3. **TypeScript errors**
   - Ensure `@/types/supabase.ts` matches your database schema
   - Run `supabase gen types typescript` to generate types

4. **Performance issues**
   - Use pagination with `limit` and `offset`
   - Disable realtime for non-critical views
   - Consider using `React.memo` for expensive components