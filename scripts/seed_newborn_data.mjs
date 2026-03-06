import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const NEWBORN_ACTIVITIES = [
    {
        title: 'Skin-to-Skin Bonding',
        domain: 'Social',
        age_band: '0-3m',
        description: 'Holding your baby against your bare skin to promote bonding and regulation.',
        instructions: ['Remove baby\'s shirt (keep diaper on).', 'Hold baby against your bare chest.', 'Cover both of you with a warm blanket.', 'Enjoy 20-30 minutes of quiet bonding.'],
        materials: ['Warm blanket'],
        min_age_months: 0,
        max_age_months: 3
    },
    {
        title: 'Tummy Time Intro',
        domain: 'Physical',
        age_band: '0-3m',
        description: 'Guided, supervised tummy time to build neck and shoulder strength.',
        instructions: ['Place baby on their tummy on a flat, firm surface.', 'Place a high-contrast book or mirror in front of them.', 'Keep sessions short (3-5 minutes).', 'Stay with baby at all times.'],
        materials: ['Firm mat or blanket', 'High-contrast book'],
        min_age_months: 0,
        max_age_months: 4
    },
    {
        title: 'High-Contrast Tracking',
        domain: 'Cognitive',
        age_band: '0-3m',
        description: 'Using black and white patterns to stimulate visual development.',
        instructions: ['Hold a high-contrast card 8-12 inches from baby\'s face.', 'Slowly move the card from side to side.', 'Observe if baby\'s eyes follow the movement.'],
        materials: ['Black and white contrast cards'],
        min_age_months: 0,
        max_age_months: 3
    },
    {
        title: 'Baby Leg Bicycles',
        domain: 'Physical',
        age_band: '0-3m',
        description: 'Gentle leg movements to help with digestion and lower body awareness.',
        instructions: ['Lay baby on their back.', 'Gently hold their ankles.', 'Slowly move legs in a bicycle motion.', 'Watch for baby\'s comfort and smiles.'],
        materials: [],
        min_age_months: 0,
        max_age_months: 6
    },
    {
        title: 'Gentle Lullabies',
        domain: 'Language',
        age_band: '0-3m',
        description: 'Singing softly to introduce rhythm and voice recognition.',
        instructions: ['Hold baby close or lay them down.', 'Sing a soft, slow song or nursery rhyme.', 'Maintain eye contact while singing.'],
        materials: [],
        min_age_months: 0,
        max_age_months: 6
    },
    {
        title: 'Baby Massage',
        domain: 'Sensory',
        age_band: '0-3m',
        description: 'Gentle strokes to soothe the baby and stimulate the senses.',
        instructions: ['Ensure the room is warm.', 'Use a tiny bit of baby-safe oil if desired.', 'Apply gentle strokes from thighs down to feet.', 'Talk softly to baby throughout.'],
        materials: ['Baby-safe oil (optional)'],
        min_age_months: 0,
        max_age_months: 12
    },
    {
        title: 'Mirror Hello',
        domain: 'Social',
        age_band: '0-3m',
        description: 'Introducing baby to human faces using a safe mirror.',
        instructions: ['Hold baby in front of a safe, unbreakable mirror.', 'Point to their reflection and say "Hello [Name]!"', 'Smile and watch for reactions.'],
        materials: ['Unbreakable baby mirror'],
        min_age_months: 1,
        max_age_months: 6
    },
    {
        title: 'Rattle Response',
        domain: 'Sensory',
        age_band: '0-3m',
        description: 'Stimulating auditory tracking and curiosity.',
        instructions: ['Gently shake a rattle on one side of baby\'s head.', 'Wait for them to turn or react.', 'Repeat on the other side.', 'Bring it into their line of sight.'],
        materials: ['Gentle rattle'],
        min_age_months: 0,
        max_age_months: 4
    }
];

const NEWBORN_MILESTONES = [
    { name: 'Lifts head briefly', domain: 'Physical', age_band: '0-1m', description: 'Briefly lifts head when placed on tummy.', min_age_months: 1 },
    { name: 'Moves both arms and legs', domain: 'Physical', age_band: '0-1m', description: 'Moves both arms and both legs together.', min_age_months: 1 },
    { name: 'Looks at faces', domain: 'Cognitive', age_band: '0-1m', description: 'Shows interest in looking at parent or caregiver faces.', min_age_months: 1 },
    { name: 'Calms to voice', domain: 'Social', age_band: '0-1m', description: 'Calms down when picked up or spoken to.', min_age_months: 1 },
    { name: 'Reacts to sound', domain: 'Sensory', age_band: '0-1m', description: 'Starts or quiets in response to loud noises.', min_age_months: 1 }
];

async function seedNewbornData() {
    console.log('🌱 Seeding Newborn Data...');

    // 1. Insert Activities
    console.log('🎯 Seeding Newborn Activities...');
    for (const activity of NEWBORN_ACTIVITIES) {
        const { error } = await supabase.from('activities').insert(activity);
        if (error) console.warn(`   ⚠️ Activity "${activity.title}": ${error.message}`);
        else process.stdout.write('.');
    }
    console.log('\n   ✅ Activities seeded.');

    // 2. Insert Milestones
    console.log('✨ Seeding Newborn Milestones...');
    const { data: insertedMilestones, error: msError } = await supabase
        .from('milestones')
        .insert(NEWBORN_MILESTONES)
        .select();

    if (msError) {
        console.error('❌ Error seeding milestones:', msError.message);
    } else {
        console.log(`   ✅ ${insertedMilestones.length} Milestones seeded.`);

        // 3. Create milestone_progress for existing children if any
        const { data: allChildren } = await supabase.from('children').select('id');
        if (allChildren && allChildren.length > 0) {
            console.log(`📊 Linking milestones to ${allChildren.length} children...`);
            const progressEntries = [];
            for (const child of allChildren) {
                for (const ms of insertedMilestones) {
                    progressEntries.push({
                        child_id: child.id,
                        milestone_id: ms.id,
                        achieved: false
                    });
                }
            }
            const { error: progError } = await supabase.from('milestone_progress').insert(progressEntries);
            if (progError) console.error('❌ Error creating progress entries:', progError.message);
            else console.log('   ✅ Progress entries linked.');
        }
    }

    console.log('\n🎉 Newborn Data Seed Complete!');
}

seedNewbornData().catch(console.error);
