-- 1. Create the `growth_measurements` table
CREATE TABLE IF NOT EXISTS public.growth_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    weight_kg NUMERIC,
    height_cm NUMERIC,
    head_circumference_cm NUMERIC,
    recorded_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for growth_measurements
ALTER TABLE public.growth_measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for growth_measurements" ON public.growth_measurements
    FOR ALL USING (true) WITH CHECK (true);


-- 2. Create the `milestones_catalog` table (Reference data)
CREATE TABLE IF NOT EXISTS public.milestones_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    age_months INTEGER NOT NULL,
    domain TEXT NOT NULL, -- 'Cognitive', 'Language', 'Physical', 'Social', 'Sensory', etc.
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for milestones_catalog
ALTER TABLE public.milestones_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for milestones_catalog" ON public.milestones_catalog
    FOR ALL USING (true) WITH CHECK (true);


-- 3. Create the `child_milestones` table (Track achieved milestones)
CREATE TABLE IF NOT EXISTS public.child_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    milestone_id UUID NOT NULL REFERENCES public.milestones_catalog(id) ON DELETE CASCADE,
    achieved_date DATE,
    recorded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(child_id, milestone_id) -- A child can only achieve a milestone once
);

-- Enable RLS for child_milestones
ALTER TABLE public.child_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for child_milestones" ON public.child_milestones
    FOR ALL USING (true) WITH CHECK (true);


-- 4. Create the `child_firsts` table (Scrapbook timeline)
CREATE TABLE IF NOT EXISTS public.child_firsts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    photo_url TEXT,
    note TEXT,
    recorded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for child_firsts
ALTER TABLE public.child_firsts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for child_firsts" ON public.child_firsts
    FOR ALL USING (true) WITH CHECK (true);


-- Insert initial static milestones catalog data
INSERT INTO public.milestones_catalog (age_months, domain, title, description) VALUES
(2, 'Social', 'Social Smile', 'Smiles in response to your smile or face.'),
(2, 'Gross Motor', 'Head lifting', 'Holds head up for short periods when on tummy.'),
(2, 'Language', 'Cooing', 'Makes sounds like "ooh" and "aah".'),
(4, 'Fine Motor', 'Reaching', 'Reaches for and grabs objects or toys.'),
(4, 'Cognitive', 'Visual tracking', 'Follows moving things with eyes from side to side.'),
(4, 'Gross Motor', 'Rolling over', 'Rolls over from tummy to back.'),
(6, 'Gross Motor', 'Sitting up', 'Sits without support for a few seconds.'),
(6, 'Language', 'Babbling', 'Makes strings of consonant-vowel sounds like "ba-ba-ba".'),
(6, 'Social', 'Recognizing faces', 'Knows familiar faces and begins to notice if someone is a stranger.'),
(9, 'Gross Motor', 'Crawling', 'Crawls on hands and knees or belly.'),
(9, 'Fine Motor', 'Pincer grasp', 'Picks up small items like cereal using thumb and index finger.'),
(9, 'Cognitive', 'Object permanence', 'Looks for a toy even when it drops out of sight.');
