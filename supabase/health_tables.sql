-- Create the `vaccinations` table
CREATE TABLE IF NOT EXISTS public.vaccinations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    vaccine_name TEXT NOT NULL,
    dose_number INTEGER NOT NULL,
    given_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for vaccinations
ALTER TABLE public.vaccinations ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage vaccinations
CREATE POLICY "Enable read access for authenticated users" ON public.vaccinations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON public.vaccinations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.vaccinations FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON public.vaccinations FOR DELETE USING (auth.role() = 'authenticated');


-- Create the `health_logs` table
CREATE TABLE IF NOT EXISTS public.health_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    symptoms TEXT[] NOT NULL DEFAULT '{}',
    severity TEXT NOT NULL, -- 'Mild', 'Moderate', 'Severe'
    notes TEXT,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for health_logs
ALTER TABLE public.health_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage health_logs
CREATE POLICY "Enable read access for authenticated users" ON public.health_logs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON public.health_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.health_logs FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON public.health_logs FOR DELETE USING (auth.role() = 'authenticated');
