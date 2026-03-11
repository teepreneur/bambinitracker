-- Tips table for age-appropriate parenting advice
-- Tips are shown on the home screen and can be managed from the database

CREATE TABLE IF NOT EXISTS public.tips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  icon TEXT DEFAULT '💡',
  color TEXT DEFAULT '#A67BB5',
  bg_color TEXT DEFAULT '#F4EBf7',
  age_min_days INT DEFAULT 0,
  age_max_days INT DEFAULT 90,
  category TEXT DEFAULT 'general',  -- 'newborn', 'postpartum', 'safety', 'development', 'general'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS for simplicity (all tips are public content)
ALTER TABLE public.tips DISABLE ROW LEVEL SECURITY;

-- Grant access
GRANT SELECT ON public.tips TO anon, authenticated;

-- Seed initial tips
INSERT INTO public.tips (title, content, icon, color, bg_color, age_min_days, age_max_days, category) VALUES
('Safe Sleep', 'Always place baby on their back on a firm, flat infant sleep surface.', '🌙', '#A67BB5', '#F4EBf7', 0, 90, 'safety'),
('Postpartum Help', 'Remember to rest when baby rests. Your gentle recovery is vital.', '🤍', '#EC4899', '#FCE7F3', 0, 60, 'postpartum'),
('Tummy Time', 'Start with 2-3 minutes of tummy time on your chest, 2-3 times a day.', '🧸', '#F5A623', '#FFF5E6', 0, 120, 'development'),
('Skin to Skin', 'Hold your newborn against your bare chest for warmth, bonding, and breastfeeding support.', '🤱', '#4ECDC4', '#E0F7F6', 0, 60, 'newborn'),
('Feeding Schedule', 'Newborns typically feed every 2-3 hours. Watch for hunger cues like rooting and lip-smacking.', '🍼', '#3B82F6', '#E8F0FE', 0, 90, 'newborn'),
('Diaper Check', 'Expect 6-8 wet diapers a day. This is a good sign your baby is well-hydrated.', '👶', '#8DC63F', '#F0F7E6', 0, 30, 'newborn'),
('Talk to Baby', 'Even before they understand words, talking to your baby builds neural connections for language.', '🗣️', '#F5A623', '#FFF5E6', 0, 365, 'development'),
('Movement Matters', 'Let your baby kick freely on a mat. Free movement builds their coordination.', '🦶', '#EC4899', '#FCE7F3', 30, 180, 'development'),
('Reading Together', 'Start reading board books aloud — rhythm and tone matter more than the words at this age.', '📖', '#A67BB5', '#F4EBf7', 60, 365, 'development'),
('Introduce Textures', 'Let your baby touch different safe textures — smooth, bumpy, soft, crinkly.', '✋', '#FFD166', '#FFF8E1', 90, 365, 'development');
