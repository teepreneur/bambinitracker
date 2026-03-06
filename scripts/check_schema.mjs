import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data: obs } = await supabase.from('observations').select('*').limit(1);
    console.log("Observations structure:", obs?.[0] ? Object.keys(obs[0]) : "Empty");

    const { data: cm } = await supabase.from('child_milestones').select('*').limit(1);
    console.log("Child Milestones structure:", cm?.[0] ? Object.keys(cm[0]) : "Empty");

    const { data: ca } = await supabase.from('child_activities').select('*').limit(1);
    console.log("Child Activities structure:", ca?.[0] ? Object.keys(ca[0]) : "Empty");

    const { data: ml } = await supabase.from('milestones').select('*').limit(1);
    console.log("Milestones structure:", ml?.[0] ? Object.keys(ml[0]) : "Empty");
}
run();
