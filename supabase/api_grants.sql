-- Grant Data API access permissions to roles
GRANT ALL ON TABLE public.growth_measurements TO authenticated;
GRANT ALL ON TABLE public.growth_measurements TO service_role;

GRANT ALL ON TABLE public.milestones_catalog TO authenticated;
GRANT ALL ON TABLE public.milestones_catalog TO service_role;
GRANT ALL ON TABLE public.milestones_catalog TO anon; -- For catalog reading

GRANT ALL ON TABLE public.child_milestones TO authenticated;
GRANT ALL ON TABLE public.child_milestones TO service_role;

GRANT ALL ON TABLE public.child_firsts TO authenticated;
GRANT ALL ON TABLE public.child_firsts TO service_role;

GRANT ALL ON TABLE public.vaccinations TO authenticated;
GRANT ALL ON TABLE public.vaccinations TO service_role;

GRANT ALL ON TABLE public.health_logs TO authenticated;
GRANT ALL ON TABLE public.health_logs TO service_role;
