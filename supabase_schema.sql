-- Bambini Database Schema

-- Users table (managed by Supabase Auth, but this is the public profile)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  role TEXT CHECK (role IN ('parent', 'teacher', 'admin')),
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schools table
CREATE TABLE public.schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL, -- Short code for parent linking
  location TEXT,
  website TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Children table
CREATE TABLE public.children (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  dob DATE NOT NULL,
  gender TEXT,
  photo_url TEXT,
  school_id UUID REFERENCES public.schools(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Linking table for Parents and Children
CREATE TABLE public.parent_children (
  parent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  child_id UUID REFERENCES public.children(id) ON DELETE CASCADE,
  PRIMARY KEY (parent_id, child_id)
);

-- Activities table (Curriculum)
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  domain TEXT NOT NULL, -- cognitive, physical, language, social, creative
  age_band TEXT NOT NULL, -- e.g., '18-24m'
  description TEXT,
  instructions TEXT[],
  materials TEXT[],
  video_url TEXT,
  min_age_months INT,
  max_age_months INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Observations / Feedback
CREATE TABLE public.observations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES public.children(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES public.activities(id),
  observer_id UUID REFERENCES public.profiles(id),
  rating TEXT NOT NULL, -- Mastered, Getting There, Needs Practice, Skipped
  note TEXT,
  media_urls TEXT[],
  location_type TEXT DEFAULT 'home', -- home, school
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Milestones table
CREATE TABLE public.milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  age_band TEXT NOT NULL,
  description TEXT,
  min_age_months INT
);

-- Milestone Progress
CREATE TABLE public.milestone_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES public.children(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES public.milestones(id),
  achieved BOOLEAN DEFAULT FALSE,
  achieved_at TIMESTAMPTZ,
  evidence_urls TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies (Basic examples, will need refinement)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.observations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Parents can view their children" ON public.children
  FOR SELECT USING (
    id IN (SELECT child_id FROM public.parent_children WHERE parent_id = auth.uid())
    OR school_id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid() AND role = 'teacher')
  );
