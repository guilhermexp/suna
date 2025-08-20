'use client';

import React, { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Send,
  X,
  Mic,
  PenSquare,
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
import { chatCompletion } from '@/lib/apis/openai';
import { splitStream } from '@/lib/utils/stream';
import { marked } from 'marked';
import './NoteChat.css';

// Configure marked with simpler settings
marked.setOptions({
  breaks: true,
  gfm: true,
  headerIds: false,
  mangle: false
});

interface NoteChatProps {
  noteId: string;
  userId: string;
  className?: string;
  onMessageCountChange?: (count: number) => void;
  isVisible?: boolean;
  onClose?: () => void;
  note?: any;
  selectedContent?: { text: string; from: number; to: number } | null;
  onContentUpdate?: (content: any) => void;
  files?: any[];
  editor?: any;
  messages?: any[];
  selectedModelId?: string;
  editing?: boolean;
  streaming?: boolean;
  stopResponseFlag?: boolean;
  onEdited?: () => void;
  onStop?: () => void;
}

interface MessageWithUser extends NoteMessage {
  user: {
    id: string;
    name: string;
    avatar?: string;
    email: string;
  };
}

const DEFAULT_DOCUMENT_EDITOR_PROMPT = `You are an expert document editor.

## Task
Based on the user's instruction, update and enhance the existing notes or selection by incorporating relevant and accurate information from the provided context in the content's primary language. Ensure all edits strictly follow the user's intent.

## Input Structure
- Existing notes: Enclosed within <notes></notes> XML tags.
- Additional context: Enclosed within <context></context> XML tags (may include YouTube transcripts, documents, or other files).
- Current note selection: Enclosed within <selection></selection> XML tags.
- Editing instruction: Provided in the user message.

## Important
- If the notes are empty or contain minimal content, create new content based on the user's instruction and any available context.
- If no context is provided and notes are empty, politely explain that you need some initial content or context to work with.

## Output Instructions
- If a selection is provided, edit **only** the content within <selection></selection>. Leave unselected parts unchanged.
- If no selection is provided, edit the entire notes.
- Deliver a single, rewritten version of the notes in markdown format.
- Integrate information from the context only if it directly supports the user's instruction.
- Use clear, organized markdown elements: headings, lists, task lists ([ ]) where tasks or checklists are strongly implied, bold and italic text as appropriate.
- Focus on improving clarity, completeness, and usefulness of the notes.
- Return only the final, fully-edited markdown notes—do not include explanations, reasoning, or XML tags.
`;

// Available models list
const MODELS = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'gpt-4', label: 'GPT-4' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  { value: 'gpt-4o', label: 'GPT-4o' },
];

