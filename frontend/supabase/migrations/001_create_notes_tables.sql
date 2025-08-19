-- Migration: Create Notes System Tables
-- Description: Creates all necessary tables for the notes and chat functionality
-- Author: Suna Team
-- Date: 2024-12

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search
CREATE EXTENSION IF NOT EXISTS "vector"; -- For AI embeddings (optional)

-- ============================================
-- 1. NOTES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  content JSONB DEFAULT '{}'::jsonb, -- TipTap JSON format
  content_text TEXT, -- Plain text version for search
  is_starred BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  
  -- Metadata
  word_count INTEGER DEFAULT 0,
  reading_time INTEGER DEFAULT 0, -- in seconds
  last_accessed_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Additional metadata (flexible)
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for performance
CREATE INDEX idx_notes_user_id ON public.notes(user_id);
CREATE INDEX idx_notes_starred ON public.notes(is_starred) WHERE is_starred = true;
CREATE INDEX idx_notes_archived ON public.notes(is_archived) WHERE is_archived = true;
CREATE INDEX idx_notes_updated ON public.notes(updated_at DESC);
CREATE INDEX idx_notes_created ON public.notes(created_at DESC);

-- Full text search index (Portuguese and English)
CREATE INDEX idx_notes_search_pt ON public.notes 
  USING gin(to_tsvector('portuguese', coalesce(title, '') || ' ' || coalesce(content_text, '')));
CREATE INDEX idx_notes_search_en ON public.notes 
  USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content_text, '')));

-- Trigram index for fuzzy search
CREATE INDEX idx_notes_title_trgm ON public.notes USING gin(title gin_trgm_ops);

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
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, name)
);

CREATE INDEX idx_tags_user_id ON public.tags(user_id);
CREATE INDEX idx_tags_name ON public.tags(name);
CREATE INDEX idx_tags_usage ON public.tags(usage_count DESC);

-- ============================================
-- 3. NOTE_TAGS JUNCTION TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.note_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(note_id, tag_id)
);

CREATE INDEX idx_note_tags_note ON public.note_tags(note_id);
CREATE INDEX idx_note_tags_tag ON public.note_tags(tag_id);

-- ============================================
-- 4. NOTE MESSAGES (CHAT)
-- ============================================
CREATE TABLE IF NOT EXISTS public.note_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Message content
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'image', 'file', 'code', 'system')),
  
  -- For replies
  reply_to_id UUID REFERENCES public.note_messages(id) ON DELETE SET NULL,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  attachments JSONB DEFAULT '[]'::jsonb,
  
  -- Status
  is_edited BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_messages_note ON public.note_messages(note_id);
CREATE INDEX idx_messages_user ON public.note_messages(user_id);
CREATE INDEX idx_messages_created ON public.note_messages(created_at DESC);
CREATE INDEX idx_messages_reply ON public.note_messages(reply_to_id) WHERE reply_to_id IS NOT NULL;

-- ============================================
-- 5. MESSAGE REACTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES public.note_messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX idx_reactions_message ON public.message_reactions(message_id);
CREATE INDEX idx_reactions_user ON public.message_reactions(user_id);

-- ============================================
-- 6. NOTE SHARES
-- ============================================
CREATE TABLE IF NOT EXISTS public.note_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE NOT NULL,
  shared_with_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_email TEXT,
  
  -- Permissions
  permission TEXT NOT NULL DEFAULT 'view' CHECK (permission IN ('view', 'comment', 'edit')),
  
  -- Share link
  share_token UUID DEFAULT gen_random_uuid() UNIQUE,
  expires_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  accessed_at TIMESTAMPTZ,
  access_count INTEGER DEFAULT 0,
  
  UNIQUE(note_id, shared_with_user_id),
  UNIQUE(note_id, shared_with_email)
);

CREATE INDEX idx_shares_note ON public.note_shares(note_id);
CREATE INDEX idx_shares_user ON public.note_shares(shared_with_user_id);
CREATE INDEX idx_shares_token ON public.note_shares(share_token);
CREATE INDEX idx_shares_expires ON public.note_shares(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================
-- 7. NOTE ACTIVITY LOG
-- ============================================
CREATE TABLE IF NOT EXISTS public.note_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'created', 'updated', 'viewed', 'starred', 'unstarred', 
    'archived', 'unarchived', 'shared', 'unshared', 'deleted', 'restored'
  )),
  
  -- Optional: what changed
  changes JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activities_note ON public.note_activities(note_id);
CREATE INDEX idx_activities_user ON public.note_activities(user_id);
CREATE INDEX idx_activities_type ON public.note_activities(activity_type);
CREATE INDEX idx_activities_created ON public.note_activities(created_at DESC);

-- ============================================
-- 8. NOTE VERSIONS (HISTORY)
-- ============================================
CREATE TABLE IF NOT EXISTS public.note_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Versioned content
  title TEXT,
  content JSONB,
  content_text TEXT,
  
  -- Version info
  version_number INTEGER NOT NULL,
  change_summary TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_versions_note ON public.note_versions(note_id);
