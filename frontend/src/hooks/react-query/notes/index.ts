// Export all notes-related hooks
export * from './keys';
export * from './use-notes-queries';
export * from './use-notes-mutations';
export * from './use-notes-realtime';

// Re-export types for convenience
export type {
  Note,
  Tag,
  NoteTag,
  NoteMessage,
  UserNotePreferences,
} from '@/lib/supabase/notes-config';