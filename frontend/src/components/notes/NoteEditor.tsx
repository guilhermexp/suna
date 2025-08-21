'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  Star,
  Archive,
  MoreHorizontal,
  Undo,
  Redo,
  Save,
  Download,
  Share,
  Trash2,
  Calendar,
  Clock,
  FileText,
  User,
  MessageCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Mic,
  Sparkles,
  Settings,
  MessageSquare
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { useSingleNote, type Note } from '@/hooks/useNotes';
import { toast } from 'sonner';
import { type FileAttachment, getNoteAttachments } from '@/lib/supabase/storage';
import { runAgentTool } from '@/lib/api/agent_tools';
import { chatCompletion } from '@/lib/apis/openai';
import { splitStream } from '@/lib/utils/stream';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';

// Configure marked for markdown parsing
marked.setOptions({
  breaks: true,
  gfm: true
});

// TipTap editor imports
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Typography from '@tiptap/extension-typography';
import Image from '@tiptap/extension-image';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { createLowlight } from 'lowlight';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import json from 'highlight.js/lib/languages/json';
import css from 'highlight.js/lib/languages/css';
import xml from 'highlight.js/lib/languages/xml';
import markdown from 'highlight.js/lib/languages/markdown';
import bash from 'highlight.js/lib/languages/bash';
import sql from 'highlight.js/lib/languages/sql';
import { TiptapCollaboration } from './TiptapCollaboration';

// Create lowlight instance with common languages
const lowlight = createLowlight();
lowlight.register('javascript', javascript);
lowlight.register('js', javascript);
lowlight.register('typescript', typescript);
lowlight.register('ts', typescript);
lowlight.register('python', python);
lowlight.register('py', python);
lowlight.register('json', json);
lowlight.register('css', css);
lowlight.register('html', xml);
lowlight.register('xml', xml);
lowlight.register('markdown', markdown);
lowlight.register('md', markdown);
lowlight.register('bash', bash);
lowlight.register('sh', bash);
lowlight.register('sql', sql);

// Toolbar component
import { EditorToolbar } from './EditorToolbar';

// YouTube components
import { YouTubePreviewHandler, YouTubePreviewHandlerRef } from './YouTubePreviewHandler';
import { YouTubeTranscriptExtractor } from './YouTubeTranscriptExtractor';

// Chat component
import { NoteChatSimple } from './NoteChatSimple';
// Controls component
import { NoteControls } from './NoteControls';

// Attachments component
import { NoteAttachments } from './NoteAttachments';

// Menu components
import { RecordMenu } from './RecordMenu';
import { AIMenu } from './AIMenu';
import { VoiceRecording } from './VoiceRecording';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface NoteEditorProps {
  noteId: string;
  userId: string;
  onBack?: () => void;
  onSave?: (note: Note) => void;
  onDelete?: (noteId: string) => void;
  className?: string;
  enableRealtime?: boolean;
  enableChat?: boolean;
  defaultChatVisible?: boolean;
}

