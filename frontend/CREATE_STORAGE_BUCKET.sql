-- ================================================
-- EXECUTE ESTE SQL NO SUPABASE DASHBOARD
-- SQL Editor > New Query > Cole este código > Run
-- ================================================

-- Create storage bucket for note attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'note-attachments',
  'note-attachments',
  false,
  52428800, -- 50MB
  ARRAY[
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'text/markdown',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create storage policies for note-attachments bucket
CREATE POLICY "Users can upload attachments to own notes" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'note-attachments' 
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

CREATE POLICY "Users can view attachments in own notes" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'note-attachments'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

CREATE POLICY "Users can update own attachments" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'note-attachments' 
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

CREATE POLICY "Users can delete own attachments" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'note-attachments' 
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Storage bucket "note-attachments" created successfully!';
  RAISE NOTICE 'File size limit: 50MB';
  RAISE NOTICE 'RLS policies applied: Yes';
END $$;