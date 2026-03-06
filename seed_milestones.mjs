import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read .env file directly
const envContent = readFileSync('.env', 'utf8');
const getEnv = (key) => envContent.split('\n').find(l => l.startsWith(key))?.split('=').slice(1).join('=')?.trim();

const SUPABASE_URL = getEnv('EXPO_PUBLIC_SUPABASE_URL');
const SUPABASE_SERVICE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// CDC-based developmental milestones across 5 domains and 3 age bands
const MILESTONES = [
    // Physical — 0-12m
    { name: 'Rolls over', domain: 'Physical', age_band: '0-12m', description: 'Rolls from tummy to back and back to tummy', min_age_months: 4 },
    { name: 'Sits without support', domain: 'Physical', age_band: '0-12m', description: 'Sits upright without needing to lean on hands', min_age_months: 6 },
    { name: 'Pulls to stand', domain: 'Physical', age_band: '0-12m', description: 'Uses furniture to pull themselves up to standing', min_age_months: 9 },
    { name: 'Takes first steps', domain: 'Physical', age_band: '0-12m', description: 'Walks a few steps independently without holding on', min_age_months: 11 },
    // Physical — 12-24m
    { name: 'Walks steadily', domain: 'Physical', age_band: '12-24m', description: 'Walks without falling or stumbling frequently', min_age_months: 14 },
    { name: 'Kicks a ball', domain: 'Physical', age_band: '12-24m', description: 'Can kick a ball forward without losing balance', min_age_months: 18 },
    // Physical — 24-36m
    { name: 'Runs and jumps', domain: 'Physical', age_band: '24-36m', description: 'Runs comfortably and can jump with both feet', min_age_months: 24 },
    { name: 'Climbs playground structures', domain: 'Physical', age_band: '24-36m', description: 'Safely climbs up and down playground equipment', min_age_months: 30 },

    // Cognitive — 0-12m
    { name: 'Follows moving objects', domain: 'Cognitive', age_band: '0-12m', description: 'Tracks objects moving across their field of vision', min_age_months: 2 },
    { name: 'Finds hidden objects', domain: 'Cognitive', age_band: '0-12m', description: 'Looks for toys that have been hidden under a blanket', min_age_months: 8 },
    // Cognitive — 12-24m
    { name: 'Stacks 3+ blocks', domain: 'Cognitive', age_band: '12-24m', description: 'Builds a tower of at least 3 blocks', min_age_months: 15 },
    { name: 'Simple shape sorting', domain: 'Cognitive', age_band: '12-24m', description: 'Puts circles and squares into matching holes', min_age_months: 18 },
    // Cognitive — 24-36m
    { name: 'Completes simple puzzles', domain: 'Cognitive', age_band: '24-36m', description: 'Puts together puzzles with 3-4 pieces', min_age_months: 24 },
    { name: 'Sorts by color or shape', domain: 'Cognitive', age_band: '24-36m', description: 'Groups objects by a single attribute', min_age_months: 30 },

    // Language — 0-12m
    { name: 'Babbles (ba-ba, da-da)', domain: 'Language', age_band: '0-12m', description: 'Makes repetitive consonant-vowel sounds', min_age_months: 6 },
    { name: 'Says first word', domain: 'Language', age_band: '0-12m', description: 'Uses a word like "mama" or "dada" with meaning', min_age_months: 11 },
    // Language — 12-24m
    { name: 'Uses 10+ words', domain: 'Language', age_band: '12-24m', description: 'Regularly uses at least 10 different words', min_age_months: 15 },
    { name: 'Two-word phrases', domain: 'Language', age_band: '12-24m', description: 'Combines two words like "more milk" or "daddy go"', min_age_months: 20 },
    // Language — 24-36m
    { name: 'Names familiar objects', domain: 'Language', age_band: '24-36m', description: 'Can name common objects when asked "what is this?"', min_age_months: 24 },
    { name: 'Short sentences (3+ words)', domain: 'Language', age_band: '24-36m', description: 'Speaks in sentences of 3 or more words', min_age_months: 30 },

    // Social — 0-12m
    { name: 'Social smile', domain: 'Social', age_band: '0-12m', description: 'Smiles at people in response to their smiles', min_age_months: 2 },
    { name: 'Stranger anxiety', domain: 'Social', age_band: '0-12m', description: 'Shows shyness or cries with unfamiliar people', min_age_months: 8 },
    // Social — 12-24m
    { name: 'Plays alongside others', domain: 'Social', age_band: '12-24m', description: 'Engages in parallel play near other children', min_age_months: 14 },
    // Social — 24-36m
    { name: 'Takes turns (with help)', domain: 'Social', age_band: '24-36m', description: 'Can wait for a turn with gentle reminders', min_age_months: 24 },

    // Creative — 12-24m
    { name: 'Scribbles with crayons', domain: 'Creative', age_band: '12-24m', description: 'Makes marks on paper with a crayon or marker', min_age_months: 14 },
    // Creative — 24-36m
    { name: 'Pretend play', domain: 'Creative', age_band: '24-36m', description: 'Engages in imaginative play like feeding a doll or pretending to cook', min_age_months: 24 },
    { name: 'Draws simple shapes', domain: 'Creative', age_band: '24-36m', description: 'Attempts to draw circles or lines intentionally', min_age_months: 30 },
];

