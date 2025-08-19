'use client';

import React, { useState, useCallback } from 'react';
import { useSupabase } from './useSupabase';
import {
  // Queries
  useNotes as useNotesQuery,
  useNote,
  useNoteSearch as useNoteSearchQuery,
  useNoteMessages as useNoteMessagesQuery,
  useNoteTags as useNoteTagsQuery,
  useNotePreferences as useNotePreferencesQuery,
  
  // Mutations
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
  useToggleNoteStar,
  useToggleNoteArchive,
  useCreateTag,
  useUpdateTag,
  useDeleteTag,
  useAddTagToNote,
  useRemoveTagFromNote,
  useSendNoteMessage,
  useUpdateNoteMessage,
  useDeleteNoteMessage,
  useUpdateNotePreferences,
  
  // Realtime
  useNotesRealtimeSubscriptions,
  
  // Types
  type Note,
  type Tag,
  type NoteMessage,
  type UserNotePreferences,
} from './react-query/notes';

interface UseNotesOptions {
  limit?: number;
  offset?: number;
  orderBy?: keyof Note;
  ascending?: boolean;
  includeArchived?: boolean;
  onlyStarred?: boolean;
  enableRealtime?: boolean;
}

/**
 * Comprehensive hook for managing notes with CRUD operations and realtime updates
 */
export function useNotes(userId: string, options: UseNotesOptions = {}) {
  const {
    limit = 50,
    offset = 0,
    orderBy = 'updated_at',
    ascending = false,
    includeArchived = false,
    onlyStarred = false,
    enableRealtime = true,
  } = options;

  // Query hooks
  const notesQuery = useNotesQuery(userId, {
    limit,
    offset,
    orderBy,
    ascending,
    includeArchived,
    onlyStarred,
  });

  // Mutation hooks
  const createNoteMutation = useCreateNote(userId);
  const updateNoteMutation = useUpdateNote();
  const deleteNoteMutation = useDeleteNote();
  const toggleStarMutation = useToggleNoteStar();
  const toggleArchiveMutation = useToggleNoteArchive();

  // Setup realtime subscriptions
  useNotesRealtimeSubscriptions(userId, undefined, {
    enableNotes: enableRealtime,
    enableTags: enableRealtime,
    enableMessages: false, // Only enable for specific notes
  });

  return {
    // Data
    notes: notesQuery.data || [],
    isLoading: notesQuery.isLoading,
    error: notesQuery.error,
    isError: notesQuery.isError,

    // Actions
    createNote: createNoteMutation.mutateAsync,
    updateNote: updateNoteMutation.mutateAsync,
    deleteNote: deleteNoteMutation.mutateAsync,
    toggleStar: toggleStarMutation.mutateAsync,
    toggleArchive: toggleArchiveMutation.mutateAsync,
    
    // Mutation states
    isCreating: createNoteMutation.isPending,
    isUpdating: updateNoteMutation.isPending,
    isDeleting: deleteNoteMutation.isPending,
    isTogglingStatus: toggleStarMutation.isPending || toggleArchiveMutation.isPending,
    
    // Utils
    refetch: notesQuery.refetch,
  };
}

/**
 * Hook for managing note tags
 */
export function useNoteTags(userId: string) {
  // Query hooks
  const tagsQuery = useNoteTagsQuery(userId);

  // Mutation hooks
  const createTagMutation = useCreateTag(userId);
  const updateTagMutation = useUpdateTag();
  const deleteTagMutation = useDeleteTag();
  const addTagToNoteMutation = useAddTagToNote();
  const removeTagFromNoteMutation = useRemoveTagFromNote();

  return {
    // Data
    tags: tagsQuery.data || [],
    isLoading: tagsQuery.isLoading,
    error: tagsQuery.error,
    isError: tagsQuery.isError,

    // Actions
    createTag: createTagMutation.mutateAsync,
    updateTag: updateTagMutation.mutateAsync,
    deleteTag: deleteTagMutation.mutateAsync,
    addTagToNote: addTagToNoteMutation.mutateAsync,
    removeTagFromNote: removeTagFromNoteMutation.mutateAsync,

    // Mutation states
    isCreating: createTagMutation.isPending,
    isUpdating: updateTagMutation.isPending,
    isDeleting: deleteTagMutation.isPending,
    isManagingNoteTags: addTagToNoteMutation.isPending || removeTagFromNoteMutation.isPending,

    // Utils
    refetch: tagsQuery.refetch,
  };
}

/**
 * Hook for managing note messages (chat) with realtime updates
 */
