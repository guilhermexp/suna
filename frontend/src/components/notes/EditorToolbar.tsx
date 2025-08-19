'use client';

import React from 'react';
import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link,
  Image,
  Table,
  CheckSquare,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Code2,
  Paperclip
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { NoteFileUpload } from './NoteFileUpload';
import { type FileAttachment } from '@/lib/supabase/storage';

interface EditorToolbarProps {
  editor: Editor;
  className?: string;
  noteId?: string;
  onFileUploaded?: (attachment: FileAttachment) => void;
}

export function EditorToolbar({ editor, className, noteId, onFileUploaded }: EditorToolbarProps) {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = React.useState(false);
  const addImage = () => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL:', previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const handleFileUploaded = (attachment: FileAttachment) => {
    // If it's an image, insert it into the editor
    if (attachment.mime_type.startsWith('image/')) {
      editor.chain().focus().setImage({ 
        src: attachment.public_url,
        alt: attachment.file_name 
      }).run();
    }
    
    onFileUploaded?.(attachment);
    setIsUploadDialogOpen(false);
  };

  if (!editor) {
    return null;
  }

  return (
    <div className={cn(
      "flex items-center gap-1 p-2 bg-background/50 backdrop-blur overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700",
      className
    )}>
      {/* Text Formatting */}
      <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn("p-1.5 sm:p-2", editor.isActive('bold') && 'bg-muted')}
        >
          <Bold className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn("p-1.5 sm:p-2", editor.isActive('italic') && 'bg-muted')}
        >
          <Italic className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={cn("p-1.5 sm:p-2", editor.isActive('underline') && 'bg-muted')}
        >
          <Underline className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={cn("p-1.5 sm:p-2 hidden sm:flex", editor.isActive('strike') && 'bg-muted')}
        >
          <Strikethrough className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={cn("p-1.5 sm:p-2 hidden sm:flex", editor.isActive('code') && 'bg-muted')}
        >
          <Code className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6 flex-shrink-0" />

      {/* Headings */}
      <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "p-1.5 sm:p-2",
                (editor.isActive('heading', { level: 1 }) ||
                 editor.isActive('heading', { level: 2 }) ||
                 editor.isActive('heading', { level: 3 })) && 'bg-muted'
              )}
            >
              {editor.isActive('heading', { level: 1 }) ? (
                <Heading1 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              ) : editor.isActive('heading', { level: 2 }) ? (
                <Heading2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              ) : editor.isActive('heading', { level: 3 }) ? (
                <Heading3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              ) : (
                <Heading1 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().setParagraph().run()}
              className={cn(editor.isActive('paragraph') && 'bg-muted')}
            >
              Paragraph
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={cn(editor.isActive('heading', { level: 1 }) && 'bg-muted')}
            >
              <Heading1 className="h-4 w-4 mr-2" />
              Heading 1
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={cn(editor.isActive('heading', { level: 2 }) && 'bg-muted')}
            >
              <Heading2 className="h-4 w-4 mr-2" />
              Heading 2
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={cn(editor.isActive('heading', { level: 3 }) && 'bg-muted')}
            >
              <Heading3 className="h-4 w-4 mr-2" />
              Heading 3
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Separator orientation="vertical" className="h-6 flex-shrink-0" />

      {/* Lists */}
      <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn("p-1.5 sm:p-2", editor.isActive('bulletList') && 'bg-muted')}
        >
          <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn("p-1.5 sm:p-2", editor.isActive('orderedList') && 'bg-muted')}
        >
          <ListOrdered className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={cn("p-1.5 sm:p-2 hidden sm:flex", editor.isActive('taskList') && 'bg-muted')}
        >
          <CheckSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6 flex-shrink-0 hidden sm:flex" />

      {/* Block Elements */}
      <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0 hidden sm:flex">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={cn("p-1.5 sm:p-2", editor.isActive('blockquote') && 'bg-muted')}
        >
          <Quote className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={cn("p-1.5 sm:p-2", editor.isActive('codeBlock') && 'bg-muted')}
        >
          <Code2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="p-1.5 sm:p-2"
        >
          <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6 flex-shrink-0 hidden md:flex" />

      {/* Links and Media */}
      <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0 hidden md:flex">
        <Button
          variant="ghost"
          size="sm"
          onClick={addLink}
          className={cn("p-1.5 sm:p-2", editor.isActive('link') && 'bg-muted')}
        >
          <Link className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={addImage}
          className="p-1.5 sm:p-2"
        >
          <Image className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
        
        {/* File Upload */}
        {noteId && (
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                title="Upload files"
                className="p-1.5 sm:p-2"
              >
                <Paperclip className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Upload Files</DialogTitle>
              </DialogHeader>
              <NoteFileUpload
                noteId={noteId}
                onFileUploaded={handleFileUploaded}
                maxFiles={5}
                className="mt-4"
              />
            </DialogContent>
          </Dialog>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={addTable}
          className={cn("p-1.5 sm:p-2", editor.isActive('table') && 'bg-muted')}
        >
          <Table className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6 flex-shrink-0 hidden lg:flex" />

      {/* Text Alignment */}
      <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0 hidden lg:flex">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={cn("p-1.5 sm:p-2", editor.isActive({ textAlign: 'left' }) && 'bg-muted')}
        >
          <AlignLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={cn("p-1.5 sm:p-2", editor.isActive({ textAlign: 'center' }) && 'bg-muted')}
        >
          <AlignCenter className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={cn("p-1.5 sm:p-2", editor.isActive({ textAlign: 'right' }) && 'bg-muted')}
        >
          <AlignRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={cn(editor.isActive({ textAlign: 'justify' }) && 'bg-muted')}
        >
          <AlignJustify className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}