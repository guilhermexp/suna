'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  File,
  Image as ImageIcon,
  FileText,
  Download,
  Trash2,
  ExternalLink,
  Eye,
  ChevronDown,
  ChevronUp,
  Paperclip
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { type FileAttachment, deleteAttachment, fileUtils } from '@/lib/supabase/storage';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface NoteAttachmentsProps {
  attachments: FileAttachment[];
  onAttachmentDeleted?: (attachmentId: string) => void;
  className?: string;
  compact?: boolean;
  maxVisible?: number;
}

export function NoteAttachments({
  attachments,
  onAttachmentDeleted,
  className,
  compact = false,
  maxVisible = 5
}: NoteAttachmentsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const visibleAttachments = isExpanded ? attachments : attachments.slice(0, maxVisible);
  const hasMoreAttachments = attachments.length > maxVisible;

  const getFileIcon = (attachment: FileAttachment) => {
    if (attachment.mime_type.startsWith('image/')) {
      return ImageIcon;
    }
    if (attachment.mime_type.includes('pdf')) {
      return FileText;
    }
    return File;
  };

  const handleDelete = async (attachment: FileAttachment) => {
    try {
      setIsDeleting(attachment.id);
      const { error } = await deleteAttachment(attachment.id);
      
      if (error) {
        throw new Error(error);
      }

      onAttachmentDeleted?.(attachment.id);
      toast.success('Attachment deleted successfully');
    } catch (error) {
      toast.error(`Failed to delete attachment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleDownload = (attachment: FileAttachment) => {
    const link = document.createElement('a');
    link.href = attachment.public_url;
    link.download = attachment.file_name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInNewTab = (attachment: FileAttachment) => {
    window.open(attachment.public_url, '_blank');
  };

  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Paperclip className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">
          Attachments ({attachments.length})
        </span>
        {hasMoreAttachments && !compact && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 text-xs"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                Show All
              </>
            )}
          </Button>
        )}
      </div>

      {/* Attachments List */}
      <div className="space-y-2">
        {visibleAttachments.map((attachment) => {
          const FileIcon = getFileIcon(attachment);
          const isImage = attachment.mime_type.startsWith('image/');

          return (
            <Card key={attachment.id} className={cn(
              "transition-colors hover:bg-muted/50",
              compact ? "p-2" : "p-3"
            )}>
              <CardContent className="p-0">
                <div className="flex items-center gap-3">
                  {/* File Icon/Preview */}
                  <div className="flex-shrink-0">
                    {isImage ? (
                      <Dialog>
                        <DialogTrigger asChild>
                          <button className="group relative">
                            <img
                              src={attachment.public_url}
                              alt={attachment.file_name}
                              className={cn(
                                "rounded object-cover transition-opacity group-hover:opacity-80",
                                compact ? "h-8 w-8" : "h-10 w-10"
                              )}
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 rounded transition-colors">
                              <Eye className="h-3 w-3 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>{attachment.file_name}</DialogTitle>
                          </DialogHeader>
                          <div className="flex justify-center">
                            <img
                              src={attachment.public_url}
                              alt={attachment.file_name}
                              className="max-h-[70vh] max-w-full object-contain"
                            />
                          </div>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <div className={cn(
                        "rounded bg-muted flex items-center justify-center",
                        compact ? "h-8 w-8" : "h-10 w-10"
                      )}>
                        <FileIcon className={cn(
                          "text-muted-foreground",
                          compact ? "h-4 w-4" : "h-5 w-5"
                        )} />
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={cn(
                        "font-medium truncate",
                        compact ? "text-xs" : "text-sm"
                      )}>
                        {attachment.file_name}
                      </p>
                      {isImage && (
                        <Badge variant="secondary" className="text-xs">
                          Image
                        </Badge>
                      )}
                    </div>
                    
                    <div className={cn(
                      "flex items-center gap-2 text-muted-foreground",
                      compact ? "text-xs" : "text-xs"
                    )}>
                      <span>{fileUtils.formatFileSize(attachment.file_size)}</span>
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(attachment.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(attachment)}
                      className={cn(
                        compact ? "h-6 w-6 p-0" : "h-8 w-8 p-0"
                      )}
                      title="Download"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenInNewTab(attachment)}
                      className={cn(
                        compact ? "h-6 w-6 p-0" : "h-8 w-8 p-0"
                      )}
                      title="Open in new tab"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isDeleting === attachment.id}
                          className={cn(
                            "text-destructive hover:text-destructive hover:bg-destructive/10",
                            compact ? "h-6 w-6 p-0" : "h-8 w-8 p-0"
                          )}
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Attachment</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{attachment.file_name}"? 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(attachment)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Show More/Less for compact mode */}
      {hasMoreAttachments && compact && (
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                Show {attachments.length - maxVisible} More
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}