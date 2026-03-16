-- SAFE SEED SCRIPT (Safe to run multiple times)

-- 1. Ensure the UNIQUE constraint exists on shop_items
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shop_items_category_id_name_key') THEN
        ALTER TABLE shop_items ADD CONSTRAINT shop_items_category_id_name_key UNIQUE (category_id, name);
    END IF;
END $$;

-- 2. Upsert Shop Categories with new inclusive assets
-- NOTE: Corrected project ID to xoqrvcykpygfishrkgnt
INSERT INTO shop_categories (id, name, description, image_url) VALUES
('06626f2f-5b6d-4e92-962d-96690ce1f201', '0-6 Months Explorer Kit', 'Early sensory & soft play essentials for newborns.', 'https://xoqrvcykpygfishrkgnt.supabase.co/storage/v1/object/public/shop/explorer_kit_black_baby_1773605104463.png'),
('06626f2f-5b6d-4e92-962d-96690ce1f202', '6-12 Months Discoverer Set', 'Montessori-inspired wooden toys for curious minds.', 'https://xoqrvcykpygfishrkgnt.supabase.co/storage/v1/object/public/shop/discoverer_set_black_baby_1773605118336.png')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url;

-- 3. Seed Shop Items
INSERT INTO shop_items (category_id, name, price, description, image_url) VALUES
('06626f2f-5b6d-4e92-962d-96690ce1f201', 'High-Contrast Flashcards', 45.00, 'Black & white cards for early visual stimulation.', 'https://images.unsplash.com/photo-1618842676088-c4d48a6a7c9d?q=80&w=200'),
('06626f2f-5b6d-4e92-962d-96690ce1f201', 'Soft Tummy Time Mirror', 95.00, 'Safe, unbreakable mirror for neck muscle development.', 'https://images.unsplash.com/photo-1544126592-807daa2b56fd?q=80&w=200'),
('06626f2f-5b6d-4e92-962d-96690ce1f202', 'Wooden Stacking Ring', 85.00, 'Natural wood rings for fine motor skills.', 'https://images.unsplash.com/photo-1537151608828-ea2b1173d340?q=80&w=200')
ON CONFLICT (category_id, name) DO NOTHING;
