'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Send,
  X,
  Mic,
  PenSquare,
  Sparkles,
  ArrowUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useNoteMessages } from '@/hooks/react-query/notes/use-notes-queries';
import { useNoteMessagesRealtime } from '@/hooks/react-query/notes/use-notes-realtime';
import { useNoteChat } from '@/hooks/react-query/notes/use-note-chat';
import { useSupabase } from '@/hooks/useSupabase';
import { sendNoteMessage } from '@/lib/supabase/notes-config';
import type { NoteMessage } from '@/lib/supabase/notes-config';
import { toast } from 'sonner';
import './NoteChat.css';

interface NoteChatProps {
  noteId: string;
  userId: string;
  className?: string;
  onMessageCountChange?: (count: number) => void;
  isVisible?: boolean;
  onClose?: () => void;
}

interface MessageWithUser extends NoteMessage {
  user: {
    id: string;
    name: string;
    avatar?: string;
    email: string;
  };
}

// Available models list
const MODELS = [
  { value: 'mcp_pipe.MCP Pipe', label: 'MCP Pipe' },
  { value: 'gpt-4', label: 'GPT-4' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
];

export function NoteChat({ 
  noteId, 
  userId, 
  className, 
  onMessageCountChange,
  isVisible = true,
  onClose
}: NoteChatProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [isEditing, setIsEditing] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const supabase = useSupabase();
  
  // Fetch messages
  const { data: messages = [], isLoading } = useNoteMessages(noteId);
  
  // Setup realtime subscriptions
  useNoteMessagesRealtime(noteId, true);
  
  // Chat functionality
  const { isConnected } = useNoteChat(noteId, userId);

  // Mock user data for messages - in real app this would come from the message
  const messagesWithUsers: MessageWithUser[] = messages.map(msg => ({
    ...msg,
    user: {
      id: msg.user_id,
      name: msg.user_id === userId ? 'You' : 'Assistant',
      email: '',
      avatar: undefined
    }
  }));

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messagesWithUsers]);

  // Update message count
  useEffect(() => {
    if (onMessageCountChange) {
      onMessageCountChange(messagesWithUsers.length);
    }
  }, [messagesWithUsers.length, onMessageCountChange]);

  const handleSendMessage = async () => {
    if (!message.trim() || isSending) return;

    setIsSending(true);
    try {
      const result = await sendNoteMessage(supabase, noteId, message.trim(), 'text');

      if (result) {
        setMessage('');
        if (inputRef.current) {
          inputRef.current.textContent = '';
        }
      } else {
        toast.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = () => {
    if (inputRef.current) {
      setMessage(inputRef.current.textContent || '');
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={cn('w-full pl-1.5 pr-2.5 pt-2 bg-white dark:shadow-lg dark:bg-gray-850 z-40 pointer-events-auto overflow-y-auto scrollbar-hidden flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center mb-1.5 pt-1.5">
        <div className="-translate-x-1.5 flex items-center">
          {onClose && (
            <button 
              onClick={onClose}
              className="p-0.5 bg-transparent transition rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="size-5" />
            </button>
          )}
        </div>
        <div className="font-medium text-base flex items-center gap-1">
          <div>Chat</div>
          <div>
            <div className="inline-block">
              <span className="text-gray-500 text-sm">(Experimental)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex flex-col items-center mb-2 flex-1">
        <div className="flex flex-col justify-between w-full overflow-y-auto h-full">
          <div className="mx-auto w-full md:px-0 h-full relative">
            <div className="flex flex-col h-full">
              <div className="pb-2.5 flex flex-col justify-between w-full flex-auto overflow-auto h-0 scrollbar-hidden">
                <div className="h-full w-full flex flex-col">
                  <div className="flex-1 p-1">
                    {isLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center text-muted-foreground">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
                          <p className="text-sm">Loading messages...</p>
                        </div>
                      </div>
                    ) : messagesWithUsers.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center text-gray-500">
                          <Send className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                          <p className="text-base font-medium mb-1">No messages yet</p>
                          <p className="text-sm">Start the conversation!</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 pb-12">
                        {messagesWithUsers.map((msg) => {
                          const isOwn = msg.user_id === userId;
                          return (
                            <div
                              key={msg.id}
                              className={cn(
                                'flex gap-3',
                                isOwn ? 'justify-end' : 'justify-start'
                              )}
                            >
                              {!isOwn && (
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={msg.user.avatar} />
                                  <AvatarFallback className="text-xs">
                                    {msg.user.name.slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <div className={cn(
                                'max-w-[70%] rounded-2xl px-4 py-2',
                                isOwn 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'bg-gray-100 dark:bg-gray-700'
                              )}>
                                <p className="text-sm">{msg.content}</p>
                                <span className="text-xs opacity-70 mt-1 block">
                                  {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                                </span>
                              </div>
                              {isOwn && (
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={msg.user.avatar} />
                                  <AvatarFallback className="text-xs">
                                    {msg.user.name.slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Input Area */}
              <div className="pb-2">
                <div className="bg-transparent">
                  <div className="max-w-6xl mx-auto inset-x-0 relative">
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendMessage();
                      }}
                      className="w-full flex gap-1.5"
                    >
                      <div className="flex-1 flex flex-col relative w-full rounded-3xl px-1 bg-gray-600/5 dark:bg-gray-400/5 dark:text-gray-100">
                        <div className="px-2.5">
                          <div className="scrollbar-hidden font-primary text-left bg-transparent dark:text-gray-100 outline-hidden w-full pt-3 px-1 resize-none h-fit max-h-80 overflow-auto">
                            <div className="relative w-full">
                              <div className="relative w-full min-w-full h-full min-h-fit">
                                <div
                                  ref={inputRef}
                                  contentEditable
                                  className="tiptap ProseMirror outline-none"
                                  onInput={handleInputChange}
                                  onKeyPress={handleKeyPress}
                                  data-placeholder="Type here..."
                                  style={{ minHeight: '24px' }}
                                >
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between mb-2.5 mt-1.5 mx-0.5">
                          <div className="ml-1 self-end flex space-x-1 flex-1">
                            <div className="flex items-center justify-between gap-2 w-full pr-1">
                              <div>
                                <div className="flex">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="px-2 py-2 flex gap-1.5 items-center text-sm rounded-full hover:bg-gray-50 dark:hover:bg-gray-800"
                                    onClick={() => setIsEditing(!isEditing)}
                                  >
                                    <PenSquare className="size-4" />
                                    <span className="block whitespace-nowrap overflow-hidden text-ellipsis">
                                      {isEditing ? 'Editing' : 'Edit'}
                                    </span>
                                  </Button>
                                </div>
                              </div>
                              <div className="flex">
                                <select 
                                  value={selectedModel}
                                  onChange={(e) => setSelectedModel(e.target.value)}
                                  className="bg-transparent rounded-lg py-1 px-2 -mx-0.5 text-sm outline-none w-full text-right pr-5 dark:text-gray-300"
                                >
                                  {MODELS.map(model => (
                                    <option 
                                      key={model.value} 
                                      value={model.value}
                                      className="bg-gray-50 dark:bg-gray-700"
                                    >
                                      {model.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                          <div className="self-end flex space-x-1 mr-1">
                            <div className="flex">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-gray-600 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200 rounded-full p-1.5 mr-0.5"
                              >
                                <Mic className="w-5 h-5" />
                              </Button>
                            </div>
                            <div className="flex items-center">
                              <Button
                                type="submit"
                                size="icon"
                                disabled={!message.trim() || isSending}
                                className={cn(
                                  "rounded-full p-1.5 transition",
                                  message.trim() 
                                    ? "text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 hover:opacity-90" 
                                    : "text-white bg-gray-200 dark:text-gray-900 dark:bg-gray-700"
                                )}
                              >
                                <ArrowUp className="size-5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}