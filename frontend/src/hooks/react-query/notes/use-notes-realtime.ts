'use client';

import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/hooks/useSupabase';
import { notesKeys } from './keys';
import { TABLES, CHANNELS } from '@/lib/supabase/notes-config';
import type { Note, NoteMessage } from '@/lib/supabase/notes-config';

/**
 * Hook for setting up realtime subscriptions for user notes
 */
export function useNotesRealtime(userId: string, enabled = true) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || !userId) return;

    const channel = supabase
      .channel(CHANNELS.USER_NOTES(userId))
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLES.NOTES,
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          console.log('Realtime note change:', payload);
          
          // Invalidate and refetch notes lists
          await queryClient.invalidateQueries({
            queryKey: notesKeys.lists(),
          });
          
          // Update specific note in cache if it's a single note change
          if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedNote = payload.new as Note;
            queryClient.setQueryData(notesKeys.detail(updatedNote.id), updatedNote);
          } else if (payload.eventType === 'DELETE' && payload.old) {
            const deletedNote = payload.old as Note;
            queryClient.removeQueries({
              queryKey: notesKeys.detail(deletedNote.id),
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId, enabled, queryClient]);
}

/**
 * Hook for setting up realtime subscriptions for note messages (chat)
 */
export function useNoteMessagesRealtime(noteId: string, enabled = true) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || !noteId) return;

    const channel = supabase
      .channel(CHANNELS.CHAT(noteId))
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLES.NOTE_MESSAGES,
          filter: `note_id=eq.${noteId}`,
        },
        async (payload) => {
          console.log('Realtime message change:', payload);
          
          // Invalidate and refetch messages
          await queryClient.invalidateQueries({
            queryKey: notesKeys.messages(noteId),
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, noteId, enabled, queryClient]);
}

/**
 * Hook for setting up realtime subscriptions for note tags
 */
export function useNoteTagsRealtime(userId: string, enabled = true) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || !userId) return;

    const tagsChannel = supabase
      .channel(`${CHANNELS.USER_NOTES(userId)}-tags`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLES.TAGS,
          filter: `user_id=eq.${userId}`,
        },
        async () => {
          console.log('Realtime tags change');
          
          // Invalidate and refetch tags
          await queryClient.invalidateQueries({
            queryKey: notesKeys.tags(),
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLES.NOTE_TAGS,
        },
        async () => {
          console.log('Realtime note-tags change');
          
          // Invalidate tags and notes lists
          await queryClient.invalidateQueries({
            queryKey: notesKeys.tags(),
          });
          await queryClient.invalidateQueries({
            queryKey: notesKeys.lists(),
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tagsChannel);
    };
  }, [supabase, userId, enabled, queryClient]);
}

/**
 * Comprehensive hook that sets up all realtime subscriptions for notes
 */
export function useNotesRealtimeSubscriptions(
  userId: string,
  noteId?: string,
  options: {
    enableNotes?: boolean;
    enableMessages?: boolean;
    enableTags?: boolean;
  } = {}
) {
  const {
    enableNotes = true,
    enableMessages = true,
    enableTags = true,
  } = options;

  // Subscribe to user notes changes
  useNotesRealtime(userId, enableNotes);

  // Subscribe to specific note messages if noteId is provided
  useNoteMessagesRealtime(noteId || '', enableMessages && !!noteId);

  // Subscribe to tags changes
  useNoteTagsRealtime(userId, enableTags);

  return {
    isSubscribed: enableNotes || enableMessages || enableTags,
  };
}