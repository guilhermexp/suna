'use client';

import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/hooks/useSupabase';
import { notesKeys } from './keys';
import { TABLES, CHANNELS } from '@/lib/supabase/notes-config';
import type { NoteMessage } from '@/lib/supabase/notes-config';

export interface PresenceUser {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
  online_at: string;
}

export interface TypingUser {
  id: string;
  name: string;
  avatar?: string;
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

/**
 * Hook for managing note chat functionality including presence and typing indicators
 */
export function useNoteChat(noteId: string, userId: string, userName?: string) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Setup presence and typing subscriptions
  useEffect(() => {
    if (!noteId || !userId) return;

    const channel = supabase
      .channel(`note-chat:${noteId}`)
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const users = Object.values(newState).flat() as PresenceUser[];
        setOnlineUsers(users.filter(user => user.id !== userId));
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined chat:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left chat:', key, leftPresences);
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.userId !== userId) {
          setTypingUsers(prev => {
            const filtered = prev.filter(u => u.id !== payload.userId);
            if (payload.isTyping && payload.user) {
              return [...filtered, payload.user];
            }
            return filtered;
          });
        }
      })
      .on('broadcast', { event: 'message_read' }, ({ payload }) => {
        if (payload.userId !== userId) {
          // Handle read receipts
          queryClient.invalidateQueries({
            queryKey: notesKeys.messages(noteId),
          });
        }
      })
      .subscribe(async (status) => {
        setIsConnected(status === 'SUBSCRIBED');
        
        if (status === 'SUBSCRIBED') {
          // Track presence
          await channel.track({
            id: userId,
            name: userName || `User ${userId.slice(-4)}`,
            avatar: '',
            email: `user${userId.slice(-4)}@example.com`,
            online_at: new Date().toISOString()
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [noteId, userId, userName, supabase, queryClient]);

  // Send typing indicator
  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (!noteId || !userId) return;

    supabase
      .channel(`note-chat:${noteId}`)
      .send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          userId,
          user: {
            id: userId,
            name: userName || `User ${userId.slice(-4)}`,
            avatar: ''
          },
          isTyping
        }
      });
  }, [noteId, userId, userName, supabase]);

  // Send read receipt
  const markMessageAsRead = useCallback((messageId: string) => {
    if (!noteId || !userId) return;

    supabase
      .channel(`note-chat:${noteId}`)
      .send({
        type: 'broadcast',
        event: 'message_read',
        payload: {
          userId,
          messageId,
          timestamp: new Date().toISOString()
        }
      });
  }, [noteId, userId, supabase]);

  // Add message reaction
  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    try {
      const { error } = await supabase
        .from('message_reactions')
        .upsert({
          message_id: messageId,
          user_id: userId,
          emoji,
        }, {
          onConflict: 'message_id,user_id,emoji'
        });

      if (error) {
        console.error('Error adding reaction:', error);
        return false;
      }

      // Invalidate messages query to refresh reactions
      await queryClient.invalidateQueries({
        queryKey: notesKeys.messages(noteId),
      });

      return true;
    } catch (error) {
      console.error('Error adding reaction:', error);
      return false;
    }
  }, [supabase, userId, noteId, queryClient]);

  // Remove message reaction
  const removeReaction = useCallback(async (messageId: string, emoji: string) => {
    try {
      const { error } = await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', userId)
        .eq('emoji', emoji);

      if (error) {
        console.error('Error removing reaction:', error);
        return false;
      }

      // Invalidate messages query to refresh reactions
      await queryClient.invalidateQueries({
        queryKey: notesKeys.messages(noteId),
      });

      return true;
    } catch (error) {
      console.error('Error removing reaction:', error);
      return false;
    }
  }, [supabase, userId, noteId, queryClient]);

  // Toggle reaction
  const toggleReaction = useCallback(async (messageId: string, emoji: string) => {
    // Check if user already reacted with this emoji
    const { data: existingReaction } = await supabase
      .from('message_reactions')
      .select('id')
      .eq('message_id', messageId)
      .eq('user_id', userId)
      .eq('emoji', emoji)
      .single();

    if (existingReaction) {
      return removeReaction(messageId, emoji);
    } else {
      return addReaction(messageId, emoji);
    }
  }, [supabase, userId, addReaction, removeReaction]);

  // Get message reactions
  const getMessageReactions = useCallback(async (messageId: string): Promise<MessageReaction[]> => {
    try {
      const { data, error } = await supabase
        .from('message_reactions')
        .select(`
          id,
          message_id,
          user_id,
          emoji,
          created_at
        `)
        .eq('message_id', messageId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching reactions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching reactions:', error);
      return [];
    }
  }, [supabase]);

  // Calculate unread messages count
  const calculateUnreadCount = useCallback((messages: NoteMessage[], lastReadMessageId?: string) => {
    if (!lastReadMessageId) {
      return messages.filter(msg => msg.user_id !== userId).length;
    }

    const lastReadIndex = messages.findIndex(msg => msg.id === lastReadMessageId);
    if (lastReadIndex === -1) {
      return messages.filter(msg => msg.user_id !== userId).length;
    }

    return messages
      .slice(lastReadIndex + 1)
      .filter(msg => msg.user_id !== userId).length;
  }, [userId]);

  return {
    // State
    onlineUsers,
    typingUsers,
    isConnected,
    unreadCount,
    
    // Actions
    sendTypingIndicator,
    markMessageAsRead,
    toggleReaction,
    addReaction,
    removeReaction,
    getMessageReactions,
    calculateUnreadCount,
    
    // Utils
    setUnreadCount
  };
}

/**
 * Hook for managing typing indicators with auto-cleanup
 */
export function useTypingIndicator(
  sendTypingIndicator: (isTyping: boolean) => void,
  delay: number = 2000
) {
  const [isTyping, setIsTyping] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const startTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      sendTypingIndicator(true);
    }

    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Set new timeout to stop typing
    const newTimeoutId = setTimeout(() => {
      setIsTyping(false);
      sendTypingIndicator(false);
      setTimeoutId(null);
    }, delay);

    setTimeoutId(newTimeoutId);
  }, [isTyping, timeoutId, sendTypingIndicator, delay]);

  const stopTyping = useCallback(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    
    if (isTyping) {
      setIsTyping(false);
      sendTypingIndicator(false);
    }
  }, [isTyping, timeoutId, sendTypingIndicator]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  return {
    isTyping,
    startTyping,
    stopTyping
  };
}