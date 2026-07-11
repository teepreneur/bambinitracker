-- ============================================================================
-- Bambini Tracker: Security & RLS Hardening
-- ============================================================================
-- This migration replaces the permissive "USING (true)" and
-- "auth.role() = 'authenticated'" policies that previously allowed ANY signed-in
-- (and in some cases anonymous) user to read and write EVERY family's data.
--
-- Access to child-scoped data is now gated on the parent<->child link in
-- public.parent_children via the helper function user_can_access_child().
--
-- Run AFTER the base schema, growth_screen_tables, health_tables, shop_tables,
-- milestones_v2 and tips have been applied. It is idempotent and safe to re-run.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Access helper
-- ----------------------------------------------------------------------------
-- SECURITY DEFINER so the function can read parent_children without being
-- filtered by (or recursing into) RLS. Parent-based access matches how the app
-- actually links users to children (see hooks/useData.ts). Teacher/school-based
-- access can be layered in here later once profiles.school_id is confirmed.
CREATE OR REPLACE FUNCTION public.user_can_access_child(target_child_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.parent_children pc
    WHERE pc.child_id = target_child_id
      AND pc.parent_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.user_can_access_child(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_can_access_child(uuid) TO authenticated;

-- ----------------------------------------------------------------------------
-- 1. profiles — a user may only see and edit their own profile row
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- 2. parent_children — a user may only manage their own child links
-- ----------------------------------------------------------------------------
ALTER TABLE public.parent_children ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parents manage their own links" ON public.parent_children;
CREATE POLICY "Parents manage their own links" ON public.parent_children
  FOR ALL
  USING (parent_id = auth.uid())
  WITH CHECK (parent_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 3. children — access gated on the parent link
-- ----------------------------------------------------------------------------
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parents can view their children" ON public.children;
DROP POLICY IF EXISTS "Users can view accessible children" ON public.children;
DROP POLICY IF EXISTS "Authenticated can create children" ON public.children;
DROP POLICY IF EXISTS "Parents can update their children" ON public.children;
DROP POLICY IF EXISTS "Parents can delete their children" ON public.children;

-- Any authenticated user may create a child row; they then immediately link
-- themselves in parent_children (see the add-child flow).
CREATE POLICY "Authenticated can create children" ON public.children
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can view accessible children" ON public.children
  FOR SELECT USING (public.user_can_access_child(id));
CREATE POLICY "Parents can update their children" ON public.children
  FOR UPDATE USING (public.user_can_access_child(id))
  WITH CHECK (public.user_can_access_child(id));
CREATE POLICY "Parents can delete their children" ON public.children
  FOR DELETE USING (public.user_can_access_child(id));

-- ----------------------------------------------------------------------------
-- 4. Child-scoped data tables — all gated on user_can_access_child(child_id)
-- ----------------------------------------------------------------------------
-- observations
ALTER TABLE public.observations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Access own child observations" ON public.observations;
CREATE POLICY "Access own child observations" ON public.observations
  FOR ALL
  USING (public.user_can_access_child(child_id))
  WITH CHECK (public.user_can_access_child(child_id));

-- child_activities (DDL created ad-hoc; guard with IF EXISTS)
ALTER TABLE IF EXISTS public.child_activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Access own child activities" ON public.child_activities;
CREATE POLICY "Access own child activities" ON public.child_activities
  FOR ALL
  USING (public.user_can_access_child(child_id))
  WITH CHECK (public.user_can_access_child(child_id));

-- growth_measurements
ALTER TABLE public.growth_measurements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for growth_measurements" ON public.growth_measurements;
DROP POLICY IF EXISTS "Enable full access for authenticated users" ON public.growth_measurements;
DROP POLICY IF EXISTS "Access own child growth" ON public.growth_measurements;
CREATE POLICY "Access own child growth" ON public.growth_measurements
  FOR ALL
  USING (public.user_can_access_child(child_id))
  WITH CHECK (public.user_can_access_child(child_id));

-- child_milestones
ALTER TABLE public.child_milestones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for child_milestones" ON public.child_milestones;
DROP POLICY IF EXISTS "Enable full access for authenticated users" ON public.child_milestones;
DROP POLICY IF EXISTS "Allow all child_milestones" ON public.child_milestones;
DROP POLICY IF EXISTS "Access own child milestones" ON public.child_milestones;
CREATE POLICY "Access own child milestones" ON public.child_milestones
  FOR ALL
  USING (public.user_can_access_child(child_id))
  WITH CHECK (public.user_can_access_child(child_id));

-- child_firsts
ALTER TABLE public.child_firsts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for child_firsts" ON public.child_firsts;
DROP POLICY IF EXISTS "Enable full access for authenticated users" ON public.child_firsts;
DROP POLICY IF EXISTS "Access own child firsts" ON public.child_firsts;
CREATE POLICY "Access own child firsts" ON public.child_firsts
  FOR ALL
  USING (public.user_can_access_child(child_id))
  WITH CHECK (public.user_can_access_child(child_id));

-- vaccinations
ALTER TABLE public.vaccinations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.vaccinations;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.vaccinations;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.vaccinations;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.vaccinations;
DROP POLICY IF EXISTS "Access own child vaccinations" ON public.vaccinations;
CREATE POLICY "Access own child vaccinations" ON public.vaccinations
  FOR ALL
  USING (public.user_can_access_child(child_id))
  WITH CHECK (public.user_can_access_child(child_id));

-- health_logs
ALTER TABLE public.health_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.health_logs;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.health_logs;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.health_logs;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.health_logs;
DROP POLICY IF EXISTS "Access own child health logs" ON public.health_logs;
CREATE POLICY "Access own child health logs" ON public.health_logs
  FOR ALL
  USING (public.user_can_access_child(child_id))
  WITH CHECK (public.user_can_access_child(child_id));

-- milestone_progress (legacy table)
ALTER TABLE IF EXISTS public.milestone_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Access own child milestone progress" ON public.milestone_progress;
CREATE POLICY "Access own child milestone progress" ON public.milestone_progress
  FOR ALL
  USING (public.user_can_access_child(child_id))
  WITH CHECK (public.user_can_access_child(child_id));

-- ----------------------------------------------------------------------------
-- 5. invitations — the inviting parent owns the row
-- ----------------------------------------------------------------------------
-- NOTE: teacher redemption (lookup by code without owning the row) must go
-- through a SECURITY DEFINER RPC or the service role; it is intentionally not
-- exposed to the anon/authenticated roles here.
ALTER TABLE IF EXISTS public.invitations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Inviter manages own invitations" ON public.invitations;
CREATE POLICY "Inviter manages own invitations" ON public.invitations
  FOR ALL
  USING (inviter_id = auth.uid())
  WITH CHECK (inviter_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 6. Reference / catalog tables — public read, no client writes
-- ----------------------------------------------------------------------------
-- milestones_catalog
ALTER TABLE public.milestones_catalog ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for milestones_catalog" ON public.milestones_catalog;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.milestones_catalog;
DROP POLICY IF EXISTS "Allow all milestones_catalog" ON public.milestones_catalog;
DROP POLICY IF EXISTS "Catalog is readable by everyone" ON public.milestones_catalog;
CREATE POLICY "Catalog is readable by everyone" ON public.milestones_catalog
  FOR SELECT USING (true);

-- milestones (legacy catalog)
ALTER TABLE IF EXISTS public.milestones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Milestones are readable by everyone" ON public.milestones;
CREATE POLICY "Milestones are readable by everyone" ON public.milestones
  FOR SELECT USING (true);

-- activities — readable by everyone; authenticated users may insert
-- AI-generated activities (see useSyncDailyActivities).
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Activities are readable by everyone" ON public.activities;
DROP POLICY IF EXISTS "Authenticated can add activities" ON public.activities;
CREATE POLICY "Activities are readable by everyone" ON public.activities
  FOR SELECT USING (true);
CREATE POLICY "Authenticated can add activities" ON public.activities
  FOR INSERT TO authenticated WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 7. Table privileges — least privilege
-- ----------------------------------------------------------------------------
-- Revoke the blanket anon grants that earlier "fix" scripts handed out on
-- child-scoped data. RLS already blocks anon (no auth.uid()), but there is no
-- reason for the anon role to hold table privileges on private data at all.
REVOKE ALL ON public.child_milestones     FROM anon;
REVOKE ALL ON public.growth_measurements  FROM anon;
REVOKE ALL ON public.vaccinations         FROM anon;
REVOKE ALL ON public.health_logs          FROM anon;
REVOKE ALL ON public.observations         FROM anon;
REVOKE ALL ON public.children             FROM anon;

-- Catalog tables stay readable by anon (public reference data).
GRANT SELECT ON public.milestones_catalog TO anon, authenticated;

-- Authenticated role needs full CRUD on the child-scoped tables (RLS enforces
-- row ownership on top of these grants).
GRANT SELECT, INSERT, UPDATE, DELETE ON public.children            TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.observations        TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.growth_measurements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.child_milestones    TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vaccinations        TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.health_logs         TO authenticated;
