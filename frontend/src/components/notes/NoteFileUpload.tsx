'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Upload,
  X,
  File,
  Image as ImageIcon,
  FileText,
  AlertCircle,
  Check,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { uploadNoteAttachment, fileUtils, type FileAttachment } from '@/lib/supabase/storage';
import { toast } from 'sonner';

interface FileUploadItem {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  attachment?: FileAttachment;
  preview?: string;
}

interface NoteFileUploadProps {
  noteId: string;
  onFileUploaded?: (attachment: FileAttachment) => void;
  onError?: (error: string) => void;
  className?: string;
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  allowedTypes?: string[];
  showPreviews?: boolean;
  disabled?: boolean;
}

const defaultAllowedTypes = [
  'image/*',
  'application/pdf',
  'text/*',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

export function NoteFileUpload({
  noteId,
  onFileUploaded,
  onError,
  className,
  maxFiles = 10,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  allowedTypes = defaultAllowedTypes,
  showPreviews = true,
  disabled = false
}: NoteFileUploadProps) {
  const [uploadItems, setUploadItems] = useState<FileUploadItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate preview for image files
  const generatePreview = useCallback(async (file: File): Promise<string | undefined> => {
    if (!fileUtils.isImage(file) || !showPreviews) return undefined;

    try {
      return await fileUtils.generateThumbnail(file);
    } catch (error) {
      console.error('Failed to generate preview:', error);
      return undefined;
    }
  }, [showPreviews]);

  // Validate files
  const validateFiles = useCallback((files: File[]): { valid: File[]; invalid: { file: File; reason: string }[] } => {
    const valid: File[] = [];
    const invalid: { file: File; reason: string }[] = [];

    for (const file of files) {
      // Check file size
      if (file.size > maxFileSize) {
        invalid.push({
          file,
          reason: `File size exceeds ${fileUtils.formatFileSize(maxFileSize)}`
        });
        continue;
      }

      // Check file type
      if (!fileUtils.isAllowedType(file, allowedTypes)) {
        invalid.push({
          file,
          reason: 'File type not allowed'
        });
        continue;
      }

      valid.push(file);
    }

    // Check total files limit
    const currentFiles = uploadItems.length;
    const totalFiles = currentFiles + valid.length;
    
    if (totalFiles > maxFiles) {
      const allowedCount = maxFiles - currentFiles;
      const excess = valid.splice(allowedCount);
      
      excess.forEach(file => {
        invalid.push({
          file,
          reason: `Maximum ${maxFiles} files allowed`
        });
      });
    }

    return { valid, invalid };
  }, [maxFileSize, allowedTypes, maxFiles, uploadItems.length]);

  // Add files to upload queue
  const addFiles = useCallback(async (files: File[]) => {
    if (disabled) return;

    const { valid, invalid } = validateFiles(files);

    // Show errors for invalid files
    invalid.forEach(({ file, reason }) => {
      toast.error(`${file.name}: ${reason}`);
      onError?.(reason);
    });

    if (valid.length === 0) return;

    // Create upload items
    const newItems: FileUploadItem[] = await Promise.all(
      valid.map(async (file) => {
        const preview = await generatePreview(file);
        return {
          file,
          id: Math.random().toString(36).substring(2),
          progress: 0,
          status: 'pending' as const,
          preview
        };
      })
    );

    setUploadItems(prev => [...prev, ...newItems]);

    // Start uploading
    newItems.forEach(item => {
      uploadFile(item);
    });
  }, [disabled, validateFiles, generatePreview, onError]);

  // Upload a single file
  const uploadFile = useCallback(async (item: FileUploadItem) => {
    try {
      // Update status to uploading
      setUploadItems(prev =>
        prev.map(i => 
          i.id === item.id 
            ? { ...i, status: 'uploading' }
            : i
        )
      );

      const { data: attachment, error } = await uploadNoteAttachment(
        item.file,
        noteId,
        {
          onProgress: (progress) => {
            setUploadItems(prev =>
              prev.map(i =>
                i.id === item.id
                  ? { ...i, progress }
                  : i
              )
            );
          }
        }
      );

      if (error || !attachment) {
        throw new Error(error || 'Upload failed');
      }

      // Update status to completed
      setUploadItems(prev =>
        prev.map(i =>
          i.id === item.id
            ? { ...i, status: 'completed', attachment, progress: 100 }
            : i
        )
      );

      onFileUploaded?.(attachment);
      toast.success(`${item.file.name} uploaded successfully`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      // Update status to error
      setUploadItems(prev =>
        prev.map(i =>
          i.id === item.id
            ? { ...i, status: 'error', error: errorMessage }
            : i
        )
      );

      toast.error(`Failed to upload ${item.file.name}: ${errorMessage}`);
      onError?.(errorMessage);
    }
  }, [noteId, onFileUploaded, onError]);

  // Remove upload item
  const removeItem = useCallback((itemId: string) => {
    setUploadItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  // Handle file input change
  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      addFiles(files);
    }
    // Reset input value to allow same file selection
    event.target.value = '';
  }, [addFiles]);

  // Handle drag events
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);

    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
      addFiles(files);
    }
  }, [addFiles]);

  // Open file dialog
  const openFileDialog = useCallback(() => {
    if (disabled) return;
    fileInputRef.current?.click();
  }, [disabled]);

  // Get file icon
  const getFileIcon = useCallback((file: File) => {
    if (fileUtils.isImage(file)) {
      return ImageIcon;
    }
    if (file.type.includes('pdf')) {
      return FileText;
    }
    return File;
  }, []);

  // Get status icon
  const getStatusIcon = useCallback((status: FileUploadItem['status']) => {
    switch (status) {
      case 'uploading':
        return Loader2;
      case 'completed':
        return Check;
      case 'error':
        return AlertCircle;
      default:
        return Upload;
    }
  }, []);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop Zone */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm font-medium mb-1">
          {isDragOver ? 'Drop files here' : 'Click to upload or drag and drop'}
        </p>
        <p className="text-xs text-muted-foreground">
          Maximum {maxFiles} files, up to {fileUtils.formatFileSize(maxFileSize)} each
        </p>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={allowedTypes.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Upload Items */}
      {uploadItems.length > 0 && (
        <div className="space-y-2">
          {uploadItems.map((item) => {
            const FileIcon = getFileIcon(item.file);
            const StatusIcon = getStatusIcon(item.status);

            return (
              <Card key={item.id} className="p-3">
                <CardContent className="p-0">
                  <div className="flex items-center gap-3">
                    {/* File Preview or Icon */}
                    <div className="flex-shrink-0">
                      {item.preview ? (
                        <img
                          src={item.preview}
                          alt={item.file.name}
                          className="h-10 w-10 rounded object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                          <FileIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium truncate">
                          {item.file.name}
                        </p>
                        <Badge
                          variant={
                            item.status === 'completed' ? 'default' :
                            item.status === 'error' ? 'destructive' :
                            'secondary'
                          }
                          className="text-xs"
                        >
                          <StatusIcon className={cn(
                            "h-3 w-3 mr-1",
                            item.status === 'uploading' && "animate-spin"
                          )} />
                          {item.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{fileUtils.formatFileSize(item.file.size)}</span>
                        {item.status === 'error' && item.error && (
                          <span className="text-destructive">• {item.error}</span>
                        )}
                      </div>

                      {/* Progress Bar */}
                      {(item.status === 'uploading' || item.status === 'completed') && (
                        <Progress 
                          value={item.progress} 
                          className="h-1 mt-2"
                        />
                      )}
                    </div>

                    {/* Remove Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeItem(item.id);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Quick Actions */}
      {uploadItems.length === 0 && (
        <div className="flex gap-2 justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={openFileDialog}
            disabled={disabled}
          >
            <Upload className="h-4 w-4 mr-2" />
            Choose Files
          </Button>
        </div>
      )}
    </div>
  );
}