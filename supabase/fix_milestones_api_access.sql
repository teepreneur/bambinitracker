-- Grant API access to milestones tables
-- This fixes the "no permissions exist for the anon or authenticated roles" error

GRANT ALL ON public.milestones_catalog TO anon, authenticated;
GRANT ALL ON public.child_milestones TO anon, authenticated;
