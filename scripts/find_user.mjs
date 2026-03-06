import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function find() {
    const { data: users, error } = await supabase.from('profiles').select('email, name, id').limit(10);
    if (error) {
        console.error('❌ Error:', error.message);
        return;
    }
    console.log('👥 Found users:');
    users?.forEach(u => console.log(`   - ${u.name} (${u.email}, ID: ${u.id})`));
}

find().catch(console.error);
