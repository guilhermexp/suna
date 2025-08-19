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
  const handleRecord = () => {
    // TODO: Implement voice recording
    toast.info('Voice recording coming soon!');
  };

  const handleCaptureAudio = () => {
    // TODO: Implement audio capture
    toast.info('Audio capture coming soon!');
  };

  const handleUploadAudio = () => {
    // TODO: Implement audio upload
    toast.info('Audio upload coming soon!');
  };

  // AI handlers
  const handleEnhance = () => {
    // TODO: Implement text enhancement with AI
    toast.info('Text enhancement coming soon!');
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
      <div className="p-6 border-b border-border/40">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled"
              className="text-2xl font-semibold border-none p-0 h-auto bg-transparent focus-visible:ring-0 flex-1"
              style={{ fontSize: '1.5rem', lineHeight: '2rem' }}
            />
          </div>
          
          <div className="flex items-center gap-2">
            {editor && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().undo().run()}
                  disabled={!editor.can().undo()}
                >
                  <Undo className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().redo().run()}
                  disabled={!editor.can().redo()}
                >
                  <Redo className="h-4 w-4" />
                </Button>
                <Separator orientation="vertical" className="h-6" />
              </>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleStar}
              disabled={isTogglingStatus}
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
            >
              <Save className="h-4 w-4" />
            </Button>
            
            {enableChat && (
              <>
                <Separator orientation="vertical" className="h-6" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleChat}
                  className="relative"
                >
                  <MessageCircle className="h-4 w-4" />
                  {unreadMessages > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center"
                    >
                      {unreadMessages > 99 ? '99+' : unreadMessages}
                    </Badge>
                  )}
                </Button>
              </>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
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
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
      <div className="flex-1 flex overflow-hidden">
        {/* Editor */}
        <div className={cn(
          "flex-1 overflow-auto transition-all duration-300 relative",
          isChatVisible && enableChat ? "mr-0" : ""
        )}>
          <div className="h-full w-full p-6 pb-20">
            <EditorContent 
              editor={editor} 
              className="min-h-[400px] w-full"
            />
            
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
          
          {/* Floating Action Buttons - Inside Editor Container */}
          {/* Record Menu - Bottom Left */}
          <div className="fixed bottom-6 left-6 z-50">
            <RecordMenu
              onRecord={handleRecord}
              onCaptureAudio={handleCaptureAudio}
              onUpload={handleUploadAudio}
            >
              <Button
                size="icon"
                variant="secondary"
                className="h-10 w-10 rounded-full shadow-md hover:shadow-lg transition-all hover:scale-105"
              >
                <Mic className="h-4 w-4" />
              </Button>
            </RecordMenu>
          </div>

          {/* AI Menu - Bottom Right */}
          <div className="fixed bottom-6 right-6 z-50">
            <AIMenu
              onEnhance={handleEnhance}
              onChat={handleAIChat}
            >
              <Button
                size="icon"
                variant="secondary"
                className="h-10 w-10 rounded-full shadow-md hover:shadow-lg transition-all hover:scale-105"
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            </AIMenu>
          </div>
        </div>

        {/* Chat Panel */}
        {enableChat && (
          <div className={cn(
            "transition-all duration-300 ease-in-out border-l bg-background",
            isChatVisible ? "w-96" : "w-0 overflow-hidden"
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