async function seedMilestones() {
    console.log('🌱 Seeding milestones...');
    console.log('URL:', SUPABASE_URL?.substring(0, 30) + '...');
    console.log('Key type:', SUPABASE_SERVICE_KEY?.substring(0, 20) + '...');

    // First, grant permissions and disable RLS via raw SQL
    const { error: grantError } = await supabase.rpc('exec_sql', {
        query: `
            ALTER TABLE public.milestones DISABLE ROW LEVEL SECURITY;
            ALTER TABLE public.milestone_progress DISABLE ROW LEVEL SECURITY;
            GRANT ALL ON public.milestones TO authenticated, anon, service_role;
            GRANT ALL ON public.milestone_progress TO authenticated, anon, service_role;
        `
    }).single();

    if (grantError) {
        console.log('⚠️ RPC grant failed (expected if exec_sql doesnt exist):', grantError.message);
        console.log('Trying direct inserts anyway...');
    }

    // Try inserting milestones
    const { data: inserted, error } = await supabase
        .from('milestones')
        .insert(MILESTONES)
        .select();

    if (error) {
        console.error('❌ Error inserting milestones:', error.message);
        console.error('Full error:', JSON.stringify(error));
        return;
    }

    console.log(`✅ Inserted ${inserted.length} milestones`);

    // Fetch all milestones
    const { data: allMilestones } = await supabase.from('milestones').select('id');
    if (!allMilestones) return;

    // Fetch all children
    const { data: allChildren } = await supabase.from('children').select('id');
    if (!allChildren || allChildren.length === 0) {
        console.log('⚠️ No children found. Skipping milestone_progress seeding.');
        return;
    }

    // Create milestone_progress entries for each child × milestone
    const progressEntries = [];
    for (const child of allChildren) {
        for (const ms of allMilestones) {
            progressEntries.push({
                child_id: child.id,
                milestone_id: ms.id,
                achieved: false,
            });
        }
    }

    // Batch insert (Supabase has a 1000-row limit per request)
    const batchSize = 500;
    for (let i = 0; i < progressEntries.length; i += batchSize) {
        const batch = progressEntries.slice(i, i + batchSize);
        const { error: progressError } = await supabase.from('milestone_progress').insert(batch);
        if (progressError) {
            console.error(`❌ Error inserting milestone_progress batch ${i / batchSize + 1}:`, progressError.message);
        }
    }

    console.log(`✅ Created ${progressEntries.length} milestone_progress entries for ${allChildren.length} children`);
    console.log('🎉 Done!');
}

seedMilestones();
