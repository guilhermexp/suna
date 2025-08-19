/**
 * Supabase configuration for Notes and Chat functionality
 */

import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/supabase';

// Create Supabase client instance
export const supabase = createClient();

// Type definitions for Notes tables
export interface Note {
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

export interface Tag {
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

export interface NoteTag {
  id: string;
  note_id: string;
  tag_id: string;
  created_at: string;
}

export interface NoteMessage {
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

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface MessageWithReactions extends NoteMessage {
  reactions?: MessageReaction[];
  user?: {
    id: string;
    name: string;
    avatar?: string;
    email?: string;
  };
}

export interface NoteShare {
  id: string;
  note_id: string;
  shared_with_user_id?: string;
  shared_with_email?: string;
  permission: 'view' | 'comment' | 'edit';
  share_token?: string;
  expires_at?: string;
  created_at: string;
  created_by: string;
  accessed_at?: string;
  access_count: number;
}

export interface UserNotePreferences {
  id: string;
  user_id: string;
  editor_font_size: number;
  editor_font_family: string;
  editor_theme: string;
  editor_show_line_numbers: boolean;
  editor_word_wrap: boolean;
  sidebar_width: number;
  chat_position: 'right' | 'bottom' | 'floating';
  chat_width: number;
  auto_save: boolean;
  auto_save_interval: number;
  spell_check: boolean;
  notify_on_share: boolean;
  notify_on_comment: boolean;
  notify_on_mention: boolean;
  created_at: string;
  updated_at: string;
}

// Table names
export const TABLES = {
  NOTES: 'notes',
  TAGS: 'tags',
  NOTE_TAGS: 'note_tags',
  NOTE_MESSAGES: 'note_messages',
  MESSAGE_REACTIONS: 'message_reactions',
  NOTE_SHARES: 'note_shares',
  NOTE_ACTIVITIES: 'note_activities',
  NOTE_VERSIONS: 'note_versions',
  USER_NOTE_PREFERENCES: 'user_note_preferences',
} as const;

// Storage buckets
export const STORAGE_BUCKETS = {
  NOTE_ATTACHMENTS: 'note-attachments',
} as const;

// Realtime channels
export const CHANNELS = {
  NOTES: (noteId: string) => `notes:${noteId}`,
  CHAT: (noteId: string) => `chat:${noteId}`,
  USER_NOTES: (userId: string) => `user-notes:${userId}`,
} as const;

// Helper functions for Supabase operations

/**
 * Create a new note
 */
export async function createNote(
  supabase: any,
  data: Partial<Note>
): Promise<Note | null> {
  const { data: note, error } = await supabase
    .from(TABLES.NOTES)
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error('Error creating note:', error);
    return null;
  }

  return note;
}

/**
 * Update a note
 */
export async function updateNote(
  supabase: any,
  noteId: string,
  data: Partial<Note>
): Promise<Note | null> {
  const { data: note, error } = await supabase
    .from(TABLES.NOTES)
    .update(data)
    .eq('id', noteId)
    .select()
    .single();

  if (error) {
    console.error('Error updating note:', error);
    return null;
  }

  return note;
}

/**
 * Get notes for a user
 */
export async function getUserNotes(
  supabase: any,
  userId: string,
  options: {
    limit?: number;
    offset?: number;
    orderBy?: keyof Note;
    ascending?: boolean;
    includeArchived?: boolean;
    onlyStarred?: boolean;
  } = {}
): Promise<Note[]> {
  const {
    limit = 50,
    offset = 0,
    orderBy = 'updated_at',
    ascending = false,
    includeArchived = false,
    onlyStarred = false,
  } = options;

  let query = supabase
    .from(TABLES.NOTES)
    .select('*')
    .eq('user_id', userId)
    .eq('is_deleted', false);

  if (!includeArchived) {
    query = query.eq('is_archived', false);
  }

  if (onlyStarred) {
    query = query.eq('is_starred', true);
  }

  query = query
    .order(orderBy, { ascending })
    .range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching notes:', error);
    return [];
  }

