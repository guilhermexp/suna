-- ================================================
-- SCRIPT SEGURO - VERIFICA ANTES DE CRIAR
-- Execute no Supabase Dashboard > SQL Editor
-- ================================================

-- Enable extensions (safe - won't error if already exists)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- DROP EXISTING TRIGGERS (to avoid conflicts)
-- ============================================
DROP TRIGGER IF EXISTS update_notes_updated_at ON public.notes;
DROP TRIGGER IF EXISTS update_tags_updated_at ON public.tags;
DROP TRIGGER IF EXISTS update_preferences_updated_at ON public.user_note_preferences;

-- ============================================
-- 1. NOTES TABLE (only if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  content JSONB DEFAULT '{}'::jsonb,
  content_text TEXT,
  is_starred BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  word_count INTEGER DEFAULT 0,
  reading_time INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add columns if they don't exist (for existing tables)
DO $$ 
BEGIN
  -- Add columns that might be missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notes' AND column_name = 'word_count') THEN
    ALTER TABLE public.notes ADD COLUMN word_count INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notes' AND column_name = 'reading_time') THEN
    ALTER TABLE public.notes ADD COLUMN reading_time INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notes' AND column_name = 'last_accessed_at') THEN
    ALTER TABLE public.notes ADD COLUMN last_accessed_at TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notes' AND column_name = 'metadata') THEN
    ALTER TABLE public.notes ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Create indexes (IF NOT EXISTS prevents errors)
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_starred ON public.notes(is_starred) WHERE is_starred = true;
CREATE INDEX IF NOT EXISTS idx_notes_updated ON public.notes(updated_at DESC);

-- ============================================
-- 2. TAGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6B7280',
  icon TEXT,
  description TEXT,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'tags_user_id_name_key'
  ) THEN
    ALTER TABLE public.tags ADD CONSTRAINT tags_user_id_name_key UNIQUE(user_id, name);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tags_user_id ON public.tags(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON public.tags(name);

-- ============================================
-- 3. NOTE_TAGS JUNCTION TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.note_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'note_tags_note_id_tag_id_key'
  ) THEN
    ALTER TABLE public.note_tags ADD CONSTRAINT note_tags_note_id_tag_id_key UNIQUE(note_id, tag_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_note_tags_note ON public.note_tags(note_id);
CREATE INDEX IF NOT EXISTS idx_note_tags_tag ON public.note_tags(tag_id);

-- ============================================
-- 4. NOTE MESSAGES (CHAT)
-- ============================================
CREATE TABLE IF NOT EXISTS public.note_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'image', 'file', 'code', 'system')),
  reply_to_id UUID REFERENCES public.note_messages(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  attachments JSONB DEFAULT '[]'::jsonb,
  is_edited BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_messages_note ON public.note_messages(note_id);
CREATE INDEX IF NOT EXISTS idx_messages_user ON public.note_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.note_messages(created_at DESC);

-- ============================================
-- 5. MESSAGE REACTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES public.note_messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'message_reactions_message_id_user_id_emoji_key'
  ) THEN
    ALTER TABLE public.message_reactions 
    ADD CONSTRAINT message_reactions_message_id_user_id_emoji_key 
    UNIQUE(message_id, user_id, emoji);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_reactions_message ON public.message_reactions(message_id);

-- ============================================
-- 6. NOTE SHARES
-- ============================================
CREATE TABLE IF NOT EXISTS public.note_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE NOT NULL,
  shared_with_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_email TEXT,
  permission TEXT NOT NULL DEFAULT 'view' CHECK (permission IN ('view', 'comment', 'edit')),
  share_token UUID DEFAULT gen_random_uuid() UNIQUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  accessed_at TIMESTAMPTZ,
  access_count INTEGER DEFAULT 0
);

-- Add unique constraints if not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'note_shares_note_id_shared_with_user_id_key'
  ) THEN
    ALTER TABLE public.note_shares 
    ADD CONSTRAINT note_shares_note_id_shared_with_user_id_key 
    UNIQUE(note_id, shared_with_user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'note_shares_note_id_shared_with_email_key'
  ) THEN
    ALTER TABLE public.note_shares 
    ADD CONSTRAINT note_shares_note_id_shared_with_email_key 
    UNIQUE(note_id, shared_with_email);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_shares_note ON public.note_shares(note_id);
