'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Edit, MessageCircle, X, Maximize2, Minimize2, Sparkles, Bot, User as UserIcon, ArrowUp, Mic, PenSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { marked } from 'marked';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

// Configure marked
marked.setOptions({
  breaks: true,
  gfm: true
});

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface NoteChatSimpleProps {
  noteId: string;
  userId: string;
  note?: any;
  selectedContent?: { text: string; from: number; to: number } | null;
  onContentUpdate?: (content: any) => void;
  editor?: any;
  files?: any[];
  selectedModelId?: string;
  isVisible?: boolean;
  onClose?: () => void;
  className?: string;
  onMessageCountChange?: (count: number) => void;
}

const DEFAULT_DOCUMENT_EDITOR_PROMPT = `You are an expert document editor.

## Task
Based on the user's instruction, update and enhance the existing notes or selection by incorporating relevant and accurate information from the provided context. Ensure all edits strictly follow the user's intent.

## Input Structure
- Existing notes: Enclosed within <notes></notes> XML tags.
- Additional context: Enclosed within <context></context> XML tags (may include files, YouTube transcripts, etc.).
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
- Use clear, organized markdown elements: headings, lists, task lists, bold and italic text as appropriate.
- Focus on improving clarity, completeness, and usefulness of the notes.
- Return only the final, fully-edited markdown notes—do not include explanations, reasoning, or XML tags.`;

export function NoteChatSimple({
  noteId,
  userId,
  note,
  selectedContent,
  onContentUpdate,
  editor,
  files = [],
  selectedModelId = 'gpt-4o-mini',
  isVisible = true,
  onClose,
  className,
  onMessageCountChange
}: NoteChatSimpleProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [editEnabled, setEditEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load edit preference from localStorage
  useEffect(() => {
    const savedEditEnabled = localStorage.getItem('noteEditEnabled') === 'true';
    setEditEnabled(savedEditEnabled);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update message count
  useEffect(() => {
    if (onMessageCountChange) {
      onMessageCountChange(messages.length);
    }
  }, [messages.length, onMessageCountChange]);

  // Check if there's content to edit
  const hasEditableContent = React.useMemo(() => {
    const hasNoteContent = note?.data?.content?.md && note.data.content.md.trim().length > 0;
    const hasFiles = files && files.length > 0;
    const hasSelection = selectedContent && selectedContent.text && selectedContent.text.trim().length > 0;
    return hasNoteContent || hasFiles || hasSelection;
  }, [note, files, selectedContent]);

  // Build context for the AI
  const buildContext = () => {
    let context = '';
    
    // Add notes content
    if (note?.data?.content?.md) {
      context += `<notes>\n${note.data.content.md}\n</notes>\n\n`;
    }
    
    // Add files content
    if (files && files.length > 0) {
      const contextContent = files.map((file) => {
        const content = file?.file?.data?.content || file?.content;
        if (content) {
          return `${file.name}:\n${content}\n`;
        }
        return `${file.name}: [No content available]\n`;
      }).join('\n');
      
      if (contextContent) {
        context += `<context>\n${contextContent}\n</context>\n\n`;
      }
    }
    
    // Add selection if exists
    if (selectedContent?.text) {
      context += `<selection>\n${selectedContent.text}\n</selection>\n\n`;
    }
    
    return context;
  };

  const handleInputChange = () => {
    if (inputRef.current) {
      setMessage(inputRef.current.textContent || '');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isStreaming) return;

    // Check if edit mode is enabled and there's no content to edit
    if (editEnabled && !hasEditableContent) {
      toast.error('No content to edit. Please add some text to the note or attach files first.');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    if (inputRef.current) {
      inputRef.current.textContent = '';
    }
    setIsStreaming(true);

    // Create assistant message placeholder
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, assistantMessage]);

    try {
      abortControllerRef.current = new AbortController();
      
      // Build the system prompt with context
      const systemPrompt = editEnabled 
        ? `${DEFAULT_DOCUMENT_EDITOR_PROMPT}\n\n${buildContext()}`
        : `You are a helpful AI assistant with access to the current note content. Answer questions and provide insights about the note.\n\n${buildContext()}`;

      const response = await fetch('/api/notes/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: message }
          ],
          stream: true,
          model: selectedModelId
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No response body');

      let accumulatedContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;
          
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              // Finalize the message
              setMessages(prev => prev.map(msg => 
                msg.id === assistantMessage.id 
                  ? { ...msg, content: accumulatedContent }
                  : msg
              ));
              
              // If in edit mode, apply the content to the note
              if (editEnabled && accumulatedContent && onContentUpdate) {
                // Parse the markdown to HTML for the editor
                const htmlContent = marked.parse(accumulatedContent) as string;
                
                if (selectedContent && editor) {
                  // Replace only the selected content
                  editor.commands.insertContentAt(
                    {
                      from: selectedContent.from,
                      to: selectedContent.to
                    },
                    htmlContent
                  );
                } else if (editor) {
                  // Replace entire content
                  editor.commands.setContent(htmlContent);
                }
                
                // Also update the note data
                if (note) {
                  onContentUpdate({
                    md: accumulatedContent,
                    html: htmlContent,
                    json: editor?.getJSON() || null
                  });
                }
              }
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';
              
              if (content) {
                accumulatedContent += content;
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMessage.id 
                    ? { ...msg, content: accumulatedContent }
                    : msg
                ));
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim()) {
        console.log('Remaining buffer:', buffer);
      }

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Chat error:', error);
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessage.id 
            ? { ...msg, content: `Error: ${error.message}. Please try again.` }
            : msg
        ));
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className={cn('w-full pl-1.5 pr-2.5 pt-2 bg-card/50 backdrop-blur-sm border-l border-border/50 z-40 pointer-events-auto overflow-y-auto scrollbar-hidden flex flex-col', className)}>
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
              >
                <div className="h-full w-full flex flex-col">
                  <div className="flex-1 p-1">
                    {messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center text-gray-500">
                          <Send className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                          <p className="text-base font-medium mb-1">No messages yet</p>
                          <p className="text-sm">Start the conversation!</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 pb-12">
                        {messages.map((msg) => {
                          const isOwn = msg.role === 'user';
                          
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
                                {isStreaming && msg.role === 'assistant' && msg.content === '' && (
                                  <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
                                )}
                              </div>
                              {isOwn && (
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="text-xs">ME</AvatarFallback>
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
                                        disabled={!hasEditableContent && !editEnabled || isStreaming}
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
                            </div>
                          </div>
                          <div className="self-end flex space-x-1 mr-1">
                            {isStreaming && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={handleStopStreaming}
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
                                disabled={!message.trim() || isStreaming}
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