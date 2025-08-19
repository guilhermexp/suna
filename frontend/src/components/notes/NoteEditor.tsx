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
  Sparkles
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
import { uploadAudioForTranscription } from '@/lib/api/transcription';
import { runAgentTool } from '@/lib/api/agent_tools';

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
import { TiptapCollaboration } from './TiptapCollaboration';

// Toolbar component
import { EditorToolbar } from './EditorToolbar';

// YouTube Preview Handler
import { YouTubePreviewHandler } from './YouTubePreviewHandler';

// Chat component
import { NoteChat } from './NoteChat';

// Attachments component
import { NoteAttachments } from './NoteAttachments';

// Menu components
import { RecordMenu } from './RecordMenu';
import { AIMenu } from './AIMenu';

// Lowlight configuration for code highlighting
const lowlight = createLowlight();

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
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

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
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'rounded-md bg-muted p-4 font-mono text-sm',
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
      }, 1000); // 1 second debounce
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm sm:prose lg:prose-lg xl:prose-xl mx-auto focus:outline-none',
          'dark:prose-invert',
          'max-w-none',
          'min-h-[400px]',
          'p-4'
        ),
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
      setIsSaving(true);
      
      const content = editorInstance.getJSON();
      const html = editorInstance.getHTML();
      const text = editorInstance.getText();
      const wordCount = editorInstance.storage.characterCount.words();
      const readingTime = Math.ceil(wordCount / 200); // Assuming 200 WPM reading speed

      await updateNote({
        title: title || 'Untitled',
        content,
        content_text: text,
        word_count: wordCount,
        reading_time: readingTime,
      });

      setLastSaved(new Date());
      
      if (onSave && note) {
        onSave({
          ...note,
          title: title || 'Untitled',
          content,
          content_text: text,
          word_count: wordCount,
          reading_time: readingTime,
        });
      }
    } catch (error) {
      toast.error('Failed to save note');
    } finally {
      setIsSaving(false);
    }
  }, [note, title, updateNote, onSave]);

  // Manual save
  const handleManualSave = useCallback(() => {
    if (editor && !editor.isDestroyed) {
      handleAutoSave(editor);
    }
  }, [editor, handleAutoSave]);

  // Save on title change
  useEffect(() => {
    if (note && title !== note.title) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        if (editor) {
          handleAutoSave(editor);
        }
      }, 1000);
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

  // Chat handlers
  const handleToggleChat = () => {
    setIsChatVisible(!isChatVisible);
    if (!isChatVisible) {
      setUnreadMessages(0); // Clear unread count when opening chat
    }
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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleRecord = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      toast.info('Recording stopped.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
        console.log('Recorded audio file:', audioFile);
        toast.success('Audio recorded successfully! Transcribing...');
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());

        const transcriptionResult = await uploadAudioForTranscription(audioFile);
        if (transcriptionResult?.text) {
          editor?.chain().focus().insertContent(transcriptionResult.text).run();
          toast.success('Transcription complete!');
        } else {
          toast.error('Failed to transcribe audio.');
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast.info('Recording started...');
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Failed to access microphone. Please ensure permissions are granted.');
    }
  };

  const handleCaptureAudio = () => {
    // This typically refers to capturing system audio, which is more complex.
    // For now, we'll treat it similar to direct recording from microphone.
    // If specific system audio capture is needed, it requires more advanced APIs or browser extensions.
    toast.info('System audio capture is not directly supported via web APIs. Using microphone recording.');
    handleRecord(); // Fallback to microphone recording
  };

  const handleUploadAudio = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        console.log('Selected audio file for upload:', file);
        toast.info('Audio file selected. Transcribing...');

        const transcriptionResult = await uploadAudioForTranscription(file);
        if (transcriptionResult?.text) {
          editor?.chain().focus().insertContent(transcriptionResult.text).run();
          toast.success('Transcription complete!');
        } else {
          toast.error('Failed to transcribe audio.');
        }
      }
    };
    input.click();
  };

  // AI handlers
  const handleEnhance = async () => {
    const selectedText = editor?.state.selection.empty ? editor?.getText() : editor?.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, ' ');
    if (!selectedText) {
      toast.info('Please select some text to enhance.');
      return;
    }
    toast.info('Enhancing text...');
    const result = await runAgentTool(noteId, 'text_enhancement_tool.rephrase_text', { text: selectedText, style: 'creative' }, note?.agent_id);
    if (result?.success && result.output) {
      editor?.chain().focus().insertContent(result.output).run();
      toast.success('Text enhanced successfully!');
    } else {
      toast.error(`Failed to enhance text: ${result?.output || 'Unknown error'}`);
    }
  };

  const handleSummarize = async () => {
    const selectedText = editor?.state.selection.empty ? editor?.getText() : editor?.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, ' ');
    if (!selectedText) {
      toast.info('Please select some text to summarize.');
      return;
    }
    toast.info('Summarizing text...');
    const result = await runAgentTool(noteId, 'text_enhancement_tool.summarize_text', { text: selectedText, length: 'short' }, note?.agent_id);
    if (result?.success && result.output) {
      editor?.chain().focus().insertContent(result.output).run();
      toast.success('Text summarized successfully!');
    } else {
      toast.error(`Failed to summarize text: ${result?.output || 'Unknown error'}`);
    }
  };

  const handleCorrectGrammar = async () => {
    const selectedText = editor?.state.selection.empty ? editor?.getText() : editor?.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, ' ');
    if (!selectedText) {
      toast.info('Please select some text to correct grammar.');
      return;
    }
    toast.info('Correcting grammar...');
    const result = await runAgentTool(noteId, 'text_enhancement_tool.correct_grammar', { text: selectedText }, note?.agent_id);
    if (result?.success && result.output) {
      editor?.chain().focus().insertContent(result.output).run();
      toast.success('Grammar corrected successfully!');
    } else {
      toast.error(`Failed to correct grammar: ${result?.output || 'Unknown error'}`);
    }
  };

  const handleExpand = async () => {
    const selectedText = editor?.state.selection.empty ? editor?.getText() : editor?.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, ' ');
    if (!selectedText) {
      toast.info('Please select some text to expand.');
      return;
    }
    toast.info('Expanding text...');
    const result = await runAgentTool(noteId, 'text_enhancement_tool.expand_text', { text: selectedText, detail_level: 'medium' }, note?.agent_id);
    if (result?.success && result.output) {
      editor?.chain().focus().insertContent(result.output).run();
      toast.success('Text expanded successfully!');
    } else {
      toast.error(`Failed to expand text: ${result?.output || 'Unknown error'}`);
    }
  };

  const handleAIChat = () => {
    // Toggle the existing chat panel
    handleToggleChat();
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleChat}
                  className="relative p-1.5 sm:p-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  {unreadMessages > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 text-xs p-0 flex items-center justify-center"
                    >
                      {unreadMessages > 99 ? '99+' : unreadMessages}
                    </Badge>
                  )}
                </Button>
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
          {isSaving && <Badge variant="secondary">Saving...</Badge>}
          {lastSaved && !isSaving && (
            <Badge variant="outline">
              Saved {formatDistanceToNow(lastSaved, { addSuffix: true })}
            </Badge>
          )}
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
      <div className="flex-1 flex overflow-hidden relative">
        {/* Editor */}
        <div className={cn(
          "flex-1 overflow-auto transition-all duration-300",
          isChatVisible && enableChat ? "mr-0" : ""
        )}>
          <div className="h-full w-full p-3 sm:p-4 md:p-6 pb-16 sm:pb-20">
            <EditorContent 
              editor={editor} 
              className="min-h-[400px] w-full"
            />
            
            {/* YouTube Preview Handler */}
            {editor && <YouTubePreviewHandler editor={editor} />}
            
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
          </div>
          
          {/* Floating Action Buttons - Fixed position relative to editor */}
          {/* Record Menu - Bottom Left */}
          <div className="absolute bottom-4 left-4 z-40">
            <RecordMenu
              onRecord={handleRecord}
              onCaptureAudio={handleCaptureAudio}
              onUpload={handleUploadAudio}
            >
              <Button
                size="icon"
                variant="secondary"
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-full shadow-md hover:shadow-lg transition-all hover:scale-105"
              >
                <Mic className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </RecordMenu>
          </div>

          {/* AI Menu - Bottom Right (adjusts position when chat is open) */}
          <div className={cn(
            "absolute bottom-4 z-40 transition-all duration-300",
            isChatVisible && enableChat ? "right-4" : "right-4"
          )}>
            <AIMenu
              onEnhance={handleEnhance}
              onSummarize={handleSummarize}
              onCorrectGrammar={handleCorrectGrammar}
              onExpand={handleExpand}
              onChat={handleAIChat}
            >
              <Button
                size="icon"
                variant="secondary"
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-full shadow-md hover:shadow-lg transition-all hover:scale-105"
              >
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </AIMenu>
          </div>
        </div>

        {/* Chat Panel - Responsive width */}
        {enableChat && (
          <div className={cn(
            "transition-all duration-300 ease-in-out border-l bg-background",
            isChatVisible ? "w-full sm:w-80 md:w-96 absolute sm:relative inset-0 sm:inset-auto" : "w-0 overflow-hidden"
          )}>
            {isChatVisible && (
              <NoteChat
                noteId={noteId}
                userId={userId}
                className="h-full w-full"
                onMessageCountChange={handleMessageCountChange}
                isVisible={isChatVisible}
                onClose={handleToggleChat}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}