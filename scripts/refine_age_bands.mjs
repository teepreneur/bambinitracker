import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function refineActivities() {
    console.log('--- Correcting & Refining Activity Age Bands ---');

    // 1. Update existing broad activities to more specific bands
    const updates = [
        { title: 'High-Contrast Tracking', new_max: 2, age_band: '0-2m' },
        { title: 'Baby Massage', new_max: 3, age_band: '0-3m' },
        { title: 'Tummy Time Intro', new_max: 2, age_band: '0-2m' },
        { title: 'High-Contrast Visual Wonders', new_max: 2, age_band: '0-2m' },
        { title: 'Chat & Chirp Reflections', new_max: 3, age_band: '0-3m' },
        { title: 'Talk & Mimic Playtime', new_max: 3, age_band: '0-3m' },
        { title: 'Leg Power Play: Bicycle Kicks', new_min: 2, new_max: 4, age_band: '2-4m' },
        { title: 'Baby Leg Bicycles', new_min: 3, new_max: 6, age_band: '3-6m' },
        { title: 'Mirror Hello', new_min: 3, new_max: 6, age_band: '3-6m' },
        { title: 'Rattle Response', new_max: 3, age_band: '0-3m' }
    ];

    for (const up of updates) {
        const { error } = await supabase
            .from('activities')
            .update({
                min_age_months: up.new_min !== undefined ? up.new_min : 0,
                max_age_months: up.new_max,
                age_band: up.age_band
            })
            .eq('title', up.title);
        if (error) console.error(`Error updating ${up.title}:`, error.message);
        else console.log(`Updated ${up.title}`);
    }

    // 2. Seed new granular activities
    const newActivities = [
        // 1-2 Months
        {
            title: 'Gentle Hand Grasp',
            description: 'Gently place your finger in baby\'s palm to encourage the grasping reflex and strengthen hand muscles.',
            domain: 'Fine Motor',
            min_age_months: 1,
            max_age_months: 2,
            age_band: '1-2m',
            estimated_duration_minutes: 5,
            instructions: ['Wait for baby to be alert and calm.', 'Gently touch their palm with your finger.', 'Observe the wrap-around reflex.', 'Hold for a few seconds, then release.'],
            materials: ['Your finger']
        },
        {
            title: 'Sing-Along Soothe',
            description: 'Sing slow, repetitive nursery rhymes while maintaining eye contact to build auditory processing and facial recognition.',
            domain: 'Language',
            min_age_months: 1,
            max_age_months: 2,
            age_band: '1-2m',
            estimated_duration_minutes: 10,
            instructions: ['Hold baby in a cradle position.', 'Maintain eye contact.', 'Sing softly and slowly.', 'Pause to see if baby makes any sounds.'],
            materials: []
        },
        // 2-3 Months
        {
            title: 'Vocal Volley',
            description: 'Imitate baby\'s coos and babbles. Wait for a response, then "reply" back to teach the basics of conversation and turn-taking.',
            domain: 'Language',
            min_age_months: 2,
            max_age_months: 3,
            age_band: '2-3m',
            estimated_duration_minutes: 8,
            instructions: ['Wait for baby to make a sound.', 'Repeat the sound back to them exactly.', 'Wait for them to respond again.', 'Continue the "dialogue".'],
            materials: []
        },
        {
            title: 'Reach for the Ribbon',
            description: 'Dangle a soft, colorful ribbon or toy 8-10 inches from baby\'s chest to encourage reaching and hand-eye coordination.',
            domain: 'Gross Motor',
            min_age_months: 2,
            max_age_months: 3,
            age_band: '2-3m',
            estimated_duration_minutes: 5,
            instructions: ['Lay baby on their back.', 'Hold the toy slightly out of reach.', 'Encourage them to swipe or bat at it.', 'Let them catch it occasionally!'],
            materials: ['Colorful ribbon or soft toy']
        },
        // 3-4 Months
        {
            title: 'Rolling Prep: Side Play',
            description: 'Gently roll baby onto their side and use a toy to encourage them to reach across their body, prepping those core muscles for rolling.',
            domain: 'Gross Motor',
            min_age_months: 3,
            max_age_months: 4,
            age_band: '3-4m',
            estimated_duration_minutes: 10,
            instructions: ['Lay baby on a soft mat.', 'Gently roll them onto their side.', 'Support their back with your hand or a rolled towel.', 'Shake a toy in front of them to keep them interested.'],
            materials: ['Soft mat', 'Rolled towel (optional)', 'Rattle']
        },
        {
            title: 'Bubble Tracking',
            description: 'Blow bubbles and encourage baby to watch them float. Helps develop smooth visual tracking and focus.',
            domain: 'Sensory',
            min_age_months: 3,
            max_age_months: 4,
            age_band: '3-4m',
            estimated_duration_minutes: 5,
            instructions: ['Ensure you are in a safe, draft-free area.', 'Slowly blow bubbles above baby.', 'Point to the bubbles.', 'Watch baby\'s eyes follow them.'],
            materials: ['Baby-safe bubble solution']
        },
        // 4-6 Months
        {
            title: 'Independent Grasping',
            description: 'Place two toys on the ground during tummy time. Watch baby choose which one to reach for and grasp with both hands.',
            domain: 'Fine Motor',
            min_age_months: 4,
            max_age_months: 6,
            age_band: '4-6m',
            estimated_duration_minutes: 10,
            instructions: ['Place baby on their tummy.', 'Put two distinct toys about 6 inches away.', 'Wait for baby to notice them.', 'Encourage them to reach and grasp.'],
            materials: ['Two colorful toys']
        },
        {
            title: 'Squeak & Seek',
            description: 'Hide a squeaky toy behind your back or under a cloth. Make it squeak and encourage baby to look toward the sound.',
            domain: 'Cognitive',
            min_age_months: 4,
            max_age_months: 6,
            age_band: '4-6m',
            estimated_duration_minutes: 5,
            instructions: ['Sit in front of baby.', 'Hide the toy.', 'Make a squeak sound.', 'Ask "Where is it?"', 'Slowly reveal the toy and celebrate.'],
            materials: ['Squeaky toy']
        }
    ];

    const { error: seedError } = await supabase.from('activities').insert(newActivities);
    if (seedError) console.error('Error seeding new activities:', seedError.message);
    else console.log('Successfully seeded 8 new granular activities!');
}

refineActivities();