export function useNoteMessages(
  noteId: string, 
  options: { 
    limit?: number; 
    offset?: number;
    enableRealtime?: boolean;
  } = {}
) {
  const { limit = 100, offset = 0, enableRealtime = true } = options;

  // Query hooks
  const messagesQuery = useNoteMessagesQuery(noteId, { limit, offset });

  // Mutation hooks
  const sendMessageMutation = useSendNoteMessage(noteId);
  const updateMessageMutation = useUpdateNoteMessage(noteId);
  const deleteMessageMutation = useDeleteNoteMessage(noteId);

  // Setup realtime subscriptions for this specific note
  useNotesRealtimeSubscriptions('', noteId, {
    enableNotes: false,
    enableMessages: enableRealtime,
    enableTags: false,
  });

  return {
    // Data
    messages: messagesQuery.data || [],
    isLoading: messagesQuery.isLoading,
    error: messagesQuery.error,
    isError: messagesQuery.isError,

    // Actions
    sendMessage: sendMessageMutation.mutateAsync,
    updateMessage: updateMessageMutation.mutateAsync,
    deleteMessage: deleteMessageMutation.mutateAsync,

    // Mutation states
    isSending: sendMessageMutation.isPending,
    isUpdating: updateMessageMutation.isPending,
    isDeleting: deleteMessageMutation.isPending,

    // Utils
    refetch: messagesQuery.refetch,
  };
}

/**
 * Hook for searching notes with debouncing
 */
export function useNoteSearch(userId: string) {
  const supabase = useSupabase();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Note[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<Error | null>(null);

  // Use the query hook for reactive search
  const searchQueryResult = useNoteSearchQuery(userId, searchQuery);

  // Update local state when search results change
  React.useEffect(() => {
    setSearchResults(searchQueryResult.data || []);
    setIsSearching(searchQueryResult.isLoading);
    setSearchError(searchQueryResult.error);
  }, [searchQueryResult.data, searchQueryResult.isLoading, searchQueryResult.error]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchError(null);
  }, []);

  return {
    // State
    searchQuery,
    searchResults,
    isSearching,
    searchError,

    // Actions
    setSearchQuery,
    clearSearch,
    searchNotes: (query: string) => {
      setSearchQuery(query);
    },
  };
}

/**
 * Hook for managing user note preferences
 */
export function useNotePreferences(userId: string) {
  // Query hooks
  const preferencesQuery = useNotePreferencesQuery(userId);

  // Mutation hooks
  const updatePreferencesMutation = useUpdateNotePreferences(userId);

  return {
    // Data
    preferences: preferencesQuery.data,
    isLoading: preferencesQuery.isLoading,
    error: preferencesQuery.error,
    isError: preferencesQuery.isError,

    // Actions
    updatePreferences: updatePreferencesMutation.mutateAsync,

    // Mutation states
    isUpdating: updatePreferencesMutation.isPending,

    // Utils
    refetch: preferencesQuery.refetch,
  };
}

/**
 * Hook for managing a single note with realtime updates
 */
export function useSingleNote(noteId: string, enableRealtime = true) {
  // Query hooks
  const noteQuery = useNote(noteId);

  // Mutation hooks
  const updateNoteMutation = useUpdateNote();
  const deleteNoteMutation = useDeleteNote();
  const toggleStarMutation = useToggleNoteStar();
  const toggleArchiveMutation = useToggleNoteArchive();

  // Setup realtime for this specific note (through the parent user subscription)
  // The realtime will be handled by the user's note subscription

  return {
    // Data
    note: noteQuery.data,
    isLoading: noteQuery.isLoading,
    error: noteQuery.error,
    isError: noteQuery.isError,

    // Actions
    updateNote: (data: Partial<Note>) => updateNoteMutation.mutateAsync({ noteId, data }),
    deleteNote: () => deleteNoteMutation.mutateAsync(noteId),
    toggleStar: (isStarred: boolean) => toggleStarMutation.mutateAsync({ noteId, isStarred }),
    toggleArchive: (isArchived: boolean) => toggleArchiveMutation.mutateAsync({ noteId, isArchived }),

    // Mutation states
    isUpdating: updateNoteMutation.isPending,
    isDeleting: deleteNoteMutation.isPending,
    isTogglingStatus: toggleStarMutation.isPending || toggleArchiveMutation.isPending,

    // Utils
    refetch: noteQuery.refetch,
  };
}

// Export types for convenience
export type {
  Note,
  Tag,
  NoteMessage,
  UserNotePreferences,
};