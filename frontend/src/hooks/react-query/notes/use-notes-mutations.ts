'use client';

import { useQueryClient } from '@tanstack/react-query';
import { createMutationHook } from '@/hooks/use-query';
import { useSupabase } from '@/hooks/useSupabase';
import { notesKeys } from './keys';
import {
  createNote as createNoteApi,
  updateNote as updateNoteApi,
  sendNoteMessage as sendNoteMessageApi,
  updateUserPreferences as updateUserPreferencesApi,
  TABLES,
} from '@/lib/supabase/notes-config';
import type { Note, Tag, NoteTag, NoteMessage, UserNotePreferences } from '@/lib/supabase/notes-config';

/**
 * Mutation hook for creating a new note
 */
export const useCreateNote = (userId: string) => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return createMutationHook(
    async (noteData: Partial<Note>) => {
      return await createNoteApi(supabase, { ...noteData, user_id: userId });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: notesKeys.lists(),
        });
      },
      errorContext: {
        action: 'creating note',
        location: 'Notes',
      },
    }
  )();
};

/**
 * Mutation hook for updating a note
 */
export const useUpdateNote = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return createMutationHook(
    async ({ noteId, data }: { noteId: string; data: Partial<Note> }) => {
      return await updateNoteApi(supabase, noteId, data);
    },
    {
      onSuccess: (data, variables) => {
        // Update specific note in cache
        queryClient.setQueryData(notesKeys.detail(variables.noteId), data);
        
        // Invalidate lists to refresh
        queryClient.invalidateQueries({
          queryKey: notesKeys.lists(),
        });
      },
      errorContext: {
        action: 'updating note',
        location: 'Notes',
      },
    }
  )();
};

/**
 * Mutation hook for deleting a note (soft delete)
 */
export const useDeleteNote = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return createMutationHook(
    async (noteId: string) => {
      return await updateNoteApi(supabase, noteId, { is_deleted: true });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: notesKeys.lists(),
        });
      },
      errorContext: {
        action: 'deleting note',
        location: 'Notes',
      },
    }
  )();
};

/**
 * Mutation hook for toggling note star status
 */
export const useToggleNoteStar = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return createMutationHook(
    async ({ noteId, isStarred }: { noteId: string; isStarred: boolean }) => {
      return await updateNoteApi(supabase, noteId, { is_starred: isStarred });
    },
    {
      onSuccess: (data, variables) => {
        // Update specific note in cache
        queryClient.setQueryData(notesKeys.detail(variables.noteId), data);
        
        // Invalidate lists to refresh
        queryClient.invalidateQueries({
          queryKey: notesKeys.lists(),
        });
      },
      errorContext: {
        action: 'toggling note star',
        location: 'Notes',
      },
    }
  )();
};

/**
 * Mutation hook for toggling note archive status
 */
export const useToggleNoteArchive = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return createMutationHook(
    async ({ noteId, isArchived }: { noteId: string; isArchived: boolean }) => {
      return await updateNoteApi(supabase, noteId, { is_archived: isArchived });
    },
    {
      onSuccess: (data, variables) => {
        // Update specific note in cache
        queryClient.setQueryData(notesKeys.detail(variables.noteId), data);
        
        // Invalidate lists to refresh
        queryClient.invalidateQueries({
          queryKey: notesKeys.lists(),
        });
      },
      errorContext: {
        action: 'toggling note archive',
        location: 'Notes',
      },
    }
  )();
};

/**
 * Mutation hook for creating a new tag
 */
export const useCreateTag = (userId: string) => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return createMutationHook(
    async (tagData: Partial<Tag>) => {
      const { data, error } = await supabase
        .from(TABLES.TAGS)
        .insert({ ...tagData, user_id: userId })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as Tag;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: notesKeys.tags(),
        });
      },
      errorContext: {
        action: 'creating tag',
        location: 'Notes',
      },
    }
  )();
};

/**
 * Mutation hook for updating a tag
 */
export const useUpdateTag = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return createMutationHook(
    async ({ tagId, data }: { tagId: string; data: Partial<Tag> }) => {
      const { data: result, error } = await supabase
        .from(TABLES.TAGS)
        .update(data)
        .eq('id', tagId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return result as Tag;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: notesKeys.tags(),
        });
      },
      errorContext: {
        action: 'updating tag',
        location: 'Notes',
      },
    }
  )();
};