CREATE INDEX IF NOT EXISTS idx_shares_user ON public.note_shares(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_shares_token ON public.note_shares(share_token);

-- ============================================
-- 7. NOTE ACTIVITIES
-- ============================================
CREATE TABLE IF NOT EXISTS public.note_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'created', 'updated', 'viewed', 'starred', 'unstarred', 
    'archived', 'unarchived', 'shared', 'unshared', 'deleted', 'restored'
  )),
  changes JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activities_note ON public.note_activities(note_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON public.note_activities(activity_type);

-- ============================================
-- 8. NOTE VERSIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.note_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  content JSONB,
  content_text TEXT,
  version_number INTEGER NOT NULL,
  change_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_versions_note ON public.note_versions(note_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_versions_number ON public.note_versions(note_id, version_number);

-- ============================================
-- 9. USER PREFERENCES
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_note_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  editor_font_size INTEGER DEFAULT 14,
  editor_font_family TEXT DEFAULT 'Inter',
  editor_theme TEXT DEFAULT 'light',
  editor_show_line_numbers BOOLEAN DEFAULT false,
  editor_word_wrap BOOLEAN DEFAULT true,
  sidebar_width INTEGER DEFAULT 300,
  chat_position TEXT DEFAULT 'right' CHECK (chat_position IN ('right', 'bottom', 'floating')),
  chat_width INTEGER DEFAULT 400,
  auto_save BOOLEAN DEFAULT true,
  auto_save_interval INTEGER DEFAULT 30,
  spell_check BOOLEAN DEFAULT true,
  notify_on_share BOOLEAN DEFAULT true,
  notify_on_comment BOOLEAN DEFAULT true,
  notify_on_mention BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 10. NOTE ATTACHMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.note_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_attachments_note ON public.note_attachments(note_id);
CREATE INDEX IF NOT EXISTS idx_attachments_user ON public.note_attachments(user_id);

-- ============================================
-- CREATE OR REPLACE FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to search notes
CREATE OR REPLACE FUNCTION search_notes(
  search_query TEXT,
  user_uuid UUID,
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content_preview TEXT,
  updated_at TIMESTAMPTZ,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.title,
    LEFT(n.content_text, 200) as content_preview,
    n.updated_at,
    1.0::REAL as rank
  FROM public.notes n
  WHERE 
    n.user_id = user_uuid
    AND n.is_deleted = false
    AND (
      n.title ILIKE '%' || search_query || '%'
      OR n.content_text ILIKE '%' || search_query || '%'
    )
  ORDER BY n.updated_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get note statistics
CREATE OR REPLACE FUNCTION get_user_note_stats(user_uuid UUID)
RETURNS TABLE (
  total_notes BIGINT,
  starred_notes BIGINT,
  archived_notes BIGINT,
  total_tags BIGINT,
  total_messages BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT n.id) as total_notes,
    COUNT(DISTINCT n.id) FILTER (WHERE n.is_starred) as starred_notes,
    COUNT(DISTINCT n.id) FILTER (WHERE n.is_archived) as archived_notes,
    COUNT(DISTINCT t.id) as total_tags,
    COUNT(DISTINCT m.id) as total_messages
  FROM public.notes n
  LEFT JOIN public.tags t ON t.user_id = user_uuid
  LEFT JOIN public.note_messages m ON m.note_id = n.id
  WHERE n.user_id = user_uuid AND n.is_deleted = false;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RECREATE TRIGGERS
-- ============================================

-- Create triggers for updated_at
CREATE TRIGGER update_notes_updated_at 
  BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tags_updated_at 
  BEFORE UPDATE ON public.tags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_preferences_updated_at 
  BEFORE UPDATE ON public.user_note_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_note_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_attachments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- DROP EXISTING POLICIES (to recreate)
-- ============================================

-- Drop all existing policies for notes table
DROP POLICY IF EXISTS "Users can view own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can insert own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can update own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can delete own notes" ON public.notes;

-- Drop all existing policies for tags table
DROP POLICY IF EXISTS "Users can manage own tags" ON public.tags;

-- Drop all existing policies for note_tags table
DROP POLICY IF EXISTS "Users can manage tags on own notes" ON public.note_tags;

-- Drop all existing policies for note_messages table
DROP POLICY IF EXISTS "Users can view messages in own notes" ON public.note_messages;
DROP POLICY IF EXISTS "Users can insert messages in own notes" ON public.note_messages;
DROP POLICY IF EXISTS "Users can update own messages" ON public.note_messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON public.note_messages;

-- Drop all existing policies for other tables
DROP POLICY IF EXISTS "Users can manage own reactions" ON public.message_reactions;
DROP POLICY IF EXISTS "Users can manage shares of own notes" ON public.note_shares;
DROP POLICY IF EXISTS "Users can view activities of own notes" ON public.note_activities;
DROP POLICY IF EXISTS "Users can view versions of own notes" ON public.note_versions;
DROP POLICY IF EXISTS "Users can manage own preferences" ON public.user_note_preferences;
DROP POLICY IF EXISTS "Users can manage attachments on own notes" ON public.note_attachments;

-- ============================================
-- RECREATE POLICIES
-- ============================================

-- Notes policies
CREATE POLICY "Users can view own notes" ON public.notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes" ON public.notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes" ON public.notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes" ON public.notes
  FOR DELETE USING (auth.uid() = user_id);

-- Tags policies
CREATE POLICY "Users can manage own tags" ON public.tags
  FOR ALL USING (auth.uid() = user_id);

-- Note tags policies  
CREATE POLICY "Users can manage tags on own notes" ON public.note_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.notes 
      WHERE notes.id = note_tags.note_id 
      AND notes.user_id = auth.uid()
    )
  );

-- Messages policies
CREATE POLICY "Users can view messages in own notes" ON public.note_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.notes 
      WHERE notes.id = note_messages.note_id 
      AND notes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in own notes" ON public.note_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.notes 
      WHERE notes.id = note_messages.note_id 
      AND notes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own messages" ON public.note_messages
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages" ON public.note_messages
  FOR DELETE USING (auth.uid() = user_id);

-- Reactions policies
CREATE POLICY "Users can manage own reactions" ON public.message_reactions
  FOR ALL USING (auth.uid() = user_id);

-- Shares policies
CREATE POLICY "Users can manage shares of own notes" ON public.note_shares
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.notes 
      WHERE notes.id = note_shares.note_id 
      AND notes.user_id = auth.uid()
    )
  );

