'use client';

import { createQueryHook } from '@/hooks/use-query';
import { useSupabase } from '@/hooks/useSupabase';
import { notesKeys } from './keys';
import {
  getUserNotes,
  searchNotes as searchNotesApi,
  getNoteMessages,
  getUserPreferences,
} from '@/lib/supabase/notes-config';
import type { Note } from '@/lib/supabase/notes-config';

interface UseNotesOptions {
  limit?: number;
  offset?: number;
  orderBy?: keyof Note;
  ascending?: boolean;
  includeArchived?: boolean;
  onlyStarred?: boolean;
}

/**
 * Hook for fetching user notes with options
 */
export const useNotes = (userId: string, options: UseNotesOptions = {}) => {
  const supabase = useSupabase();
  
  const {
    limit = 50,
    offset = 0,
    orderBy = 'updated_at',
    ascending = false,
    includeArchived = false,
    onlyStarred = false,
  } = options;

  return createQueryHook(
    notesKeys.list(JSON.stringify({ userId, limit, offset, orderBy, ascending, includeArchived, onlyStarred })),
    async () => {
      return await getUserNotes(supabase, userId, {
        limit,
        offset,
        orderBy,
        ascending,
        includeArchived,
        onlyStarred,
      });
    },
    {
      enabled: !!userId,
      staleTime: 30000, // 30 seconds
      gcTime: 300000, // 5 minutes
      refetchOnWindowFocus: false,
    }
  )();
};

/**
 * Hook for fetching a single note by ID
 */
export const useNote = (noteId: string) => {
  const supabase = useSupabase();

  return createQueryHook(
    notesKeys.detail(noteId),
    async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('id', noteId)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    {
      enabled: !!noteId,
      staleTime: 60000, // 1 minute
      refetchOnWindowFocus: false,
    }
  )();
};

/**
 * Hook for searching notes
 */
export const useNoteSearch = (userId: string, searchQuery: string) => {
  const supabase = useSupabase();

  return createQueryHook(
    notesKeys.search(searchQuery),
    async () => {
      if (!searchQuery.trim()) {
        return [];
      }
      return await searchNotesApi(supabase, userId, searchQuery);
    },
    {
      enabled: !!userId && !!searchQuery.trim(),
      staleTime: 30000, // 30 seconds
      refetchOnWindowFocus: false,
    }
  )();
};

/**
 * Hook for fetching note messages (chat)
 */
export const useNoteMessages = (noteId: string, options: { limit?: number; offset?: number } = {}) => {
  const supabase = useSupabase();
  const { limit = 100, offset = 0 } = options;

  return createQueryHook(
    notesKeys.messages(noteId),
    async () => {
      return await getNoteMessages(supabase, noteId, { limit, offset });
    },
    {
      enabled: !!noteId,
      staleTime: 10000, // 10 seconds
      refetchOnWindowFocus: false,
    }
  )();
};

/**
 * Hook for fetching user tags
 */
export const useNoteTags = (userId: string) => {
  const supabase = useSupabase();

  return createQueryHook(
    notesKeys.tags(),
    async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('user_id', userId)
        .order('usage_count', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    {
      enabled: !!userId,
      staleTime: 60000, // 1 minute
      refetchOnWindowFocus: false,
    }
  )();
};

/**
 * Hook for fetching user preferences
 */
export const useNotePreferences = (userId: string) => {
  const supabase = useSupabase();

  return createQueryHook(
    notesKeys.preferences(userId),
    async () => {
      return await getUserPreferences(supabase, userId);
    },
    {
      enabled: !!userId,
      staleTime: 300000, // 5 minutes
      refetchOnWindowFocus: false,
    }
  )();
};