CREATE INDEX idx_versions_created ON public.note_versions(created_at DESC);
CREATE UNIQUE INDEX idx_versions_number ON public.note_versions(note_id, version_number);

-- ============================================
-- 9. USER PREFERENCES
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_note_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Editor preferences
  editor_font_size INTEGER DEFAULT 14,
  editor_font_family TEXT DEFAULT 'Inter',
  editor_theme TEXT DEFAULT 'light',
  editor_show_line_numbers BOOLEAN DEFAULT false,
  editor_word_wrap BOOLEAN DEFAULT true,
  
  -- UI preferences
  sidebar_width INTEGER DEFAULT 300,
  chat_position TEXT DEFAULT 'right' CHECK (chat_position IN ('right', 'bottom', 'floating')),
  chat_width INTEGER DEFAULT 400,
  
  -- Behavior preferences
  auto_save BOOLEAN DEFAULT true,
  auto_save_interval INTEGER DEFAULT 30, -- seconds
  spell_check BOOLEAN DEFAULT true,
  
  -- Notification preferences
  notify_on_share BOOLEAN DEFAULT true,
  notify_on_comment BOOLEAN DEFAULT true,
  notify_on_mention BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tags_updated_at BEFORE UPDATE ON public.tags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_preferences_updated_at BEFORE UPDATE ON public.user_note_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update tag usage count
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.tags SET usage_count = usage_count + 1 WHERE id = NEW.tag_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.tags SET usage_count = usage_count - 1 WHERE id = OLD.tag_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tag_usage_on_insert AFTER INSERT ON public.note_tags
  FOR EACH ROW EXECUTE FUNCTION update_tag_usage_count();

CREATE TRIGGER update_tag_usage_on_delete AFTER DELETE ON public.note_tags
  FOR EACH ROW EXECUTE FUNCTION update_tag_usage_count();

-- Log note activities
CREATE OR REPLACE FUNCTION log_note_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.note_activities (note_id, user_id, activity_type)
    VALUES (NEW.id, NEW.user_id, 'created');
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_starred != NEW.is_starred THEN
      INSERT INTO public.note_activities (note_id, user_id, activity_type)
      VALUES (NEW.id, NEW.user_id, CASE WHEN NEW.is_starred THEN 'starred' ELSE 'unstarred' END);
    END IF;
    IF OLD.is_archived != NEW.is_archived THEN
      INSERT INTO public.note_activities (note_id, user_id, activity_type)
      VALUES (NEW.id, NEW.user_id, CASE WHEN NEW.is_archived THEN 'archived' ELSE 'unarchived' END);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_note_activities_trigger AFTER INSERT OR UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION log_note_activity();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
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

-- Notes policies
CREATE POLICY "Users can view own notes" ON public.notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view shared notes" ON public.notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.note_shares 
      WHERE note_shares.note_id = notes.id 
      AND (note_shares.shared_with_user_id = auth.uid() OR note_shares.share_token IS NOT NULL)
    )
  );

CREATE POLICY "Users can insert own notes" ON public.notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes" ON public.notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can update shared notes with edit permission" ON public.notes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.note_shares 
      WHERE note_shares.note_id = notes.id 
      AND note_shares.shared_with_user_id = auth.uid()
      AND note_shares.permission = 'edit'
    )
  );

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
CREATE POLICY "Users can view messages in accessible notes" ON public.note_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.notes 
      WHERE notes.id = note_messages.note_id 
      AND (
        notes.user_id = auth.uid() 
        OR EXISTS (
          SELECT 1 FROM public.note_shares 
          WHERE note_shares.note_id = notes.id 
          AND note_shares.shared_with_user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can insert messages in accessible notes" ON public.note_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.notes 
      WHERE notes.id = note_messages.note_id 
      AND (
        notes.user_id = auth.uid() 
        OR EXISTS (
          SELECT 1 FROM public.note_shares 
          WHERE note_shares.note_id = notes.id 
          AND note_shares.shared_with_user_id = auth.uid()
          AND note_shares.permission IN ('comment', 'edit')
        )
      )
    )
  );

CREATE POLICY "Users can update own messages" ON public.note_messages
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages" ON public.note_messages
  FOR DELETE USING (auth.uid() = user_id);

-- Reactions policies
CREATE POLICY "Users can view reactions" ON public.message_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.note_messages 
      WHERE note_messages.id = message_reactions.message_id
      AND EXISTS (
        SELECT 1 FROM public.notes 
        WHERE notes.id = note_messages.note_id 
        AND (
          notes.user_id = auth.uid() 
          OR EXISTS (
            SELECT 1 FROM public.note_shares 
            WHERE note_shares.note_id = notes.id 
            AND note_shares.shared_with_user_id = auth.uid()
          )
        )
      )
    )
  );

CREATE POLICY "Users can manage own reactions" ON public.message_reactions
  FOR ALL USING (auth.uid() = user_id);

