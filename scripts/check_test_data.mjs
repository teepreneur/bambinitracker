import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
    const email = 'triumphtetteh@gmail.com';
    console.log(`🔍 Checking data for ${email}...`);

    const { data: user } = await supabase.from('profiles').select('id, name').eq('email', email).single();
    if (!user) {
        console.error('❌ User not found');
        return;
    }
    console.log(`✅ Found user: ${user.name} (${user.id})`);

    const { data: children } = await supabase.from('children').select('*').order('created_at', { ascending: false });
    console.log(`👶 Total children in DB: ${children?.length || 0}`);
    children?.forEach(c => console.log(`   - ${c.name} (DOB: ${c.dob}, ID: ${c.id})`));

    const { data: links } = await supabase.from('parent_children').select('*').eq('parent_id', user.id);
    console.log(`🔗 Links for this parent: ${links?.length || 0}`);
    links?.forEach(l => console.log(`   - Child ID: ${l.child_id}`));
}

check().catch(console.error);
