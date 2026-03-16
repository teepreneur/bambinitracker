-- EXPANDED SHOP SEED (Categories up to 6 Years)

-- 1. Ensure Table Schema is updated
ALTER TABLE shop_categories ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- 2. Ensure Unique Constraint for Items
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shop_items_category_id_name_key') THEN
        ALTER TABLE shop_items ADD CONSTRAINT shop_items_category_id_name_key UNIQUE (category_id, name);
    END IF;
END $$;

-- 2. Upsert Shop Categories (0-6 Years)
INSERT INTO shop_categories (id, name, description, image_url, display_order) VALUES
('06626f2f-5b6d-4e92-962d-96690ce1f201', '0-6 Months Explorer Kit', 'Early sensory & soft play essentials for newborns.', 'https://xoqrvcykpygfishrkgnt.supabase.co/storage/v1/object/public/shop/explorer_kit_black_baby_1773605104463.png', 1),
('06626f2f-5b6d-4e92-962d-96690ce1f202', '6-12 Months Discoverer Set', 'Montessori-inspired wooden toys for curious minds.', 'https://xoqrvcykpygfishrkgnt.supabase.co/storage/v1/object/public/shop/discoverer_set_black_baby_1773605118336.png', 2),
('06626f2f-5b6d-4e92-962d-96690ce1f203', '1-2 Years Adventurer Kit', 'Active play and fine motor tools for budding explorers.', 'https://xoqrvcykpygfishrkgnt.supabase.co/storage/v1/object/public/shop/category_1_2y_adventurer.png', 3),
('06626f2f-5b6d-4e92-962d-96690ce1f204', '2-3 Years Curious Creator', 'Open-ended building and creative play for toddlers.', 'https://xoqrvcykpygfishrkgnt.supabase.co/storage/v1/object/public/shop/category_2_3y_creator.png', 4),
('06626f2f-5b6d-4e92-962d-96690ce1f205', '3-5 Years Young Scientist', 'Tools for early STEM exploration and observation.', 'https://xoqrvcykpygfishrkgnt.supabase.co/storage/v1/object/public/shop/category_3_5y_scientist.png', 5),
('06626f2f-5b6d-4e92-962d-96690ce1f206', '5-6 Years Confidence Builder', 'Advanced puzzles and logic games for preschoolers.', 'https://xoqrvcykpygfishrkgnt.supabase.co/storage/v1/object/public/shop/category_5_6y_builder.png', 6)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url,
    display_order = EXCLUDED.display_order;

-- 3. Clear existing items to ensure clean curated list
TRUNCATE shop_items;

