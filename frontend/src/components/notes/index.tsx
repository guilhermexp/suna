// Notes Components
export { NotesList } from './NotesList';
export { NoteEditor } from './NoteEditor';
export { NotesContainer } from './NotesContainer';
export { NotesSidebar } from './NotesSidebar';
export { EditorToolbar } from './EditorToolbar';
export { TiptapCollaboration } from './TiptapCollaboration';

// Example Components
export { NotesPage, NotesPageExample, EditNotePageExample, AuthenticatedNotesPage } from './NotesExample';
export { NotesPageDemo } from './NotesPageDemo';

// Re-export types for convenience
export type { Note, Tag, NoteMessage, UserNotePreferences } from '@/hooks/useNotes';