export function NoteEditor({
  noteId,
  userId,
  onBack,
  onSave,
  onDelete,
  className,
  enableRealtime = true,
  enableChat = true,
  defaultChatVisible = false
}: NoteEditorProps) {
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isChatVisible, setIsChatVisible] = useState(defaultChatVisible);
  const [messageCount, setMessageCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const chatRef = useRef<any>(null);
  const youtubePreviewRef = useRef<YouTubePreviewHandlerRef>(null);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Panel state management
  const [showPanel, setShowPanel] = useState(false);
  const [selectedPanel, setSelectedPanel] = useState<'chat' | 'controls'>('chat');
  const [controlFiles, setControlFiles] = useState<{
    id: string;
    name: string;
    size: number;
    type: string;
    file?: File;
    status: 'uploading' | 'ready';
    content?: string;
    metadata?: any;
  }[]>([]);
  const [selectedModelId, setSelectedModelId] = useState('gpt-4o');
  const [selectedContent, setSelectedContent] = useState<{ text: string; from: number; to: number } | null>(null);

  const {
    note,
    isLoading,
    isError,
    error,
    updateNote,
    deleteNote,
    toggleStar,
    toggleArchive,
    isUpdating,
    isDeleting,
    isTogglingStatus
  } = useSingleNote(noteId, enableRealtime);


  // TipTap editor configuration
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false, // We use CodeBlockLowlight instead
        // Disable extensions that we're adding separately with custom config
        link: false,
        underline: false,
      }),
      Placeholder.configure({
        placeholder: 'Start writing your note...',
      }),
      CharacterCount.configure({
        limit: 50000, // 50k character limit
      }),
      Typography,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg object-contain',
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'overflow-x-auto max-w-full block',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'rounded-md bg-muted p-4 font-mono text-sm overflow-x-auto max-w-full',
        },
      }),
      // Add collaboration if needed
      ...(enableRealtime ? [TiptapCollaboration.configure({
        noteId,
        userId,
      })] : []),
    ],
    content: note?.content || '',  // Start with empty string instead of doc object
    onUpdate: ({ editor }) => {
      // Debounced auto-save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        handleAutoSave(editor);
      }, 5000); // 5 seconds - more natural, gives time to think and type
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to, ' ');
      
      if (text && text.trim()) {
        setSelectedContent({ text, from, to });
      } else {
        setSelectedContent(null);
      }
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[400px] p-4',
      },
    },
  });

  // Update editor content when note changes
  useEffect(() => {
    if (note && editor && !editor.isDestroyed) {
      const currentContent = editor.getJSON();
      const noteContent = note.content;
      
      // Only update if content actually changed to avoid cursor jumping
      if (JSON.stringify(currentContent) !== JSON.stringify(noteContent)) {
        // Handle empty content case
        const contentToSet = noteContent || '';
        editor.commands.setContent(contentToSet);
      }
      
      setTitle(note.title || '');
    }
  }, [note, editor]);

  // Load attachments when note changes
  useEffect(() => {
    if (note?.id) {
      loadAttachments();
    }
  }, [note?.id]);

  const loadAttachments = async () => {
    if (!note?.id) return;

    try {
      const { data, error } = await getNoteAttachments(note.id);
      if (error) {
        console.error('Failed to load attachments:', error);
        return;
      }
      setAttachments(data || []);
    } catch (error) {
      console.error('Failed to load attachments:', error);
    }
  };

  // Auto-save function
  const handleAutoSave = useCallback(async (editorInstance: Editor) => {
    if (!note || !editorInstance) return;

    try {
      // setIsSaving(true); // Removed - was causing too many UI updates
      
      const content = editorInstance.getJSON();
      const html = editorInstance.getHTML();
      const text = editorInstance.getText();
      const wordCount = editorInstance.storage.characterCount.words();
      const readingTime = Math.ceil(wordCount / 200); // Assuming 200 WPM reading speed

      await updateNote({
        title: title || '', // Let it be empty if user hasn't typed
        content,
        content_text: text,
        word_count: wordCount,
        reading_time: readingTime,
      });

      setLastSaved(new Date());
      
      if (onSave && note) {
        onSave({
          ...note,
          title: title || '', // Let it be empty if user hasn't typed
          content,
          content_text: text,
          word_count: wordCount,
          reading_time: readingTime,
        });
      }
    } catch (error) {
      toast.error('Failed to save note');
    } finally {
      // setIsSaving(false); // Removed - was causing too many UI updates
    }
  }, [note, title, updateNote, onSave]);

  // Manual save
  const handleManualSave = useCallback(() => {
    if (editor && !editor.isDestroyed) {
      handleAutoSave(editor);
    }
  }, [editor, handleAutoSave]);

  // Save on title change - but only when user actually types
  useEffect(() => {
    // Skip if title is empty or "Untitled" (default values)
    if (!title || title === 'Untitled') return;
    
    // Skip if this is the initial load (title is being set from the note)
    if (note && title === note.title) return;
    
    // Only save if user has typed something meaningful
    if (note && title.length > 0 && title !== note.title) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        if (editor) {
          handleAutoSave(editor);
        }
      }, 2000); // Give user more time to type
    }
  }, [title, note, editor, handleAutoSave]);

  const handleToggleStar = async () => {
    if (!note) return;
    
    try {
      await toggleStar(!note.is_starred);
    } catch (error) {
      toast.error('Failed to update note');
    }
  };

  const handleToggleArchive = async () => {
    if (!note) return;
    
    try {
      await toggleArchive(!note.is_archived);
    } catch (error) {
      toast.error('Failed to update note');
    }
  };

  const handleDelete = async () => {
    if (!note) return;
    
    if (window.confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      try {
        await deleteNote();
        toast.success('Note deleted successfully');
        
        if (onDelete) {
          onDelete(noteId);
        }
        
        if (onBack) {
          onBack();
        }
      } catch (error) {
        toast.error('Failed to delete note');
      }
    }
  };

  const handleExport = (format: 'md' | 'html' | 'txt') => {
    if (!editor || !note) return;

    let content = '';
    let mimeType = '';
    let extension = '';

    switch (format) {
      case 'md':
        content = (editor.storage as any).markdown?.getMarkdown() || editor.getText();
        mimeType = 'text/markdown';
        extension = 'md';
        break;
      case 'html':
        content = editor.getHTML();
        mimeType = 'text/html';
        extension = 'html';
        break;
      case 'txt':
        content = editor.getText();
        mimeType = 'text/plain';
        extension = 'txt';
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${note.title || 'note'}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Panel handlers
  const handleToggleChat = () => {
    if (selectedPanel === 'chat') {
      setShowPanel(!showPanel);
      setIsChatVisible(!showPanel);
      if (!showPanel) {
        setUnreadMessages(0); // Clear unread count when opening chat
      }
    } else {
      setSelectedPanel('chat');
      setShowPanel(true);
      setIsChatVisible(true);
      setUnreadMessages(0);
    }
  };
  
  const handleToggleControls = () => {
    if (selectedPanel === 'controls') {
      setShowPanel(!showPanel);
    } else {
      setSelectedPanel('controls');
      setShowPanel(true);
      setIsChatVisible(false);
    }
  };
  
  const handleClosePanel = () => {
    setShowPanel(false);
    setIsChatVisible(false);
  };
  
  const handleControlFilesUpdate = (files: any[]) => {
    setControlFiles(files);
  };

  const handleMessageCountChange = (count: number) => {
    setMessageCount(count);
  };

  const handleFileUploaded = (attachment: FileAttachment) => {
    setAttachments(prev => [attachment, ...prev]);
    toast.success('File uploaded successfully');
  };

  const handleAttachmentDeleted = (attachmentId: string) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId));
  };

  // Audio handlers
  const [isRecording, setIsRecording] = useState(false);
  const [showVoiceRecording, setShowVoiceRecording] = useState(false);
  const [isCapturingSystemAudio, setIsCapturingSystemAudio] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleRecord = async () => {
    setShowVoiceRecording(true);
    setIsRecording(true);
    setIsCapturingSystemAudio(false);
  };

  const handleVoiceRecordingCancel = () => {
    setShowVoiceRecording(false);
    setIsRecording(false);
    setIsCapturingSystemAudio(false);
  };

  const handleVoiceRecordingConfirm = async (data: any) => {
    console.log('handleVoiceRecordingConfirm called with data:', data);
    setShowVoiceRecording(false);
    setIsRecording(false);
    setIsCapturingSystemAudio(false);
    
    if (data && data.file) {
      console.log('Audio file received:', data.file);
      // Send audio file to Controls section
      const audioFileInfo = {
        id: `audio-${Date.now()}`,
        name: data.file.name,
        size: data.file.size,
        type: 'audio',
        file: data.file,
        status: 'ready' as const
      };
      
      console.log('Adding audio to control files:', audioFileInfo);
      // Add to control files
      setControlFiles(prev => {
        const newFiles = [...prev, audioFileInfo];
        console.log('Updated control files:', newFiles);
        return newFiles;
      });
      
      // Open Controls panel
      setSelectedPanel('controls');
      setShowPanel(true);
      setIsChatVisible(false);
      
      toast.success('Audio recording added to Controls!');
    } else if (data && data.text) {
      console.log('Transcription text received:', data.text);
      // Direct transcription result - add to editor
      if (editor) {
        editor.chain().focus().insertContent(data.text).run();
        toast.success('Transcription added to editor!');
      }
    } else {
      console.log('No file or text in data:', data);
    }
  };

  const handleCaptureAudio = async () => {
    // System audio capture (display media)
    setShowVoiceRecording(true);
    setIsRecording(true);
    setIsCapturingSystemAudio(true);
  };

  const handleUploadAudio = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        console.log('Selected audio file for upload:', file);
        
        // Add audio file to Controls
        const audioFileInfo = {
          id: `audio-${Date.now()}`,
          name: file.name,
          size: file.size,
          type: 'audio',
          file: file,
          status: 'ready' as const
        };
        
        // Add to control files
        setControlFiles(prev => [...prev, audioFileInfo]);
        
        // Open Controls panel
        setSelectedPanel('controls');
        setShowPanel(true);
        setIsChatVisible(false);
        
        toast.success('Audio file added to Controls!');
      }
    };
    input.click();
  };

  // State for enhancement
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [stopResponseFlag, setStopResponseFlag] = useState(false);
  const [enhancementStatus, setEnhancementStatus] = useState<string>('Enhancing your note...');

  // AI handlers - Enhanced completion handler from OpenNotes
  const enhanceCompletionHandler = async (model: string = 'gpt-4o-mini') => {
    if (!editor || !note) {
      toast.error('Editor not ready');
      return;
    }

    setIsEnhancing(true);
    setStopResponseFlag(false);
    
    let enhancedContent = {
      json: null as any,
      html: '',
      md: ''
    };

    // Get current note content FIRST to check for YouTube links
    const noteContent = editor?.getHTML() || '';
    const noteText = editor?.getText() || '';
    const noteMarkdown = noteText; // Use text content directly
    
    console.log('Editor content for YouTube detection:', {
      noteText: noteText,
      noteMarkdown: noteMarkdown,
      noteHTML: noteContent.substring(0, 500)
    });
    
    // Extract YouTube URLs from the note content - check both text and HTML
    const youtubeUrlPattern = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/g;
    
    // Try to find URLs in different formats
    const urlsFromText = noteText.match(youtubeUrlPattern) || [];
    const urlsFromMarkdown = noteMarkdown.match(youtubeUrlPattern) || [];
    const urlsFromHTML = noteContent.match(/(?:href=["']|>)(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]{11})/g) || [];
    
    // Combine and deduplicate
    const allUrls = [...urlsFromText, ...urlsFromMarkdown, ...urlsFromHTML.map(u => u.replace(/^(href=["']|>)/, ''))];
    const youtubeUrls = [...new Set(allUrls)];
    
    console.log('YouTube URLs found:', {
      fromText: urlsFromText,
      fromMarkdown: urlsFromMarkdown,
      fromHTML: urlsFromHTML,
      final: youtubeUrls
    });
    
    // Build context from YouTube transcripts FIRST
    let contextContent = '';
    
    // If there are YouTube URLs, extract their transcripts
    if (youtubeUrls.length > 0) {
      setEnhancementStatus(`📺 Extracting transcripts from ${youtubeUrls.length} YouTube video${youtubeUrls.length > 1 ? 's' : ''}...`);
      toast.info(`📺 Extracting transcripts from ${youtubeUrls.length} YouTube video${youtubeUrls.length > 1 ? 's' : ''}...`);
      
      const transcriptPromises = youtubeUrls.map(async (url) => {
        try {
          const response = await fetch('/api/youtube/transcript', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url }),
          });
          
          const data = await response.json();
          
          if (data.success && data.transcript) {
            return {
              url,
              videoId: data.videoId,
              transcript: data.transcript,
              metadata: data.metadata
            };
          }
          return null;
        } catch (error) {
          console.error(`Failed to extract transcript from ${url}:`, error);
          return null;
        }
      });
      
      const transcripts = await Promise.all(transcriptPromises);
      const validTranscripts = transcripts.filter(t => t !== null);
      
      if (validTranscripts.length > 0) {
        const youtubeContext = validTranscripts.map((t: any) => {
          console.log('Transcript extracted:', {
            url: t.url,
            videoId: t.videoId,
            transcriptLength: t.transcript?.length,
            transcriptPreview: t.transcript?.substring(0, 200)
          });
          return `YouTube Video (${t.url}):\n${t.transcript}\n`;
        }).join('\n---\n\n');
        
        contextContent += youtubeContext + '\n';
        console.log('Total context content length:', contextContent.length);
        console.log('Context preview:', contextContent.substring(0, 500));
        
        toast.success(`✅ Extracted transcripts from ${validTranscripts.length} video${validTranscripts.length > 1 ? 's' : ''}`);
        setEnhancementStatus('✨ Generating enhanced content...');
      }
    } else {
      setEnhancementStatus('✨ Generating enhanced content...');
    }

    const systemPrompt = `Enhance existing notes using additional context provided from YouTube transcripts, audio transcription or uploaded file content. Your task is to make the notes more useful and comprehensive by incorporating relevant information from the provided context.

CRITICAL REQUIREMENTS:
1. YOU MUST ALWAYS GENERATE ALL OUTPUT IN BRAZILIAN PORTUGUESE (pt-BR), regardless of the language of the input content, transcripts, or source material.
2. PRESERVE ALL YOUTUBE URLS EXACTLY AS THEY APPEAR IN THE ORIGINAL NOTES. The URLs must remain in the exact same position where they were originally placed. This is essential for the video preview functionality to work.
3. When you find a YouTube URL in the notes, keep it as-is (e.g., https://www.youtube.com/watch?v=xxxxx) and add your enhanced content AFTER the URL, not replacing it.

Input will be provided within <notes> and <context> XML tags, providing a structure for the existing notes and context respectively.

IMPORTANT: 
- If YouTube URLs are present, use their transcripts to create comprehensive summaries or analyses
- ALWAYS keep the YouTube URLs in their original position in the document
- Add the enhanced content (summary, key points, etc.) AFTER each YouTube URL
- Never remove or modify the YouTube URLs

# Output Format

Provide the enhanced notes in markdown format IN BRAZILIAN PORTUGUESE. The structure should be:
1. FIRST LINE MUST BE: TITLE: [Create a descriptive title that captures the main topic]
2. Keep any YouTube URLs exactly where they appear
3. Add enhanced content after each URL
4. Use markdown syntax for headings, lists, task lists, and emphasis
5. All text must be in Brazilian Portuguese

Example:
If the input has: https://www.youtube.com/watch?v=abc123
Output should be:
TITLE: Tutorial Completo de React com Hooks

https://www.youtube.com/watch?v=abc123

## Resumo do Vídeo
[Enhanced content in Portuguese here...]`;
    
    // Add attachments context
    if (attachments && attachments.length > 0) {
      const attachmentContext = attachments.map((file: any) => {
        const content = file?.content || '';
        if (content) {
          return `${file.name}:\n${content}\n`;
        } else {
          return `${file.name}: [No content available]\n`;
        }
      }).join('\n');
      
      if (attachmentContext) {
        contextContent += attachmentContext + '\n';
      }
    }
    
    // Add control files context (audio transcriptions, etc)
    if (controlFiles && controlFiles.length > 0) {
      const controlContext = controlFiles.map((file: any) => {
        // Check if file has transcription
        if (file.transcription) {
          return `${file.name} (Transcription):\n${file.transcription}\n`;
        } else if (file.content) {
          return `${file.name}:\n${file.content}\n`;
        } else if (file.type === 'audio' && !file.transcription) {
          return `${file.name}: [Audio file - not transcribed yet]\n`;
        } else {
          return `${file.name}: [File attached]\n`;
        }
      }).join('\n');
      
      if (controlContext) {
        contextContent += controlContext;
      }
    }

    // Log what we're sending to OpenAI
    const userMessage = `<notes>${noteMarkdown}</notes>${contextContent ? `\n<context>\n${contextContent}</context>` : ''}`;
    console.log('Sending to OpenAI:', {
      noteMarkdown: noteMarkdown,
      hasContext: !!contextContent,
      contextLength: contextContent?.length,
      fullMessageLength: userMessage.length,
      messagePreview: userMessage.substring(0, 1000)
    });
    
    const [res, controller] = await chatCompletion(
      typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '',
      {
        model: model || 'gpt-4o-mini',
        stream: true,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userMessage
          }
        ]
      }
    );

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
          console.log('Stream finished. Final content:', enhancedContent.md);
          break;
        }

        try {
          let lines = value.split('\n');

          for (const line of lines) {
            if (line.trim() !== '') {
              if (line.trim() === 'data: [DONE]') {
                console.log('Stream complete signal received');
                // Don't break here, let the outer loop handle completion
              } else if (line.startsWith('data: ')) {
                try {
                  const jsonStr = line.replace(/^data: /, '');
                  if (jsonStr.trim()) {
                    const data = JSON.parse(jsonStr);
                    const deltaContent = data.choices?.[0]?.delta?.content;
                    
                    if (deltaContent) {
                      enhancedContent.md += deltaContent;
                      
                      // Parse markdown safely
                      try {
                        enhancedContent.html = marked.parse(enhancedContent.md) as string;
                      } catch (markdownError) {
                        console.error('Markdown parsing error:', markdownError);
                        // Fallback to raw markdown if parsing fails
                        enhancedContent.html = enhancedContent.md;
                      }
                      
                      console.log('Streaming chunk:', deltaContent);
                      
                      // Update editor content in real-time
                      if (editor && enhancedContent.html) {
                        // Check if content starts with "TITLE:" and extract it
                        const titleMatch = enhancedContent.md.match(/^TITLE:\s*(.+?)(\n|$)/i);
                        if (titleMatch) {
                          const extractedTitle = titleMatch[1].trim();
                          setTitle(extractedTitle);
                          
                          // Remove the TITLE: line from the content
                          const contentWithoutTitle = enhancedContent.md.replace(/^TITLE:\s*(.+?)(\n|$)/i, '').trim();
                          const htmlWithoutTitle = marked.parse(contentWithoutTitle) as string;
                          editor.commands.setContent(htmlWithoutTitle);
                        } else {
                          editor.commands.setContent(enhancedContent.html);
                        }
                        
                        // Trigger YouTube preview processing after content update
                        setTimeout(() => {
                          // Process YouTube links to add previews
                          if (youtubePreviewRef.current) {
                            youtubePreviewRef.current.processLinks();
                          }
                          editor.commands.focus();
                        }, 100);
                      }
                    }
                    
                    // Check if this is the final message
                    if (data.choices?.[0]?.finish_reason) {
                      console.log('Finish reason:', data.choices[0].finish_reason);
                    }
                  }
                } catch (parseError) {
                  console.error('Error parsing JSON:', parseError, 'Line:', line);
                }
              }
            }
          }
        } catch (error) {
          console.error('Error processing stream chunk:', error);
          // Continue processing instead of breaking
        }
      }
      
      // After streaming completes, check for title one more time and save
      if (editor && !editor.isDestroyed) {
        // Extract title from the final content if it exists
        const editorText = editor.getText();
        const titleMatch = editorText.match(/^TITLE:\s*(.+?)(\n|$)/i);
        if (titleMatch) {
          const extractedTitle = titleMatch[1].trim();
          setTitle(extractedTitle);
          
          // Remove the TITLE: line from the editor
          const contentWithoutTitle = editorText.replace(/^TITLE:\s*(.+?)(\n|$)/i, '').trim();
          editor.commands.setContent(contentWithoutTitle);
        }
        
        // Give TipTap a moment to process the HTML and update its internal state
        setTimeout(() => {
          handleAutoSave(editor);
        }, 500);
      }
    } else {
      throw new Error('Failed to enhance content');
    }
  };

  // AI handlers
  const handleEnhance = async () => {
    // Check if we have content to enhance
    const noteContent = editor?.getText() || '';
    const hasNoteContent = noteContent.trim().length > 0;
    const hasAttachments = attachments && attachments.length > 0;
    const hasControlFiles = controlFiles && controlFiles.length > 0;
    const hasContent = hasNoteContent || hasAttachments || hasControlFiles;
    
    if (!hasContent) {
      toast.error('No content to enhance. Please add some text to the note or attach files first.');
      return;
    }

    // Use GPT-4o-mini by default (like Open Notes) but can use GPT-4 for better results
    const selectedModel = 'gpt-4o-mini';
    
    // Start enhancing
    setIsEnhancing(true);
    toast.info('✨ Enhancing your note...');

    try {
      // Call the enhance completion handler (exactly like Open Notes)
      await enhanceCompletionHandler(selectedModel);
      
      toast.success('✅ Note enhanced successfully!');
    
    // Process YouTube links after enhancement is complete
    setTimeout(() => {
      if (youtubePreviewRef.current) {
        youtubePreviewRef.current.processLinks();
      }
    }, 200);
    } catch (error) {
      console.error('Enhancement error:', error);
      toast.error('Failed to enhance note. Please try again.');
    } finally {
      setIsEnhancing(false);
      setEnhancementStatus('Enhancing your note...');
    }
  };

  const handleSummarize = async () => {
    const selectedText = editor?.state.selection.empty ? editor?.getText() : editor?.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, ' ');
    if (!selectedText) {
      toast.info('Por favor, selecione algum texto para resumir.');
      return;
    }
    toast.info('Resumindo texto...');
    const result = await runAgentTool(noteId, 'text_enhancement_tool.summarize_text', { 
      text: selectedText, 
      length: 'short',
      language: 'pt-BR' // Force Brazilian Portuguese
    }, note?.agent_id);
    if (result?.success && result.output) {
      editor?.chain().focus().insertContent(result.output).run();
      toast.success('Texto resumido com sucesso!');
    } else {
      toast.error(`Falha ao resumir texto: ${result?.output || 'Erro desconhecido'}`);
    }
  };

  const handleCorrectGrammar = async () => {
    const selectedText = editor?.state.selection.empty ? editor?.getText() : editor?.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, ' ');
    if (!selectedText) {
      toast.info('Por favor, selecione algum texto para corrigir a gramática.');
      return;
    }
    toast.info('Corrigindo gramática...');
    const result = await runAgentTool(noteId, 'text_enhancement_tool.correct_grammar', { 
      text: selectedText,
      language: 'pt-BR' // Force Brazilian Portuguese
    }, note?.agent_id);
    if (result?.success && result.output) {
      editor?.chain().focus().insertContent(result.output).run();
      toast.success('Gramática corrigida com sucesso!');
    } else {
      toast.error(`Falha ao corrigir gramática: ${result?.output || 'Erro desconhecido'}`);
    }
  };

  const handleExpand = async () => {
    const selectedText = editor?.state.selection.empty ? editor?.getText() : editor?.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, ' ');
    if (!selectedText) {
      toast.info('Por favor, selecione algum texto para expandir.');
      return;
    }
    toast.info('Expandindo texto...');
    const result = await runAgentTool(noteId, 'text_enhancement_tool.expand_text', { 
      text: selectedText, 
      detail_level: 'medium',
      language: 'pt-BR' // Force Brazilian Portuguese
    }, note?.agent_id);
    if (result?.success && result.output) {
      editor?.chain().focus().insertContent(result.output).run();
      toast.success('Texto expandido com sucesso!');
    } else {
      toast.error(`Falha ao expandir texto: ${result?.output || 'Erro desconhecido'}`);
    }
  };

  const handleAIChat = () => {
    // Open chat panel
    setSelectedPanel('chat');
    setShowPanel(true);
    setIsChatVisible(true);
  };

  // YouTube handler
  const [showYouTubeDialog, setShowYouTubeDialog] = useState(false);
  
  const handleYouTube = () => {
    setShowYouTubeDialog(true);
  };

  const handleYouTubeTranscriptExtracted = (transcript: string, metadata: any) => {
    // Add transcript to control files as context
    const youtubeFile = {
      id: `youtube-${Date.now()}`,
      name: `YouTube Transcript - ${metadata.videoId}`,
      size: transcript.length,
      type: 'text',
      content: transcript,
      status: 'ready' as const,
      metadata
    };
    
    setControlFiles(prev => [...prev, youtubeFile]);
    
    // Open Controls panel to show the extracted transcript
    setSelectedPanel('controls');
    setShowPanel(true);
    setIsChatVisible(false);
    
    toast.success('YouTube transcript added to context!');
  };

  // File upload handler
  const handleFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '*/*';
    input.multiple = true;
    input.onchange = async (event) => {
      const files = (event.target as HTMLInputElement).files;
      if (files) {
        for (const file of Array.from(files)) {
          const fileInfo: {
            id: string;
            name: string;
            size: number;
            type: string;
            file?: File;
            status: 'uploading' | 'ready';
            content?: string;
            metadata?: any;
          } = {
            id: `file-${Date.now()}-${Math.random()}`,
            name: file.name,
            size: file.size,
            type: file.type.startsWith('image/') ? 'image' : 'document',
            file,
            status: 'uploading' as const
          };
          
          setControlFiles(prev => [...prev, fileInfo]);
          
          // If it's a text file, read its content
          if (file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
            const reader = new FileReader();
            reader.onload = (e) => {
              fileInfo.content = e.target?.result as string;
              fileInfo.status = 'ready';
              setControlFiles(prev => prev.map(f => f.id === fileInfo.id ? fileInfo : f));
            };
            reader.readAsText(file);
          } else {
            fileInfo.status = 'ready';
            setControlFiles(prev => prev.map(f => f.id === fileInfo.id ? fileInfo : f));
          }
        }
        
        // Open Controls panel
        setSelectedPanel('controls');
        setShowPanel(true);
        setIsChatVisible(false);
        
        toast.success(`${files.length} file(s) added!`);
      }
    };
    input.click();
  };

  // Additional AI handlers
  const handleSimplify = async () => {
    const selectedText = editor?.state.selection.empty 
      ? editor?.getText() 
      : editor?.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, ' ');
    
    if (!selectedText) {
      toast.info('Por favor, selecione algum texto para simplificar.');
      return;
    }
    
    toast.info('Simplificando texto...');
    try {
      const result = await runAgentTool(
        noteId, 
        'text_enhancement_tool.simplify_text', 
        { 
          text: selectedText,
          language: 'pt-BR' // Force Brazilian Portuguese
        }, 
        note?.agent_id
      );
      
      if (result?.success && result.output) {
        editor?.chain().focus().insertContent(result.output).run();
        toast.success('Texto simplificado com sucesso!');
      }
    } catch (error) {
      toast.error('Falha ao simplificar texto');
    }
  };

  const handleTranslate = async () => {
    const selectedText = editor?.state.selection.empty 
      ? editor?.getText() 
      : editor?.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, ' ');
    
    if (!selectedText) {
      toast.info('Por favor, selecione algum texto para traduzir.');
      return;
    }
    
    // Always translate to Portuguese BR
    toast.info('Traduzindo texto para português...');
    try {
      const result = await runAgentTool(
        noteId, 
        'text_enhancement_tool.translate_text', 
        { text: selectedText, target_language: 'pt-BR' }, // Always translate to Portuguese
        note?.agent_id
      );
      
      if (result?.success && result.output) {
        editor?.chain().focus().insertContent(result.output).run();
        toast.success('Texto traduzido com sucesso!');
      }
    } catch (error) {
      toast.error('Falha ao traduzir texto');
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to load note</p>
          <p className="text-sm text-muted-foreground">{error?.message}</p>
          <Button variant="outline" onClick={onBack} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={cn("flex flex-col h-full", className)}>
        {/* Header Skeleton */}
        <div className="p-6 border-b border-border/40">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-8 w-64" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        
        {/* Toolbar Skeleton */}
        <div className="p-4 border-b border-border/40">
          <div className="flex items-center gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-8" />
            ))}
          </div>
        </div>
        
        {/* Content Skeleton */}
        <div className="flex-1 p-6">
          <div className="space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" style={{ 
                width: `${Math.random() * 40 + 60}%` 
              }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">Note not found</p>
          <p className="text-muted-foreground mb-4">
            The note you're looking for doesn't exist or has been deleted.
          </p>
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Header */}
      <div className="p-3 sm:p-4 md:p-6 border-b border-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack} className="p-1 sm:p-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled"
              className="text-lg sm:text-xl md:text-2xl font-semibold border-none p-0 h-auto bg-transparent focus-visible:ring-0 flex-1"
            />
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            {editor && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().undo().run()}
                  disabled={!editor.can().undo()}
                  className="p-1.5 sm:p-2"
                >
                  <Undo className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().redo().run()}
                  disabled={!editor.can().redo()}
                  className="p-1.5 sm:p-2"
                >
                  <Redo className="h-4 w-4" />
                </Button>
                <Separator orientation="vertical" className="h-6 hidden sm:block" />
              </>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleStar}
              disabled={isTogglingStatus}
              className="p-1.5 sm:p-2"
            >
              <Star className={cn(
                "h-4 w-4",
                note.is_starred && "fill-yellow-400 text-yellow-400"
              )} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleManualSave}
              disabled={isSaving}
              className="p-1.5 sm:p-2"
            >
              <Save className="h-4 w-4" />
            </Button>
            
            {enableChat && (
              <>
                <Separator orientation="vertical" className="h-6 hidden sm:block" />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={selectedPanel === 'chat' && showPanel ? "default" : "ghost"}
                        size="sm"
                        onClick={handleToggleChat}
                        className="relative p-1.5 sm:p-2"
                      >
                        <MessageSquare className="h-4 w-4" />
                        {unreadMessages > 0 && (
                          <Badge 
                            variant="destructive" 
                            className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 text-xs p-0 flex items-center justify-center"
                          >
                            {unreadMessages > 99 ? '99+' : unreadMessages}
                          </Badge>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Chat</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={selectedPanel === 'controls' && showPanel ? "default" : "ghost"}
                        size="sm"
                        onClick={handleToggleControls}
                        className="relative p-1.5 sm:p-2"
                      >
                        <Settings className="h-4 w-4" />
                        {controlFiles.length > 0 && (
                          <Badge 
                            variant="secondary" 
                            className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 text-xs p-0 flex items-center justify-center"
                          >
                            {controlFiles.length}
                          </Badge>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Controls</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="p-1.5 sm:p-2">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('md')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export as Markdown
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('html')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export as HTML
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('txt')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export as Text
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleToggleArchive}>
                  <Archive className="h-4 w-4 mr-2" />
                  {note.is_archived ? 'Unarchive' : 'Archive'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(note.created_at), 'MMM d, yyyy')}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>Updated {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}</span>
          </div>
          {editor && (
            <div className="flex items-center gap-4">
              <span>{editor.storage.characterCount.words()} words</span>
              <span>{editor.storage.characterCount.characters()} characters</span>
              {note.reading_time > 0 && <span>{note.reading_time} min read</span>}
            </div>
          )}
          {/* Removed saving indicators - they were too distracting */}
          {note.is_archived && <Badge variant="secondary">Archived</Badge>}
        </div>
      </div>

      {/* Toolbar */}
      {editor && (
        <div className="border-b border-border/40">
          <EditorToolbar 
            editor={editor} 
            noteId={note?.id}
            onFileUploaded={handleFileUploaded}
          />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative h-full">
        {/* Editor */}
        <div className={cn(
          "flex-1 overflow-y-auto overflow-x-hidden transition-all duration-300 h-full",
          showPanel && enableChat ? "mr-0" : ""
        )}>
          <div className="h-full w-full max-w-full p-3 sm:p-4 md:p-6 pb-16 sm:pb-20 overflow-x-hidden relative">
            {/* Loading Overlay with Blur Effect */}
            {isEnhancing && (
              <div className="absolute inset-0 z-50 flex items-center justify-center">
                {/* Blur Background */}
                <div className="absolute inset-0 backdrop-blur-sm bg-background/50" />
                
                {/* Loading Indicator */}
                <div className="relative bg-background/95 backdrop-blur rounded-lg p-6 shadow-lg border border-border/50 flex flex-col items-center gap-4">
                  <div className="relative">
                    {/* Animated spinner ring */}
                    <div className="w-12 h-12 border-4 border-primary/20 rounded-full animate-pulse" />
                    <div className="absolute inset-0 w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                  
                  <div className="text-center">
                    <p className="font-medium text-foreground">{enhancementStatus}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {enhancementStatus.includes('Extracting') 
                        ? 'Downloading and processing video transcripts...' 
                        : 'Creating enhanced content from your notes...'}
                    </p>
                  </div>
                  
                  {/* Optional: Stop button */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setStopResponseFlag(true)}
                    className="mt-2"
                  >
                    Stop
                  </Button>
                </div>
              </div>
            )}
            
            <EditorContent 
              editor={editor} 
              className={cn(
                "min-h-[400px] w-full max-w-full overflow-x-hidden break-words transition-all",
                isEnhancing && "opacity-50 pointer-events-none select-none"
              )}
              style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
            />
            
            {/* YouTube Preview Handler */}
            {editor && <YouTubePreviewHandler ref={youtubePreviewRef} editor={editor} />}
            
            {/* Attachments Section */}
            {attachments.length > 0 && (
              <div className="mt-8 p-4 border-t border-border/40">
                <NoteAttachments 
                  attachments={attachments}
                  onAttachmentDeleted={handleAttachmentDeleted}
                  maxVisible={3}
                />
              </div>
            )}
            
            {/* Floating Action Buttons - Fixed position relative to editor content */}
            {/* Record Menu - Bottom Left */}
            <div className="absolute bottom-6 left-6 z-40">
              <RecordMenu
                onRecord={handleRecord}
                onCaptureAudio={handleCaptureAudio}
                onUpload={handleUploadAudio}
              >
                <Button
                  size="icon"
                  className="h-10 w-10 sm:h-12 sm:w-12 rounded-full shadow-md hover:shadow-lg transition-all hover:scale-105 bg-card/50 backdrop-blur-sm text-foreground border border-border/50 hover:bg-accent hover:text-accent-foreground"
                >
                  <Mic className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </RecordMenu>
            </div>

            {/* AI Menu - Bottom Right */}
            <div className="absolute bottom-6 right-6 z-40 transition-all duration-300">
              <AIMenu
                onEnhance={handleEnhance}
                onSummarize={handleSummarize}
                onCorrectGrammar={handleCorrectGrammar}
                onExpand={handleExpand}
                onChat={handleAIChat}
                onYouTube={handleYouTube}
                onFileUpload={handleFileUpload}
                onSimplify={handleSimplify}
                onTranslate={handleTranslate}
              >
                <Button
                  size="icon"
                  className="h-10 w-10 sm:h-12 sm:w-12 rounded-full shadow-md hover:shadow-lg transition-all hover:scale-105 bg-card/50 backdrop-blur-sm text-foreground border border-border/50 hover:bg-accent hover:text-accent-foreground"
                >
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </AIMenu>
            </div>
          </div>

          {/* Voice Recording Component */}
          {showVoiceRecording && (
            <div className="absolute inset-x-4 bottom-20 z-50 max-w-2xl mx-auto">
              <VoiceRecording
                recording={isRecording}
                transcribe={false}
                displayMedia={isCapturingSystemAudio}
                echoCancellation={true}
                noiseSuppression={true}
                autoGainControl={true}
                onCancel={handleVoiceRecordingCancel}
                onConfirm={handleVoiceRecordingConfirm}
              />
            </div>
          )}
        </div>

        {/* Side Panel - Chat or Controls */}
        {enableChat && (
          <div className={cn(
            "transition-all duration-300 ease-in-out border-l bg-background h-full",
            showPanel ? "w-full sm:w-80 md:w-96 absolute sm:relative inset-0 sm:inset-auto" : "w-0 overflow-hidden"
          )}>
            {showPanel && selectedPanel === 'chat' && (
              <NoteChatSimple
                noteId={noteId}
                userId={userId}
                className="h-full w-full"
                onMessageCountChange={handleMessageCountChange}
                isVisible={true}
                onClose={handleClosePanel}
                note={{
                  id: noteId,
                  data: {
                    content: {
                      md: editor?.getText() || '',
                      html: editor?.getHTML() || '',
                      json: editor?.getJSON() || null
                    }
                  }
                }}
                selectedContent={selectedContent}
                onContentUpdate={(content) => {
                  if (editor && content) {
                    if (content.html) {
                      editor.commands.setContent(content.html);
                    } else if (content.md) {
                      editor.commands.setContent(content.md);
                    }
                  }
                }}
                files={controlFiles}
                editor={editor}
                selectedModelId={selectedModelId}
              />
            )}
            {showPanel && selectedPanel === 'controls' && (
              <NoteControls
                show={true}
                selectedModelId={selectedModelId}
                files={controlFiles}
                onUpdate={handleControlFilesUpdate}
                onClose={handleClosePanel}
                className="h-full w-full p-4"
                noteId={noteId}
                onProcessAudio={(text: string) => {
                  if (editor) {
                    editor.chain().focus().insertContent(text).run();
                    handleClosePanel();
                  }
                }}
              />
            )}
          </div>
        )}
      </div>
      
      {/* YouTube Transcript Extractor Dialog */}
      {showYouTubeDialog && (
        <YouTubeTranscriptExtractor
          open={showYouTubeDialog}
          onClose={() => setShowYouTubeDialog(false)}
          onTranscriptExtracted={handleYouTubeTranscriptExtracted}
        />
      )}
    </div>
  );
}