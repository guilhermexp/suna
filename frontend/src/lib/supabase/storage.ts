import { createClient } from './client';

export interface UploadOptions {
  bucket: string;
  path: string;
  file: File;
  upsert?: boolean;
  metadata?: Record<string, string>;
}

export interface UploadResult {
  data: {
    path: string;
    fullPath: string;
    publicUrl: string;
  } | null;
  error: string | null;
}

export interface FileAttachment {
  id: string;
  note_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  public_url: string;
  created_at: string;
  updated_at: string;
}

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile({
  bucket,
  path,
  file,
  upsert = false,
  metadata = {}
}: UploadOptions): Promise<UploadResult> {
  try {
    const supabase = createClient();

    // Upload file to storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        upsert,
        metadata: {
          ...metadata,
          originalName: file.name,
          size: file.size.toString(),
          mimeType: file.type,
        }
      });

    if (error) {
      console.error('Upload error:', error);
      return { data: null, error: error.message };
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      data: {
        path: data.path,
        fullPath: data.fullPath,
        publicUrl: publicUrlData.publicUrl
      },
      error: null
    };
  } catch (error) {
    console.error('Upload error:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Upload failed' 
    };
  }
}

/**
 * Upload multiple files
 */
export async function uploadMultipleFiles(
  files: File[],
  bucket: string,
  basePath: string,
  options?: {
    onProgress?: (index: number, total: number, file: File) => void;
    onFileComplete?: (file: File, result: UploadResult) => void;
    onError?: (file: File, error: string) => void;
  }
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    options?.onProgress?.(i, files.length, file);

    // Generate unique file path
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2);
    const extension = file.name.split('.').pop();
    const fileName = `${timestamp}-${randomId}.${extension}`;
    const filePath = `${basePath}/${fileName}`;

    const result = await uploadFile({
      bucket,
      path: filePath,
      file,
      upsert: false
    });

    results.push(result);

    if (result.error) {
      options?.onError?.(file, result.error);
    } else {
      options?.onFileComplete?.(file, result);
    }
  }

  return results;
}

/**
 * Delete a file from storage
 */
export async function deleteFile(bucket: string, path: string): Promise<{ error: string | null }> {
  try {
    const supabase = createClient();
    
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Delete error:', error);
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    console.error('Delete error:', error);
    return { 
      error: error instanceof Error ? error.message : 'Delete failed' 
    };
  }
}

/**
 * Get file info and public URL
 */
export async function getFileInfo(bucket: string, path: string) {
  try {
    const supabase = createClient();

    // Get file info
    const { data: files, error: listError } = await supabase.storage
      .from(bucket)
      .list(path.split('/').slice(0, -1).join('/'), {
        search: path.split('/').pop()
      });

    if (listError || !files?.length) {
      return { data: null, error: listError?.message || 'File not found' };
    }

    const file = files[0];

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return {
      data: {
        name: file.name,
        size: file.metadata?.size,
        mimeType: file.metadata?.mimetype,
        lastModified: file.updated_at,
        publicUrl: publicUrlData.publicUrl
      },
      error: null
    };
  } catch (error) {
    console.error('Get file info error:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Failed to get file info' 
    };
  }
}

/**
 * Save attachment record to database
 */
export async function saveAttachment(attachment: Omit<FileAttachment, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: FileAttachment | null; error: string | null }> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('note_attachments')
      .insert(attachment)
      .select()
      .single();

    if (error) {
      console.error('Save attachment error:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Save attachment error:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Failed to save attachment' 
    };
  }
}

/**
 * Get attachments for a note
 */
export async function getNoteAttachments(noteId: string): Promise<{ data: FileAttachment[] | null; error: string | null }> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('note_attachments')
      .select('*')
      .eq('note_id', noteId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Get attachments error:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Get attachments error:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Failed to get attachments' 
    };
  }
}

/**
 * Delete attachment record and file
 */
export async function deleteAttachment(attachmentId: string): Promise<{ error: string | null }> {
  try {
    const supabase = createClient();

    // Get attachment info first
    const { data: attachment, error: getError } = await supabase
      .from('note_attachments')
      .select('*')
      .eq('id', attachmentId)
      .single();

    if (getError || !attachment) {
      return { error: getError?.message || 'Attachment not found' };
    }

    // Delete file from storage
    const { error: storageError } = await deleteFile('note-attachments', attachment.file_path);
    
    if (storageError) {
      console.error('Storage delete error:', storageError);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete record from database
    const { error: dbError } = await supabase
      .from('note_attachments')
      .delete()
      .eq('id', attachmentId);

    if (dbError) {
      console.error('Database delete error:', dbError);
      return { error: dbError.message };
    }

    return { error: null };
  } catch (error) {
    console.error('Delete attachment error:', error);
    return { 
      error: error instanceof Error ? error.message : 'Failed to delete attachment' 
    };
  }
}

/**
 * Upload file and save attachment record
 */
export async function uploadNoteAttachment(
  file: File,
  noteId: string,
  options?: {
    onProgress?: (progress: number) => void;
  }
): Promise<{ data: FileAttachment | null; error: string | null }> {
  try {
    options?.onProgress?.(0);

    // Generate unique file path
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2);
    const extension = file.name.split('.').pop();
    const fileName = `${timestamp}-${randomId}.${extension}`;
    const filePath = `${noteId}/${fileName}`;

    options?.onProgress?.(25);

    // Upload file to storage
    const uploadResult = await uploadFile({
      bucket: 'note-attachments',
      path: filePath,
      file,
      upsert: false
    });

    if (uploadResult.error || !uploadResult.data) {
      return { data: null, error: uploadResult.error || 'Upload failed' };
    }

    options?.onProgress?.(75);

    // Save attachment record
    const attachmentData = {
      note_id: noteId,
      file_name: file.name,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type,
      public_url: uploadResult.data.publicUrl
    };

    const { data: attachment, error: saveError } = await saveAttachment(attachmentData);

    if (saveError || !attachment) {
      // If database save fails, try to cleanup uploaded file
      await deleteFile('note-attachments', filePath);
      return { data: null, error: saveError || 'Failed to save attachment record' };
    }

    options?.onProgress?.(100);

    return { data: attachment, error: null };
  } catch (error) {
    console.error('Upload note attachment error:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Failed to upload attachment' 
    };
  }
}

/**
 * Utility functions for file handling
 */
export const fileUtils = {
  /**
   * Check if file is an image
   */
  isImage: (file: File): boolean => {
    return file.type.startsWith('image/');
  },

  /**
   * Check if file type is allowed
   */
  isAllowedType: (file: File, allowedTypes: string[]): boolean => {
    return allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -1));
      }
      return file.type === type;
    });
  },

  /**
   * Format file size
   */
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * Get file extension
   */
  getFileExtension: (fileName: string): string => {
    return fileName.split('.').pop()?.toLowerCase() || '';
  },

  /**
   * Generate thumbnail for image files
   */
  generateThumbnail: (file: File, maxWidth = 200, maxHeight = 200): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!fileUtils.isImage(file)) {
        reject(new Error('File is not an image'));
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw image on canvas
        ctx?.drawImage(img, 0, 0, width, height);

        // Convert to data URL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataUrl);
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = URL.createObjectURL(file);
    });
  }
};