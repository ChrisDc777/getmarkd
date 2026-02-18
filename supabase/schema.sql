-- ============================================================
-- Smart Bookmark App — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Create bookmarks table
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  url         TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast per-user queries
CREATE INDEX IF NOT EXISTS bookmarks_user_id_idx ON public.bookmarks (user_id);
CREATE INDEX IF NOT EXISTS bookmarks_created_at_idx ON public.bookmarks (created_at DESC);

-- ============================================================
-- 2. Enable Row Level Security
-- ============================================================
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. RLS Policies
-- ============================================================

-- SELECT: users can only read their own bookmarks
CREATE POLICY "Users can view own bookmarks"
  ON public.bookmarks
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: users can only insert rows where user_id matches their own UID
CREATE POLICY "Users can insert own bookmarks"
  ON public.bookmarks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- DELETE: users can only delete their own bookmarks
CREATE POLICY "Users can delete own bookmarks"
  ON public.bookmarks
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 4. Enable Realtime
-- ============================================================
-- Run this to add the table to the realtime publication:
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookmarks;
