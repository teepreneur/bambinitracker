-- Storage best-practice patch for the 'observations' bucket.
-- Run in Supabase Dashboard → SQL Editor (or `npx supabase db execute` once linked).
--
-- Idempotent: safe to run multiple times.
--
-- 1. Guarantees the bucket exists (in case observations_bucket.sql never ran).
-- 2. Replaces root-wide policies with user-folder-scoped ones.
--    Uploads must now go to  <user-id>/...  paths (lib/storage.ts does this).
--
-- Privacy note for reviewers: SELECT stays public because activity photos are
-- rendered via getPublicUrl() in the app. Swapping to signed URLs on a private
-- bucket is the stronger privacy option if/when a decision is made.

-- 1. Bucket upsert -----------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('observations', 'observations', true)
ON CONFLICT (id) DO UPDATE SET public = TRUE;

-- 2. Reset policies ----------------------------------------------------------
DROP POLICY IF EXISTS "Public Access"       ON storage.objects;
DROP POLICY IF EXISTS "Auth Upload"         ON storage.objects;
DROP POLICY IF EXISTS "Auth Update Delete"  ON storage.objects;
DROP POLICY IF EXISTS "Auth Delete"         ON storage.objects;
DROP POLICY IF EXISTS "Public read observations"       ON storage.objects;
DROP POLICY IF EXISTS "User upload own folder"         ON storage.objects;
DROP POLICY IF EXISTS "User update own folder"         ON storage.objects;
DROP POLICY IF EXISTS "User delete own folder"         ON storage.objects;

-- Anyone can view (app renders <Image source={publicUrl}> from any device).
CREATE POLICY "Public read observations"
    ON storage.objects FOR SELECT
    USING ( bucket_id = 'observations' );

-- Uploads are scoped to the caller's own top-level folder: <auth.uid>/...
-- Any authenticated user matching a JWT; anon uploads rejected.
CREATE POLICY "User upload own folder"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'observations'
        AND (storage.foldername(name))[1] = auth.uid()::text
        AND auth.role() = 'authenticated'
    );

-- Only the folder owner may touch their own objects afterwards.
CREATE POLICY "User update own folder"
    ON storage.objects FOR UPDATE
    USING ( bucket_id = 'observations' AND (storage.foldername(name))[1] = auth.uid()::text );

CREATE POLICY "User delete own folder"
    ON storage.objects FOR DELETE
    USING ( bucket_id = 'observations' AND (storage.foldername(name))[1] = auth.uid()::text );

-- 3. Defensive schema patch (kept from the original script) -------------------
ALTER TABLE public.observations
ADD COLUMN IF NOT EXISTS media_urls TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS rating TEXT,
ADD COLUMN IF NOT EXISTS note TEXT;