-- 4. Seed Shop Items (Comprehensive Curation for all groups)
INSERT INTO shop_items (category_id, name, price, description, image_url) VALUES
-- 0-6m Explorer Kit (Sensory & Bonding)
('06626f2f-5b6d-4e92-962d-96690ce1f201', 'High-Contrast Vision Cards', 45.00, 'Black & white cards for early visual stimulation and focus.', 'https://images.unsplash.com/photo-1617332462310-86c38f978051?q=80&w=400'),
('06626f2f-5b6d-4e92-962d-96690ce1f201', 'Soft Tummy Time Mirror', 95.00, 'Safe, unbreakable mirror for neck muscle development.', 'https://images.unsplash.com/photo-1544126592-807daa2b56fd?q=80&w=400'),
('06626f2f-5b6d-4e92-962d-96690ce1f201', 'Sensory Silk Scarf Set', 65.00, 'Lightweight, colorful silk scarves for tracking and touch.', 'https://images.unsplash.com/photo-1520102213669-0268ecce28b7?q=80&w=400'),
('06626f2f-5b6d-4e92-962d-96690ce1f201', 'Organic Cotton Rattles', 55.00, 'Soft, easy-grip rattles made from natural materials.', 'https://images.unsplash.com/photo-1596460642802-5e46ef43482f?q=80&w=400'),
('06626f2f-5b6d-4e92-962d-96690ce1f201', 'Black & White Baby Gym', 350.00, 'Premium wooden gym with high-contrast dangling toys.', 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?q=80&w=400'),
('06626f2f-5b6d-4e92-962d-96690ce1f201', 'Textured Muslin Swaddles', 120.00, 'Breathable, soft cotton for soothing and bonding.', 'https://images.unsplash.com/photo-1484402628941-0bb40fc029e7?q=80&w=400'),

-- 6-12m Discoverer Set (Exploration & Fine Motor)
('06626f2f-5b6d-4e92-962d-96690ce1f202', 'Wooden Stacking Ring', 85.00, 'Natural wood rings for developing fine motor skills.', 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?q=80&w=400'),
('06626f2f-5b6d-4e92-962d-96690ce1f202', 'Nesting Discovery Cups', 45.00, 'BPA-free cups for stacking, pouring, and nesting.', 'https://images.unsplash.com/photo-1510004921431-295326168e80?q=80&w=400'),
('06626f2f-5b6d-4e92-962d-96690ce1f202', 'Soft Texture Ball Set', 75.00, 'Set of 6 balls with different textures for sensory play.', 'https://images.unsplash.com/photo-1515488463167-9d7a605f6da9?q=80&w=400'),
('06626f2f-5b6d-4e92-962d-96690ce1f202', 'First Words Board Books', 60.00, 'Sturdy books with high-contrast images and simple words.', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=400'),
('06626f2f-5b6d-4e92-962d-96690ce1f202', 'Wooden Push Walker', 420.00, 'Stable walker with built-in blocks for early steps.', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=400'),

-- 1-2y Adventurer Kit (Active Play & Coordination)
('06626f2f-5b6d-4e92-962d-96690ce1f203', 'Classic Shape Sorter', 120.00, 'Timeless wooden toy for color and shape recognition.', 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?q=80&w=400'),
('06626f2f-5b6d-4e92-962d-96690ce1f203', 'Chunky Grip Crayons', 35.00, 'Beeswax crayons designed for small hands to grasp.', 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=400'),
('06626f2f-5b6d-4e92-962d-96690ce1f203', 'Musical Rhythm Set', 150.00, 'Xylophone, maracas, and tambourine for local sounds.', 'https://images.unsplash.com/photo-1563823249-1dcabb73ffb9?q=80&w=400'),
('06626f2f-5b6d-4e92-962d-96690ce1f203', 'Pull-Along Wooden Puppy', 95.00, 'Cheerful wooden companion to encourage walking.', 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?q=80&w=400'),
('06626f2f-5b6d-4e92-962d-96690ce1f203', 'Big Soft Building Blocks', 280.00, 'Giant foam blocks for safe, large-scale construction.', 'https://images.unsplash.com/photo-1496196614460-48988a57fccf?q=80&w=400'),

-- 2-3y Curious Creator (Creativity & Logic)
('06626f2f-5b6d-4e92-962d-96690ce1f204', 'Natural Modelling Dough', 75.00, 'Non-toxic, scented dough with wooden tools.', 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?q=80&w=400'),
('06626f2f-5b6d-4e92-962d-96690ce1f204', 'Pom-Pom Sorting Kit', 45.00, 'Tongs and colorful pom-poms for fine motor practice.', 'https://images.unsplash.com/photo-1519750783842-1999b6a73e61?q=80&w=400'),
('06626f2f-5b6d-4e92-962d-96690ce1f204', 'Wooden Block City Set', 180.00, '50 pieces of varied shapes to build towers and towns.', 'https://images.unsplash.com/photo-1588636531109-f9c317ac4779?q=80&w=400'),
('06626f2f-5b6d-4e92-962d-96690ce1f204', 'Animal Matching Memo', 65.00, 'Wooden tiles for early memory and recognition games.', 'https://images.unsplash.com/photo-1515488463167-9d7a605f6da9?q=80&w=400'),
('06626f2f-5b6d-4e92-962d-96690ce1f204', 'Peg Pounding Bench', 110.00, 'Develop hand-eye coordination and motor control.', 'https://images.unsplash.com/photo-1533552763357-3665790a6122?q=80&w=400'),

-- 3-5y Young Scientist (STEM & Observation)
('06626f2f-5b6d-4e92-962d-96690ce1f205', 'Junior Discovery Lens', 35.00, 'Large, sturdy magnifying glass for backyard science.', 'https://images.unsplash.com/photo-1501503069356-3c6b82a17d89?q=80&w=400'),
('06626f2f-5b6d-4e92-962d-96690ce1f205', 'Nature Observation Jar', 45.00, 'Safe container for temporary bug and leaf study.', 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?q=80&w=400'),
('06626f2f-5b6d-4e92-962d-96690ce1f205', 'Creative Stencil Set', 55.00, 'Flexible animal and nature stencils for narrative art.', 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?q=80&w=400'),
('06626f2f-5b6d-4e92-962d-96690ce1f205', 'First Scissors Skills Kit', 85.00, 'Safety scissors and straight-line cutting patterns.', 'https://images.unsplash.com/photo-1531346878377-a5ec248888b9?q=80&w=400'),
('06626f2f-5b6d-4e92-962d-96690ce1f205', 'Story Sequencing Cards', 65.00, 'Help your child sequence events and build narratives.', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=400'),

-- 5-6y Confidence Builder (Logic & Engineering)
('06626f2f-5b6d-4e92-962d-96690ce1f206', 'Mechanics Gear Set', 220.00, 'Interlocking gears for early engineering concepts.', 'https://images.unsplash.com/photo-1530124560677-bdaeaeb10f7e?q=80&w=400'),
('06626f2f-5b6d-4e92-962d-96690ce1f206', 'Explorer Journal & Pen', 75.00, 'A place for their first sentences and field observations.', 'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=400'),
('06626f2f-5b6d-4e92-962d-96690ce1f206', 'Logic Puzzle Maze', 130.00, 'Challenging wooden maze for problem solving.', 'https://images.unsplash.com/photo-1521993422031-645367610057?q=80&w=400'),
('06626f2f-5b6d-4e92-962d-96690ce1f206', 'Alphabet Phonics Tiles', 95.00, 'Tactile wooden tiles for forming first words.', 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?q=80&w=400'),
('06626f2f-5b6d-4e92-962d-96690ce1f206', 'Junior Architectural Set', 350.00, 'Blueprint cards and blocks for building real structures.', 'https://images.unsplash.com/photo-1588636531109-f9c317ac4779?q=80&w=400')
ON CONFLICT (category_id, name) DO NOTHING;
