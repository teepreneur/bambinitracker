-- ============================================================
-- BAMBINI: Activity Table Enhancement
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Add new columns for enriched activity content
ALTER TABLE public.activities 
  ADD COLUMN IF NOT EXISTS extended_description TEXT,
  ADD COLUMN IF NOT EXISTS tips TEXT[],
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS source_references TEXT[],
  ADD COLUMN IF NOT EXISTS difficulty_level TEXT DEFAULT 'easy',
  ADD COLUMN IF NOT EXISTS estimated_duration_minutes INT DEFAULT 10,
  ADD COLUMN IF NOT EXISTS search_keywords TEXT[];

-- Grant permissions to service role (same pattern we used before)
GRANT ALL ON public.activities TO service_role;
GRANT ALL ON public.activities TO authenticated;
GRANT SELECT ON public.activities TO anon;