/**
 * Mutation hook for deleting a tag
 */
export const useDeleteTag = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return createMutationHook(
    async (tagId: string) => {
      const { error } = await supabase
        .from(TABLES.TAGS)
        .delete()
        .eq('id', tagId);

      if (error) {
        throw new Error(error.message);
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: notesKeys.tags(),
        });
        queryClient.invalidateQueries({
          queryKey: notesKeys.lists(),
        });
      },
      errorContext: {
        action: 'deleting tag',
        location: 'Notes',
      },
    }
  )();
};

/**
 * Mutation hook for adding a tag to a note
 */
export const useAddTagToNote = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return createMutationHook(
    async ({ noteId, tagId }: { noteId: string; tagId: string }) => {
      const { data, error } = await supabase
        .from(TABLES.NOTE_TAGS)
        .insert({ note_id: noteId, tag_id: tagId })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Update tag usage count
      await supabase.rpc('increment_tag_usage', { tag_uuid: tagId });

      return data as NoteTag;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: notesKeys.tags(),
        });
        queryClient.invalidateQueries({
          queryKey: notesKeys.lists(),
        });
      },
      errorContext: {
        action: 'adding tag to note',
        location: 'Notes',
      },
    }
  )();
};

/**
 * Mutation hook for removing a tag from a note
 */
export const useRemoveTagFromNote = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return createMutationHook(
    async ({ noteId, tagId }: { noteId: string; tagId: string }) => {
      const { error } = await supabase
        .from(TABLES.NOTE_TAGS)
        .delete()
        .eq('note_id', noteId)
        .eq('tag_id', tagId);

      if (error) {
        throw new Error(error.message);
      }

      // Decrement tag usage count
      await supabase.rpc('decrement_tag_usage', { tag_uuid: tagId });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: notesKeys.tags(),
        });
        queryClient.invalidateQueries({
          queryKey: notesKeys.lists(),
        });
      },
      errorContext: {
        action: 'removing tag from note',
        location: 'Notes',
      },
    }
  )();
};

/**
 * Mutation hook for sending a message to a note
 */
export const useSendNoteMessage = (noteId: string) => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return createMutationHook(
    async ({
      content,
      contentType = 'text',
      replyToId,
    }: {
      content: string;
      contentType?: NoteMessage['content_type'];
      replyToId?: string;
    }) => {
      return await sendNoteMessageApi(supabase, noteId, content, contentType, replyToId);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: notesKeys.messages(noteId),
        });
      },
      errorContext: {
        action: 'sending message',
        location: 'Notes Chat',
      },
    }
  )();
};

/**
 * Mutation hook for updating a message
 */
export const useUpdateNoteMessage = (noteId: string) => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return createMutationHook(
    async ({ messageId, content }: { messageId: string; content: string }) => {
      const { data, error } = await supabase
        .from(TABLES.NOTE_MESSAGES)
        .update({
          content,
          is_edited: true,
          edited_at: new Date().toISOString(),
        })
        .eq('id', messageId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as NoteMessage;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: notesKeys.messages(noteId),
        });
      },
      errorContext: {
        action: 'updating message',
        location: 'Notes Chat',
      },
    }
  )();
};

/**
 * Mutation hook for deleting a message
 */
export const useDeleteNoteMessage = (noteId: string) => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return createMutationHook(
    async (messageId: string) => {
      const { error } = await supabase
        .from(TABLES.NOTE_MESSAGES)
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq('id', messageId);

      if (error) {
        throw new Error(error.message);
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: notesKeys.messages(noteId),
        });
      },
      errorContext: {
        action: 'deleting message',
        location: 'Notes Chat',
      },
    }
  )();
};

/**
 * Mutation hook for updating user preferences
 */
export const useUpdateNotePreferences = (userId: string) => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return createMutationHook(
    async (newPreferences: Partial<UserNotePreferences>) => {
      return await updateUserPreferencesApi(supabase, userId, newPreferences);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: notesKeys.preferences(userId),
        });
      },
      errorContext: {
        action: 'updating preferences',
        location: 'Notes Settings',
      },
    }
  )();
};