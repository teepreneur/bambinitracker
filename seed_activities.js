import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY; // Using anon key since RLS isn't blocking inserts yet or we can use service role

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const activities = [
    {
        title: 'Tummy Time Reach',
        domain: 'Physical',
        age_band: '0-6m',
        description: 'Encourage your baby to lift their head and reach for objects during tummy time.',
        instructions: [
            'Place your baby on their tummy on a firm, flat, safe surface.',
            'Place a bright or noisy toy just out of their reach.',
            'Encourage them to look up and reach for the toy.',
            'Keep tummy time short (2-3 minutes) but frequent.'
        ],
        materials: ['Soft play mat', 'Bright or noisy toy'],
        min_age_months: 1,
        max_age_months: 6,
    },
    {
        title: 'Peek-a-Boo',
        domain: 'Cognitive',
        age_band: '6-12m',
        description: 'A classic game to help your baby understand object permanence.',
        instructions: [
            'Cover your face with your hands or a soft cloth.',
            'Ask "Where am I?"',
            'Reveal your face with a big smile and say "Peek-a-boo!"',
            'Watch for their reaction and repeat.'
        ],
        materials: ['A soft cloth or blanket (optional)'],
        min_age_months: 6,
        max_age_months: 12,
    },
    {
        title: 'Color Sorting Game',
        domain: 'Cognitive',
        age_band: '24-36m',
        description: 'Help develop logic and color recognition by sorting objects by color.',
        instructions: [
            'Gather colorful safe objects (blocks, large buttons, toys) and 3-4 colored bowls.',
            'Show your toddler how to place the red objects in the red bowl.',
            'Ask them to find the blue objects next.',
            'Praise them when they sort correctly.'
        ],
        materials: ['Colored bowls or baskets', 'Assorted colorful child-safe objects'],
        min_age_months: 24,
        max_age_months: 36,
    },
    {
        title: 'Sensory Bin Exploration',
        domain: 'Creative',
        age_band: '18-24m',
        description: 'Stimulate the senses and encourage independent exploration.',
        instructions: [
            'Fill a shallow plastic container with a base material like dry oatmeal, large dried pasta, or water.',
            'Add a few scoops, cups, and hidden small (safe) toys.',
            'Let your toddler dig, pour, and discover.',
            'Supervise closely.'
        ],
        materials: ['Shallow bin', 'Base material (water, oats)', 'Scoops and cups', 'Small safe toys'],
        min_age_months: 18,
        max_age_months: 24,
    },
    {
        title: 'Nursery Rhyme Sing-Along',
        domain: 'Language',
        age_band: '12-18m',
        description: 'Boost vocabulary and rhythm recognition through singing.',
        instructions: [
            'Sit comfortably with your child.',
            'Sing simple, repetitive songs like "Twinkle Twinkle Little Star" or "Wheels on the Bus".',
            'Incorporate hand motions and encourage your child to mimic them.',
            'Pause before the last word of a line to see if they will fill it in.'
        ],
        materials: [],
        min_age_months: 12,
        max_age_months: 18,
    },
    {
        title: 'Passing the Ball',
        domain: 'Social',
        age_band: '18-24m',
        description: 'Introduce the concept of taking turns and cooperative play.',
        instructions: [
            'Sit on the floor facing your child with your legs spread apart.',
            'Gently roll a soft ball towards them.',
            'Encourage them to catch it and say "Your turn!"',
            'Ask them to roll it back and say "My turn!"'
        ],
        materials: ['Soft medium-sized ball'],
        min_age_months: 18,
        max_age_months: 36,
    }
];

async function seedActivities() {
    console.log('Seeding activities...');

    for (const activity of activities) {
        const { data, error } = await supabase
            .from('activities')
            .insert([activity]);

        if (error) {
            console.error(`Error inserting ${activity.title}:`, error.message);
        } else {
            console.log(`Successfully added: ${activity.title}`);
        }
    }

    console.log('Finished seeding.');
}

seedActivities();
