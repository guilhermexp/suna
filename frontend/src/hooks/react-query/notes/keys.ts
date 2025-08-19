import { createQueryKeys } from '@/hooks/use-query';

export const notesKeys = createQueryKeys({
  all: ['notes'] as const,
  lists: () => [...notesKeys.all, 'list'] as const,
  list: (filters: string) => [...notesKeys.lists(), { filters }] as const,
  details: () => [...notesKeys.all, 'detail'] as const,
  detail: (id: string) => [...notesKeys.details(), id] as const,
  search: (query: string) => [...notesKeys.all, 'search', query] as const,
  messages: (noteId: string) => [...notesKeys.all, 'messages', noteId] as const,
  messageReactions: (messageId: string) => [...notesKeys.all, 'reactions', messageId] as const,
  presence: (noteId: string) => [...notesKeys.all, 'presence', noteId] as const,
  preferences: (userId: string) => [...notesKeys.all, 'preferences', userId] as const,
  tags: () => [...notesKeys.all, 'tags'] as const,
});