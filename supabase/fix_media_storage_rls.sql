-- Storage policy patch for the two media buckets: 'activities' and 'shop'.
-- Run in Supabase Dashboard → SQL Editor (or `npx supabase db execute` once linked).
-- Idempotent: safe to run multiple times.
--
-- Conventions (must match lib/storage.ts MEDIA_BUCKETS and MEDIA path builder):
--   activities : PRIVATE bucket. Uploads under <auth.uid>/<activityId>/...
--                Rendering uses short-lived signed URLs (lib/storage.ts
--                createMediaSignedUrl), so no public read policy exists.
--   shop       : PUBLIC read — display assets; URLs are hardcoded in
--                components/shop/. No client uploads today.
--
-- Legacy: the old 'observations' bucket + root-wide policies from
-- supabase/observations_bucket.sql and supabase/fix_observations_storage_rls.sql
-- are superseded by this file and can be dropped from the dashboard when ready.
-- Note also: any pre-existing public URLs stored in observations.media_urls
-- will NOT render against the private bucket; only post-patch uploads (which
-- store storage paths) will.

-- 1. Bucket upserts -----------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('activities', 'activities', false)
ON CONFLICT (id) DO UPDATE SET public = FALSE;

INSERT INTO storage.buckets (id, name, public)
VALUES ('shop', 'shop', true)
ON CONFLICT (id) DO UPDATE SET public = TRUE;

-- 2. activities: folder-scoped, no public read ---------------------------------
DROP POLICY IF EXISTS "User upload own activities folder"     ON storage.objects;
DROP POLICY IF EXISTS "User update own activities folder"     ON storage.objects;
DROP POLICY IF EXISTS "User delete own activities folder"     ON storage.objects;
DROP POLICY IF EXISTS "Owner read own activities folder"      ON storage.objects;
DROP POLICY IF EXISTS "activities folder upload"              ON storage.objects;
DROP POLICY IF EXISTS "activities folder read"                ON storage.objects;

-- SELECT by the folder owner is REQUIRED: signed-URL creation on a private
-- bucket checks this policy, so without it createSignedUrl returns 403.
CREATE POLICY "Owner read own activities folder"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'activities'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "activities folder upload"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'activities'
        AND (storage.foldername(name))[1] = auth.uid()::text
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "User update own activities folder"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'activities'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "User delete own activities folder"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'activities'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- 3. shop: public read display assets -------------------------------------------
DROP POLICY IF EXISTS "Public read shop bucket" ON storage.objects;

CREATE POLICY "Public read shop bucket"
    ON storage.objects FOR SELECT
    USING ( bucket_id = 'shop' );
