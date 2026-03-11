-- Run this in your Supabase SQL Editor to fix the "Coming Soon / Blank" issue

-- Fix for Milestones Catalog (Open read access)
DROP POLICY IF EXISTS "Enable all for milestones_catalog" ON public.milestones_catalog;
CREATE POLICY "Enable read access for all users" ON public.milestones_catalog FOR SELECT USING (true);

-- Fix for Child Milestones (Authenticated users only)
DROP POLICY IF EXISTS "Enable all for child_milestones" ON public.child_milestones;
CREATE POLICY "Enable full access for authenticated users" ON public.child_milestones FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Fix for Growth Measurements 
DROP POLICY IF EXISTS "Enable all for growth_measurements" ON public.growth_measurements;
CREATE POLICY "Enable full access for authenticated users" ON public.growth_measurements FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Fix for Child Firsts Scrapbook
DROP POLICY IF EXISTS "Enable all for child_firsts" ON public.child_firsts;
CREATE POLICY "Enable full access for authenticated users" ON public.child_firsts FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
