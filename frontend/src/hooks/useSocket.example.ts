/**
 * Example Socket.IO hook for React/Next.js
 * Manages WebSocket connection for real-time chat
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getSocketUrl } from '@/lib/config/notes-chat.config';

interface UseSocketOptions {
  room?: string;
  userId?: string;
  autoConnect?: boolean;
}

interface Message {
  id: string;
  content: string;
  userId: string;
  userName?: string;
  timestamp: Date;
  type: 'text' | 'image' | 'file';
  metadata?: Record<string, any>;
}

interface TypingUser {
  userId: string;
  userName: string;
}

export function useSocket(options: UseSocketOptions = {}) {
  const { room, userId, autoConnect = true } = options;
  
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize socket connection
  useEffect(() => {
    if (!autoConnect) return;

    const socket = io(getSocketUrl(), {
      transports: ['websocket', 'polling'],
      query: {
        userId,
        room,
      },
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      setIsConnected(true);
      setError(null);

      // Join room if specified
      if (room) {
        socket.emit('join_room', { room, userId });
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError('Failed to connect to chat server');
      setIsConnected(false);
    });

    // Message events
    socket.on('new_message', (data: any) => {
      const message: Message = {
        id: data.id || Date.now().toString(),
        content: data.message,
        userId: data.userId,
        userName: data.userName,
        timestamp: new Date(data.timestamp),
        type: data.type || 'text',
        metadata: data.metadata,
      };
      
      setMessages((prev) => [...prev, message]);
    });

    // Typing indicators
    socket.on('user_typing', (data: { userId: string; userName: string }) => {
      setTypingUsers((prev) => {
        const exists = prev.find((u) => u.userId === data.userId);
        if (exists) return prev;
        return [...prev, { userId: data.userId, userName: data.userName }];
      });
    });

    socket.on('user_stopped_typing', (data: { userId: string }) => {
      setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
    });

    // Room events
    socket.on('joined_room', (data: { room: string }) => {
      console.log('Joined room:', data.room);
    });

    socket.on('user_joined', (data: { userId: string; userName: string }) => {
      console.log('User joined:', data.userName);
      // You can add a system message here
    });

    socket.on('user_left', (data: { userId: string; userName: string }) => {
      console.log('User left:', data.userName);
      // You can add a system message here
    });

    // Cleanup
    return () => {
      if (room) {
        socket.emit('leave_room', { room, userId });
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, [autoConnect, room, userId]);

  // Send message
  const sendMessage = useCallback((content: string, type: 'text' | 'image' | 'file' = 'text') => {
    if (!socketRef.current || !isConnected) {
      setError('Not connected to chat server');
      return false;
    }

    const message = {
      room,
      message: content,
      userId,
      type,
      timestamp: new Date().toISOString(),
    };

    socketRef.current.emit('send_message', message);
    
    // Add to local messages immediately for optimistic update
    const localMessage: Message = {
      id: Date.now().toString(),
      content,
      userId: userId || 'me',
      timestamp: new Date(),
      type,
    };
    
    setMessages((prev) => [...prev, localMessage]);
    return true;
  }, [isConnected, room, userId]);

  // Typing indicators
  const startTyping = useCallback(() => {
    if (!socketRef.current || !isConnected || !room) return;

    socketRef.current.emit('typing', { room, userId });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [isConnected, room, userId]);

  const stopTyping = useCallback(() => {
    if (!socketRef.current || !isConnected || !room) return;

    socketRef.current.emit('stop_typing', { room, userId });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [isConnected, room, userId]);

  // Join a new room
  const joinRoom = useCallback((newRoom: string) => {
    if (!socketRef.current || !isConnected) return false;

    // Leave current room if exists
    if (room) {
      socketRef.current.emit('leave_room', { room, userId });
    }

    // Join new room
    socketRef.current.emit('join_room', { room: newRoom, userId });
    return true;
  }, [isConnected, room, userId]);

  // Leave room
  const leaveRoom = useCallback(() => {
    if (!socketRef.current || !isConnected || !room) return false;

    socketRef.current.emit('leave_room', { room, userId });
    return true;
  }, [isConnected, room, userId]);

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Reconnect
  const reconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.connect();
    }
  }, []);

  return {
    // State
    isConnected,
    messages,
    typingUsers,
    error,
    
    // Actions
    sendMessage,
    startTyping,
    stopTyping,
    joinRoom,
    leaveRoom,
    clearMessages,
    reconnect,
    
    // Socket instance (for advanced usage)
    socket: socketRef.current,
  };
}

// Example usage in a component:
/*
function ChatComponent() {
  const { 
    isConnected, 
    messages, 
    typingUsers, 
    sendMessage, 
    startTyping 
  } = useSocket({
    room: 'general',
    userId: 'user123',
  });

  const handleSend = (text: string) => {
    sendMessage(text);
  };

  return (
    <div>
      {isConnected ? 'Connected' : 'Disconnected'}
      {messages.map(msg => (
        <div key={msg.id}>{msg.content}</div>
      ))}
      {typingUsers.map(user => (
        <div key={user.userId}>{user.userName} is typing...</div>
      ))}
    </div>
  );
}
*/