  return data || [];
}

/**
 * Search notes
 */
export async function searchNotes(
  supabase: any,
  userId: string,
  searchQuery: string,
  limit: number = 20
): Promise<Note[]> {
  const { data, error } = await supabase
    .rpc('search_notes', {
      search_query: searchQuery,
      user_uuid: userId,
      limit_count: limit,
    });

  if (error) {
    console.error('Error searching notes:', error);
    return [];
  }

  return data || [];
}

/**
 * Get messages for a note
 */
export async function getNoteMessages(
  supabase: any,
  noteId: string,
  options: {
    limit?: number;
    offset?: number;
  } = {}
): Promise<NoteMessage[]> {
  const { limit = 100, offset = 0 } = options;

  const { data, error } = await supabase
    .from(TABLES.NOTE_MESSAGES)
    .select('*')
    .eq('note_id', noteId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }

  return data || [];
}

/**
 * Send a message to a note
 */
export async function sendNoteMessage(
  supabase: any,
  noteId: string,
  content: string,
  contentType: NoteMessage['content_type'] = 'text',
  replyToId?: string
): Promise<NoteMessage | null> {
  const { data: message, error } = await supabase
    .from(TABLES.NOTE_MESSAGES)
    .insert({
      note_id: noteId,
      content,
      content_type: contentType,
      reply_to_id: replyToId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error sending message:', error);
    return null;
  }

  return message;
}

/**
 * Upload attachment to a note
 */
export async function uploadNoteAttachment(
  supabase: any,
  noteId: string,
  file: File
): Promise<string | null> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) return null;

  const fileName = `${userId}/${noteId}/${Date.now()}-${file.name}`;

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.NOTE_ATTACHMENTS)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Error uploading attachment:', error);
    return null;
  }

  const {
    data: { publicUrl },
  } = supabase.storage
    .from(STORAGE_BUCKETS.NOTE_ATTACHMENTS)
    .getPublicUrl(fileName);

  return publicUrl;
}

/**
 * Share a note with another user
 */
export async function shareNote(
  supabase: any,
  noteId: string,
  sharedWithUserId: string,
  permission: NoteShare['permission'] = 'view'
): Promise<NoteShare | null> {
  const { data: share, error } = await supabase
    .from(TABLES.NOTE_SHARES)
    .insert({
      note_id: noteId,
      shared_with_user_id: sharedWithUserId,
      permission,
    })
    .select()
    .single();

  if (error) {
    console.error('Error sharing note:', error);
    return null;
  }

  return share;
}

/**
 * Get user preferences
 */
export async function getUserPreferences(
  supabase: any,
  userId: string
): Promise<UserNotePreferences | null> {
  const { data, error } = await supabase
    .from(TABLES.USER_NOTE_PREFERENCES)
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned
    console.error('Error fetching preferences:', error);
    return null;
  }

  // If no preferences exist, create default ones
  if (!data) {
    const { data: newPrefs, error: createError } = await supabase
      .from(TABLES.USER_NOTE_PREFERENCES)
      .insert({ user_id: userId })
      .select()
      .single();

    if (createError) {
      console.error('Error creating preferences:', createError);
      return null;
    }

    return newPrefs;
  }

  return data;
}

/**
 * Get messages with reactions for a note
 */
export async function getNoteMessagesWithReactions(
  supabase: any,
  noteId: string,
  options: {
    limit?: number;
    offset?: number;
  } = {}
): Promise<MessageWithReactions[]> {
  const { limit = 100, offset = 0 } = options;

  const { data: messages, error } = await supabase
    .from(TABLES.NOTE_MESSAGES)
    .select(`
      *,
      reactions:message_reactions(
        id,
        message_id,
        user_id,
        emoji,
        created_at
      )
    `)
    .eq('note_id', noteId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching messages with reactions:', error);
    return [];
  }

  return messages || [];
}

/**
 * Add reaction to a message
 */
export async function addMessageReaction(
  supabase: any,
  messageId: string,
  userId: string,
  emoji: string
): Promise<MessageReaction | null> {
  const { data, error } = await supabase
    .from(TABLES.MESSAGE_REACTIONS)
    .upsert({
      message_id: messageId,
      user_id: userId,
      emoji,
    }, {
      onConflict: 'message_id,user_id,emoji'
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding reaction:', error);
    return null;
  }

  return data;
}

/**
 * Remove reaction from a message
 */
export async function removeMessageReaction(
  supabase: any,
  messageId: string,
  userId: string,
  emoji: string
): Promise<boolean> {
  const { error } = await supabase
    .from(TABLES.MESSAGE_REACTIONS)
    .delete()
    .eq('message_id', messageId)
    .eq('user_id', userId)
    .eq('emoji', emoji);

  if (error) {
    console.error('Error removing reaction:', error);
    return false;
  }

  return true;
}

/**
 * Get reactions for a specific message
 */
export async function getMessageReactions(
  supabase: any,
  messageId: string
): Promise<MessageReaction[]> {
  const { data, error } = await supabase
    .from(TABLES.MESSAGE_REACTIONS)
    .select('*')
    .eq('message_id', messageId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching message reactions:', error);
    return [];
  }

  return data || [];
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
  supabase: any,
  userId: string,
  preferences: Partial<UserNotePreferences>
): Promise<UserNotePreferences | null> {
  const { data, error } = await supabase
    .from(TABLES.USER_NOTE_PREFERENCES)
    .update(preferences)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating preferences:', error);
    return null;
  }

  return data;
}