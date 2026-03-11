-- Fix RLS on milestones_catalog and child_milestones
-- The v2 migration re-created these tables with RLS enabled.
-- Run this in your Supabase SQL Editor to allow reads/writes.

-- Option 1: Disable RLS entirely (simplest)
ALTER TABLE public.milestones_catalog DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_milestones DISABLE ROW LEVEL SECURITY;

-- Option 2: If you prefer to keep RLS on, uncomment these instead:
-- DROP POLICY IF EXISTS "Enable all for milestones_catalog" ON public.milestones_catalog;
-- CREATE POLICY "Allow all milestones_catalog" ON public.milestones_catalog FOR ALL USING (true) WITH CHECK (true);
-- DROP POLICY IF EXISTS "Enable all for child_milestones" ON public.child_milestones;
-- CREATE POLICY "Allow all child_milestones" ON public.child_milestones FOR ALL USING (true) WITH CHECK (true);
