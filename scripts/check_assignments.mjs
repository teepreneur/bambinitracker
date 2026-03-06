import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data: ca } = await supabase.from('child_activities').select('*');
    console.log("Child Activities Count:", ca?.length || 0);

    const { data: act } = await supabase.from('activities').select('id, title').limit(2);
    console.log("Activities Count:", act?.length || 0);
}
run();
