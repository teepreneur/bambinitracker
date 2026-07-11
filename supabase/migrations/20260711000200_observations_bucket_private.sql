-- ============================================================================
-- Bambini Tracker: Make the observations media bucket private
-- ============================================================================
-- The observations bucket previously had public = true and a SELECT policy of
-- USING (bucket_id = 'observations'), meaning every uploaded photo of a child
-- was world-readable to anyone with the URL. This migration makes the bucket
-- private and restricts reads to the object owner (the uploading parent).
-- The client fetches media through short-lived signed URLs (see utils/storage.ts).
-- ============================================================================

UPDATE storage.buckets SET public = false WHERE id = 'observations';

-- Replace the public read policy with an owner-scoped one.
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Owner can read observation media" ON storage.objects;
CREATE POLICY "Owner can read observation media"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'observations' AND auth.uid() = owner );

-- Uploads / updates / deletes remain owner-scoped (recreated idempotently).
DROP POLICY IF EXISTS "Auth Upload" ON storage.objects;
CREATE POLICY "Auth Upload"
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'observations' AND auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Auth Update Delete" ON storage.objects;
CREATE POLICY "Auth Update Delete"
  ON storage.objects FOR UPDATE
  USING ( bucket_id = 'observations' AND auth.uid() = owner );

DROP POLICY IF EXISTS "Auth Delete" ON storage.objects;
CREATE POLICY "Auth Delete"
  ON storage.objects FOR DELETE
  USING ( bucket_id = 'observations' AND auth.uid() = owner );
