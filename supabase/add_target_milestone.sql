-- Add target_milestone column to activities table
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS target_milestone TEXT;

-- Update RLS if necessary (usually not for simple column additions)
COMMENT ON COLUMN public.activities.target_milestone IS 'The specific milestone this AI-generated activity is targeting.';