-- Shares policies
CREATE POLICY "Users can view shares of own notes" ON public.note_shares
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.notes 
      WHERE notes.id = note_shares.note_id 
      AND notes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view shares shared with them" ON public.note_shares
  FOR SELECT USING (shared_with_user_id = auth.uid());

CREATE POLICY "Users can manage shares of own notes" ON public.note_shares
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.notes 
      WHERE notes.id = note_shares.note_id 
      AND notes.user_id = auth.uid()
    )
  );

-- Activities policies
CREATE POLICY "Users can view activities of accessible notes" ON public.note_activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.notes 
      WHERE notes.id = note_activities.note_id 
      AND (
        notes.user_id = auth.uid() 
        OR EXISTS (
          SELECT 1 FROM public.note_shares 
          WHERE note_shares.note_id = notes.id 
          AND note_shares.shared_with_user_id = auth.uid()
        )
      )
    )
  );

-- Versions policies
CREATE POLICY "Users can view versions of accessible notes" ON public.note_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.notes 
      WHERE notes.id = note_versions.note_id 
      AND (
        notes.user_id = auth.uid() 
        OR EXISTS (
          SELECT 1 FROM public.note_shares 
          WHERE note_shares.note_id = notes.id 
          AND note_shares.shared_with_user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can insert versions of own notes" ON public.note_versions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.notes 
      WHERE notes.id = note_versions.note_id 
      AND notes.user_id = auth.uid()
    )
  );

-- Preferences policies
CREATE POLICY "Users can manage own preferences" ON public.user_note_preferences
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- ============================================

-- Enable realtime for notes
ALTER PUBLICATION supabase_realtime ADD TABLE public.notes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.note_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.note_shares;

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Create storage bucket for note attachments
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'note-attachments',
  'note-attachments',
  false,
  false,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'text/markdown', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload attachments to own notes" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'note-attachments' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view attachments in accessible notes" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'note-attachments'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR EXISTS (
        SELECT 1 FROM public.note_shares 
        WHERE note_shares.note_id::text = (storage.foldername(name))[2]
        AND note_shares.shared_with_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete own attachments" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'note-attachments' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================
-- INDEXES FOR PERFORMANCE MONITORING
-- ============================================

-- Create index for monitoring slow queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notes_user_updated 
  ON public.notes(user_id, updated_at DESC);

-- Create partial index for active notes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notes_active 
  ON public.notes(user_id, updated_at DESC) 
  WHERE is_archived = false AND is_deleted = false;

-- ============================================
-- FUNCTIONS FOR COMMON OPERATIONS
-- ============================================

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
    ts_rank(
      to_tsvector('portuguese', coalesce(n.title, '') || ' ' || coalesce(n.content_text, '')),
      plainto_tsquery('portuguese', search_query)
    ) as rank
  FROM public.notes n
  WHERE 
    n.user_id = user_uuid
    AND n.is_deleted = false
    AND (
      to_tsvector('portuguese', coalesce(n.title, '') || ' ' || coalesce(n.content_text, '')) 
      @@ plainto_tsquery('portuguese', search_query)
      OR n.title ILIKE '%' || search_query || '%'
    )
  ORDER BY rank DESC, n.updated_at DESC
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
  total_shares BIGINT,
  total_messages BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT n.id) as total_notes,
    COUNT(DISTINCT n.id) FILTER (WHERE n.is_starred) as starred_notes,
    COUNT(DISTINCT n.id) FILTER (WHERE n.is_archived) as archived_notes,
    COUNT(DISTINCT t.id) as total_tags,
    COUNT(DISTINCT s.id) as total_shares,
    COUNT(DISTINCT m.id) as total_messages
  FROM public.notes n
  LEFT JOIN public.tags t ON t.user_id = user_uuid
  LEFT JOIN public.note_shares s ON s.note_id = n.id
  LEFT JOIN public.note_messages m ON m.note_id = n.id
  WHERE n.user_id = user_uuid AND n.is_deleted = false;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant permissions to authenticated users
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant permissions to service role (for backend)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ============================================
-- SEED DATA (OPTIONAL)
-- ============================================

-- Insert default tags for new users (triggered on user creation)
CREATE OR REPLACE FUNCTION create_default_tags_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.tags (user_id, name, color, icon) VALUES
    (NEW.id, 'pessoal', '#EF4444', '👤'),
    (NEW.id, 'trabalho', '#3B82F6', '💼'),
    (NEW.id, 'ideias', '#F59E0B', '💡'),
    (NEW.id, 'importante', '#DC2626', '⭐'),
    (NEW.id, 'rascunho', '#6B7280', '📝')
  ON CONFLICT DO NOTHING;
  
  -- Create default preferences
  INSERT INTO public.user_note_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default tags when a new user is created
CREATE TRIGGER create_user_defaults 
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_default_tags_for_user();

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Add comment to track migration
COMMENT ON SCHEMA public IS 'Notes and Chat system - Migration v1.0.0 - Created 2024-12';