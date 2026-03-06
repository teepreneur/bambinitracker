import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL!,
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkRLS() {
    console.log("Attempting to insert a mock activity with the ANON key (to simulate the app's user session)...");

    // Attempting an insert as if logged in requires a session, but let's see what the plain error is first 
    // when trying to insert into `activities`
    const { data, error } = await supabase.from('activities').insert({
        title: 'Test RLS Activity',
        description: 'Testing if RLS allows inserts.',
        domain: 'Cognitive',
        min_age_months: 0,
        max_age_months: 1,
        estimated_duration_minutes: 5
    }).select();

    if (error) {
        console.error("❌ RLS Blocked Insert:", error.message);
    } else {
        console.log("✅ Insert succeeded!");
    }
}

checkRLS();
