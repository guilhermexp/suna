-- Migration: Add favorites functionality to threads
-- Adds is_favorite column to threads table to allow users to mark conversations as favorites

-- Add is_favorite column to threads table
ALTER TABLE threads ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;

-- Create index for efficient favorite queries
CREATE INDEX IF NOT EXISTS idx_threads_is_favorite ON threads(is_favorite) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS idx_threads_account_favorite ON threads(account_id, is_favorite, created_at DESC);

-- Update comment to reflect new functionality
COMMENT ON COLUMN threads.is_favorite IS 'Whether this thread is marked as a favorite by the user';

-- Add RLS policy for updating favorites (using existing thread policies)
-- No new policies needed as existing update policies will cover this field