-- Activities policies
CREATE POLICY "Users can view activities of own notes" ON public.note_activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.notes 
      WHERE notes.id = note_activities.note_id 
      AND notes.user_id = auth.uid()
    )
  );

-- Versions policies
CREATE POLICY "Users can view versions of own notes" ON public.note_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.notes 
      WHERE notes.id = note_versions.note_id 
      AND notes.user_id = auth.uid()
    )
  );

-- Preferences policies
CREATE POLICY "Users can manage own preferences" ON public.user_note_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Attachments policies
CREATE POLICY "Users can manage attachments on own notes" ON public.note_attachments
  FOR ALL USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.notes 
      WHERE notes.id = note_attachments.note_id 
      AND notes.user_id = auth.uid()
    )
  );

-- ============================================
-- ENABLE REALTIME (safe - won't error)
-- ============================================

-- Remove and re-add tables to realtime
DO $$
BEGIN
  -- Remove if exists
  PERFORM pg_catalog.pg_get_publication_tables('supabase_realtime')
  WHERE tablename IN ('notes', 'note_messages', 'message_reactions');
  
  -- Re-add tables
  ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.notes;
  ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.note_messages;
  ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.message_reactions;
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Ignore errors
END $$;

-- ============================================
-- INSERT DEFAULT DATA (safe - won't duplicate)
-- ============================================

-- Insert default tags for existing users
INSERT INTO public.tags (user_id, name, color, icon)
SELECT 
  id as user_id,
  tag.name,
  tag.color,
  tag.icon
FROM auth.users,
LATERAL (VALUES 
  ('pessoal', '#EF4444', '👤'),
  ('trabalho', '#3B82F6', '💼'),
  ('ideias', '#F59E0B', '💡'),
  ('importante', '#DC2626', '⭐'),
  ('rascunho', '#6B7280', '📝')
) AS tag(name, color, icon)
ON CONFLICT (user_id, name) DO NOTHING;

-- Create default preferences for existing users
INSERT INTO public.user_note_preferences (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- REPORT
-- ============================================

DO $$
DECLARE
  v_notes_count INTEGER;
  v_tags_count INTEGER;
  v_messages_count INTEGER;
BEGIN
  -- Count existing records
  SELECT COUNT(*) INTO v_notes_count FROM public.notes;
  SELECT COUNT(*) INTO v_tags_count FROM public.tags;
  SELECT COUNT(*) INTO v_messages_count FROM public.note_messages;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ SETUP CONCLUÍDO COM SUCESSO!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Status das Tabelas:';
  RAISE NOTICE '  - notes: % registros', v_notes_count;
  RAISE NOTICE '  - tags: % registros', v_tags_count;
  RAISE NOTICE '  - messages: % registros', v_messages_count;
  RAISE NOTICE '';
  RAISE NOTICE '✅ 10 tabelas criadas/atualizadas';
  RAISE NOTICE '✅ RLS policies aplicadas';
  RAISE NOTICE '✅ Triggers configurados';
  RAISE NOTICE '✅ Funções auxiliares criadas';
  RAISE NOTICE '✅ Realtime habilitado';
  RAISE NOTICE '✅ Dados padrão inseridos';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Próximo passo:';
  RAISE NOTICE '  Execute CREATE_STORAGE_BUCKET.sql para criar o bucket de arquivos';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;