-- Create note_attachments table
CREATE TABLE IF NOT EXISTS note_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  public_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint (assumes notes table exists)
-- ALTER TABLE note_attachments 
-- ADD CONSTRAINT fk_note_attachments_note_id 
-- FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_note_attachments_note_id ON note_attachments(note_id);
CREATE INDEX IF NOT EXISTS idx_note_attachments_created_at ON note_attachments(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE note_attachments ENABLE ROW LEVEL SECURITY;

-- Create policies for note_attachments
-- Note: These policies assume that the notes table has similar RLS policies
-- and that users can only access their own notes

-- Policy for viewing attachments
CREATE POLICY "Users can view their own note attachments" ON note_attachments
  FOR SELECT USING (
    note_id IN (
      SELECT id FROM notes WHERE user_id = auth.uid()
    )
  );

-- Policy for inserting attachments
CREATE POLICY "Users can insert attachments to their own notes" ON note_attachments
  FOR INSERT WITH CHECK (
    note_id IN (
      SELECT id FROM notes WHERE user_id = auth.uid()
    )
  );

-- Policy for updating attachments
CREATE POLICY "Users can update their own note attachments" ON note_attachments
  FOR UPDATE USING (
    note_id IN (
      SELECT id FROM notes WHERE user_id = auth.uid()
    )
  );

-- Policy for deleting attachments
CREATE POLICY "Users can delete their own note attachments" ON note_attachments
  FOR DELETE USING (
    note_id IN (
      SELECT id FROM notes WHERE user_id = auth.uid()
    )
  );

-- Create storage bucket for note attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'note-attachments',
  'note-attachments',
  true,
  10485760, -- 10MB limit
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'text/plain',
    'text/markdown',
    'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/json',
    'application/zip'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Create storage policies for note-attachments bucket
-- Policy for viewing files
CREATE POLICY "Users can view their own note attachment files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'note-attachments' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM notes WHERE user_id = auth.uid()
    )
  );

-- Policy for uploading files
CREATE POLICY "Users can upload files to their own notes" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'note-attachments' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM notes WHERE user_id = auth.uid()
    )
  );

-- Policy for updating files (if needed)
CREATE POLICY "Users can update their own note attachment files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'note-attachments' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM notes WHERE user_id = auth.uid()
    )
  );

-- Policy for deleting files
CREATE POLICY "Users can delete their own note attachment files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'note-attachments' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM notes WHERE user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_note_attachments_updated_at ON note_attachments;
CREATE TRIGGER update_note_attachments_updated_at
  BEFORE UPDATE ON note_attachments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();