export const NoteChat = forwardRef<any, NoteChatProps>(({ 
  noteId, 
  userId, 
  className, 
  onMessageCountChange,
  isVisible = true,
  onClose,
  note,
  selectedContent,
  onContentUpdate,
  files = [],
  editor,
  messages: propMessages = [],
  selectedModelId: propSelectedModelId,
  editing: propEditing = false,
  streaming: propStreaming = false,
  stopResponseFlag: propStopResponseFlag = false,
  onEdited,
  onStop
}, ref) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedModel, setSelectedModel] = useState(propSelectedModelId || 'gpt-4o-mini');
  const [editEnabled, setEditEnabled] = useState(false);
  const [audioFiles, setAudioFiles] = useState<any[]>([]);
  const [messages, setMessages] = useState(propMessages);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(propEditing);
  const [streaming, setStreaming] = useState(propStreaming);
  const [stopResponseFlag, setStopResponseFlag] = useState(propStopResponseFlag);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const supabase = useSupabase();
  
  // Fetch messages
  const { data: dbMessages = [], isLoading } = useNoteMessages(noteId);
  
  // Setup realtime subscriptions
  useNoteMessagesRealtime(noteId, true);
  
  // Chat functionality
  const { isConnected } = useNoteChat(noteId, userId);
  
  // Check if there's content to edit
  const hasEditableContent = React.useMemo(() => {
    const hasNoteContent = note?.data?.content?.md && note.data.content.md.trim().length > 0;
    const hasFiles = files && files.length > 0;
    const hasSelection = selectedContent && selectedContent.text && selectedContent.text.trim().length > 0;
    return hasNoteContent || hasFiles || hasSelection;
  }, [note, files, selectedContent]);

  // Mock user data for messages - in real app this would come from the message
  const messagesWithUsers: MessageWithUser[] = dbMessages.map(msg => ({
    ...msg,
    user: {
      id: msg.user_id,
      name: msg.user_id === userId ? 'You' : 'Assistant',
      email: '',
      avatar: undefined
    }
  }));

  // Load edit preference from localStorage
  useEffect(() => {
    const savedEditEnabled = localStorage.getItem('noteEditEnabled') === 'true';
    setEditEnabled(savedEditEnabled);
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messagesWithUsers, messages]);

  // Update message count
  useEffect(() => {
    if (onMessageCountChange) {
      onMessageCountChange(messagesWithUsers.length);
    }
  }, [messagesWithUsers.length, onMessageCountChange]);

  const chatCompletionHandler = async () => {
    if (!selectedModel) {
      toast.error('Please select a model.');
      return;
    }

    // Check if edit mode is enabled and there's no content to edit
    if (editEnabled) {
      if (!hasEditableContent) {
        toast.error('No content to edit. Please add some text to the note or attach files first.');
        return;
      }
    }

    let responseMessage: any;
    if (messages.at(-1)?.role === 'assistant') {
      responseMessage = messages.at(-1);
    } else {
      responseMessage = {
        role: 'assistant',
        content: '',
        done: false
      };
      setMessages(prev => [...prev, responseMessage]);
    }

    setStopResponseFlag(false);
    let enhancedContent = {
      json: null,
      html: '',
      md: ''
    };

    let system = '';

    if (editEnabled) {
      system = `${DEFAULT_DOCUMENT_EDITOR_PROMPT}\n\n`;
    } else {
      system = `You are a helpful assistant. Please answer the user's questions based on the context provided.\n\n`;
    }

    // Build the context with files content
    let contextContent = '';
    if (files && files.length > 0) {
      contextContent = files.map((file) => {
        const content = file?.file?.data?.content || file?.content;
        if (content) {
          return `${file.name}:\n${content}\n`;
        } else {
          return `${file.name}: [No content available]\n`;
        }
      }).join('\n');
    }
    
    system +=
      `<notes>${note?.data?.content?.md ?? ''}</notes>` +
      (contextContent ? `\n<context>\n${contextContent}</context>` : '') +
      (selectedContent ? `\n<selection>${selectedContent?.text}</selection>` : '');

    const chatMessages = [
      {
        role: 'system',
        content: system
      },
      ...messages
    ];

    // Use localStorage token or empty string
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    
    const [res, controller] = await chatCompletion(
      token,
      {
        model: selectedModel,
        stream: true,
        messages: chatMessages
      }
    );

    let messageContent = '';

    if (res && res.ok) {
      const reader = res.body!
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(splitStream('\n'))
        .getReader();

      while (true) {
        const { value, done } = await reader.read();
        if (done || stopResponseFlag) {
          if (stopResponseFlag) {
            controller.abort('User: Stop Response');
          }

          if (editEnabled) {
            setEditing(false);
            setStreaming(false);
            onEdited?.();
          }

          break;
        }

        try {
          let lines = value.split('\n');

          for (const line of lines) {
            if (line !== '') {
              if (line === 'data: [DONE]') {
                if (editEnabled) {
                  responseMessage.content = `<status title="Edited" done="true" />`;

                  if (selectedContent && selectedContent?.text && editor) {
                    editor.commands.insertContentAt(
                      {
                        from: selectedContent.from,
                        to: selectedContent.to
                      },
                      enhancedContent.html || enhancedContent.md || ''
                    );
                  }
                }

                responseMessage.done = true;
                setMessages([...messages]);
              } else if (line.startsWith('data: ')) {
                let data = JSON.parse(line.replace(/^data: /, ''));
                let deltaContent = data.choices[0]?.delta?.content ?? '';
                
                if (responseMessage.content == '' && deltaContent == '\n') {
                  continue;
                } else {
                  if (editEnabled) {
                    setEditing(true);
                    setStreaming(true);

                    enhancedContent.md += deltaContent;
                    enhancedContent.html = marked.parse(enhancedContent.md);

                    if (!selectedContent || !selectedContent?.text) {
                      if (note && onContentUpdate) {
                        note.data.content.md = enhancedContent.md;
                        note.data.content.html = enhancedContent.html;
                        note.data.content.json = null;
                        onContentUpdate(note.data.content);
                      }
                    }

                    responseMessage.content = `<status title="Editing" done="false" />`;
                    setMessages([...messages]);
                  } else {
                    messageContent += deltaContent;
                    responseMessage.content = messageContent;
                    setMessages([...messages]);
                  }
                }
              }
            }
          }
        } catch (error) {
          console.log(error);
        }
      }
    }
  };

  const handleSendMessage = async (customContent?: string) => {
    const contentToSend = customContent || message.trim();
    if (!contentToSend) return;
    if (isSending) return;

    setIsSending(true);
    
    try {
      if (editEnabled && hasEditableContent) {
        // Add user message to chat messages
        setMessages(prev => [...prev, { role: 'user', content: contentToSend }]);
        
        // Clear input
        setMessage('');
        if (inputRef.current) {
          inputRef.current.textContent = '';
        }
        
        // Process with AI
        setLoading(true);
        await chatCompletionHandler();
        setLoading(false);
      } else {
        // Normal message sending to database
        const result = await sendNoteMessage(
          supabase, 
          noteId, 
          contentToSend,
          'text'
        );

        if (result) {
          setMessage('');
          setAudioFiles([]);
          if (inputRef.current) {
            inputRef.current.textContent = '';
          }
        } else {
          toast.error('Failed to send message');
        }
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
  
  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    addAudioFile: (file: any) => {
      setAudioFiles(prev => [...prev, file]);
      handleSendMessage(`Audio recording: ${file.name}`);
    },
    addMessage: (text: string) => {
      setMessage(text);
      handleSendMessage(text);
    }
  }));

  const handleInputChange = () => {
    if (inputRef.current) {
      setMessage(inputRef.current.textContent || '');
    }
  };

  const stopResponseHandler = () => {
    setStopResponseFlag(true);
    onStop?.();
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
              <div 
                className="pb-2.5 flex flex-col justify-between w-full flex-auto overflow-auto h-0 scrollbar-hidden"
                ref={messagesContainerRef}
              >
                <div className="h-full w-full flex flex-col">
                  <div className="flex-1 p-1">
                    {isLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center text-muted-foreground">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
                          <p className="text-sm">Loading messages...</p>
                        </div>
                      </div>
                    ) : messagesWithUsers.length === 0 && messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center text-gray-500">
                          <Send className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                          <p className="text-base font-medium mb-1">No messages yet</p>
                          <p className="text-sm">Start the conversation!</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 pb-12">
                        {/* Chat messages from AI interaction */}
                        {messages.map((msg, idx) => {
                          const isOwn = msg.role === 'user';
                          
                          // Skip status messages in the UI
                          if (msg.content?.includes('<status')) {
                            return null;
                          }
                          
                          return (
                            <div
                              key={idx}
                              className={cn(
                                'flex gap-3',
                                isOwn ? 'justify-end' : 'justify-start'
                              )}
                            >
                              {!isOwn && (
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="text-xs">AI</AvatarFallback>
                                </Avatar>
                              )}
                              <div className={cn(
                                'max-w-[70%] rounded-2xl px-4 py-2',
                                isOwn 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'bg-gray-100 dark:bg-gray-700'
                              )}>
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                              </div>
                              {isOwn && (
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="text-xs">ME</AvatarFallback>
                                </Avatar>
                              )}
                            </div>
                          );
                        })}
                        
                        {/* Database messages */}
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

              {/* Selection display */}
              {selectedContent && (
                <div className="text-xs rounded-xl px-3.5 py-3 w-full">
                  <blockquote className="border-l-4 border-gray-300 pl-4 italic">
                    <div className="line-clamp-3">
                      {selectedContent.text}
                    </div>
                  </blockquote>
                </div>
              )}

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
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between mb-2.5 mt-1.5 mx-0.5">
                          <div className="ml-1 self-end flex space-x-1 flex-1">
                            <div className="flex items-center justify-between gap-2 w-full pr-1">
                              <div>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                          "px-2 py-2 flex gap-1.5 items-center text-sm rounded-full transition-colors",
                                          editEnabled 
                                            ? "text-sky-500 bg-sky-50 dark:text-sky-300 dark:bg-sky-900/20 hover:bg-sky-100 dark:hover:bg-sky-900/30"
                                            : !hasEditableContent
                                            ? "text-gray-400 opacity-50 cursor-not-allowed"
                                            : "hover:bg-gray-50 dark:hover:bg-gray-800"
                                        )}
                                        onClick={() => {
                                          if (!hasEditableContent) {
                                            toast.error('No content to edit. Please add some text to the note or attach files first.');
                                            return;
                                          }
                                          setEditEnabled(!editEnabled);
                                          localStorage.setItem('noteEditEnabled', (!editEnabled).toString());
                                        }}
                                        disabled={!hasEditableContent && !editEnabled || streaming || loading}
                                      >
                                        <PenSquare className="size-4" />
                                        <span className="block whitespace-nowrap overflow-hidden text-ellipsis">
                                          {editEnabled ? 'Editing' : 'Edit'}
                                        </span>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {!hasEditableContent && !editEnabled 
                                        ? 'Add content to the note before editing' 
                                        : 'Edit'}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
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
                            {streaming && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={stopResponseHandler}
                                className="text-gray-600 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200 rounded-full p-1.5 mr-0.5"
                              >
                                <X className="w-5 h-5" />
                              </Button>
                            )}
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
                                disabled={!message.trim() || isSending || loading}
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
});

NoteChat.displayName = 'NoteChat';