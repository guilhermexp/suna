/**
 * Basic Supabase Database types
 * This file should be generated using `supabase gen types typescript --project-id <project-id>`
 * For now, we'll use a basic interface that can be extended
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      notes: {
        Row: {
          id: string
          user_id: string
          title: string | null
          content: Json | null
          content_text: string | null
          is_starred: boolean
          is_archived: boolean
          is_deleted: boolean
          word_count: number
          reading_time: number
          last_accessed_at: string | null
          created_at: string
          updated_at: string
          metadata: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          content?: Json | null
          content_text?: string | null
          is_starred?: boolean
          is_archived?: boolean
          is_deleted?: boolean
          word_count?: number
          reading_time?: number
          last_accessed_at?: string | null
          created_at?: string
          updated_at?: string
          metadata?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string | null
          content?: Json | null
          content_text?: string | null
          is_starred?: boolean
          is_archived?: boolean
          is_deleted?: boolean
          word_count?: number
          reading_time?: number
          last_accessed_at?: string | null
          created_at?: string
          updated_at?: string
          metadata?: Json | null
        }
      }
      tags: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          icon: string | null
          description: string | null
          usage_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color: string
          icon?: string | null
          description?: string | null
          usage_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
          icon?: string | null
          description?: string | null
          usage_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      note_tags: {
        Row: {
          id: string
          note_id: string
          tag_id: string
          created_at: string
        }
        Insert: {
          id?: string
          note_id: string
          tag_id: string
          created_at?: string
        }
        Update: {
          id?: string
          note_id?: string
          tag_id?: string
          created_at?: string
        }
      }
      note_messages: {
        Row: {
          id: string
          note_id: string
          user_id: string
          content: string
          content_type: 'text' | 'image' | 'file' | 'code' | 'system'
          reply_to_id: string | null
          metadata: Json | null
          attachments: Json[] | null
          is_edited: boolean
          is_deleted: boolean
          created_at: string
          edited_at: string | null
          deleted_at: string | null
        }
        Insert: {
          id?: string
          note_id: string
          user_id: string
          content: string
          content_type?: 'text' | 'image' | 'file' | 'code' | 'system'
          reply_to_id?: string | null
          metadata?: Json | null
          attachments?: Json[] | null
          is_edited?: boolean
          is_deleted?: boolean
          created_at?: string
          edited_at?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          note_id?: string
          user_id?: string
          content?: string
          content_type?: 'text' | 'image' | 'file' | 'code' | 'system'
          reply_to_id?: string | null
          metadata?: Json | null
          attachments?: Json[] | null
          is_edited?: boolean
          is_deleted?: boolean
          created_at?: string
          edited_at?: string | null
          deleted_at?: string | null
        }
      }
      note_shares: {
        Row: {
          id: string
          note_id: string
          shared_with_user_id: string | null
          shared_with_email: string | null
          permission: 'view' | 'comment' | 'edit'
          share_token: string | null
          expires_at: string | null
          created_at: string
          created_by: string
          accessed_at: string | null
          access_count: number
        }
        Insert: {
          id?: string
          note_id: string
          shared_with_user_id?: string | null
          shared_with_email?: string | null
          permission?: 'view' | 'comment' | 'edit'
          share_token?: string | null
          expires_at?: string | null
          created_at?: string
          created_by: string
          accessed_at?: string | null
          access_count?: number
        }
        Update: {
          id?: string
          note_id?: string
          shared_with_user_id?: string | null
          shared_with_email?: string | null
          permission?: 'view' | 'comment' | 'edit'
          share_token?: string | null
          expires_at?: string | null
          created_at?: string
          created_by?: string
          accessed_at?: string | null
          access_count?: number
        }
      }
      user_note_preferences: {
        Row: {
          id: string
          user_id: string
          editor_font_size: number
          editor_font_family: string
          editor_theme: string
          editor_show_line_numbers: boolean
          editor_word_wrap: boolean
          sidebar_width: number
          chat_position: 'right' | 'bottom' | 'floating'
          chat_width: number
          auto_save: boolean
          auto_save_interval: number
          spell_check: boolean
          notify_on_share: boolean
          notify_on_comment: boolean
          notify_on_mention: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          editor_font_size?: number
          editor_font_family?: string
          editor_theme?: string
          editor_show_line_numbers?: boolean
          editor_word_wrap?: boolean
          sidebar_width?: number
          chat_position?: 'right' | 'bottom' | 'floating'
          chat_width?: number
          auto_save?: boolean
          auto_save_interval?: number
          spell_check?: boolean
          notify_on_share?: boolean
          notify_on_comment?: boolean
          notify_on_mention?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          editor_font_size?: number
          editor_font_family?: string
          editor_theme?: string
          editor_show_line_numbers?: boolean
          editor_word_wrap?: boolean
          sidebar_width?: number
          chat_position?: 'right' | 'bottom' | 'floating'
          chat_width?: number
          auto_save?: boolean
          auto_save_interval?: number
          spell_check?: boolean
          notify_on_share?: boolean
          notify_on_comment?: boolean
          notify_on_mention?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_notes: {
        Args: {
          search_query: string
          user_uuid: string
          limit_count: number
        }
        Returns: {
          id: string
          user_id: string
          title: string | null
          content: Json | null
          content_text: string | null
          is_starred: boolean
          is_archived: boolean
          is_deleted: boolean
          word_count: number
          reading_time: number
          last_accessed_at: string | null
          created_at: string
          updated_at: string
          metadata: Json | null
        }[]
      }
      increment_tag_usage: {
        Args: {
          tag_uuid: string
        }
        Returns: void
      }
      decrement_tag_usage: {
        Args: {
          tag_uuid: string
        }
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}