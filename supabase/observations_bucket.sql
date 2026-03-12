-- Create a storage bucket for observation media
INSERT INTO storage.buckets (id, name, public) 
VALUES ('observations', 'observations', true)
ON CONFLICT (id) DO NOTHING;

-- Set up security policies for the bucket
-- Allow public access to view observation media
CREATE POLICY "Public Access" 
    ON storage.objects FOR SELECT 
    USING ( bucket_id = 'observations' );

-- Allow authenticated users to upload media
CREATE POLICY "Auth Upload" 
    ON storage.objects FOR INSERT 
    WITH CHECK ( bucket_id = 'observations' AND auth.role() = 'authenticated' );

-- Allow users to update/delete their own uploads
CREATE POLICY "Auth Update Delete" 
    ON storage.objects FOR UPDATE 
    USING ( bucket_id = 'observations' AND auth.uid() = owner );

CREATE POLICY "Auth Delete" 
    ON storage.objects FOR DELETE 
    USING ( bucket_id = 'observations' AND auth.uid() = owner );

-- Ensure observations table has the right schema (it should already have these, but just in case)
ALTER TABLE public.observations 
ADD COLUMN IF NOT EXISTS media_urls TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS rating TEXT,
ADD COLUMN IF NOT EXISTS note TEXT;
