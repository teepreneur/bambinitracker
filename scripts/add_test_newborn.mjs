import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addTestNewborn() {
    const email = 'triumphtetteh@gmail.com';
    const { data: user } = await supabase.from('profiles').select('id').eq('email', email).single();

    if (!user) {
        console.error('User not found');
        return;
    }

    const today = new Date().toISOString().split('T')[0];
    const { data: child, error: childError } = await supabase.from('children').insert({
        name: 'Newborn Baby',
        dob: today,
        gender: 'Boy'
    }).select().single();

    if (childError) {
        console.error('Error adding child:', childError.message);
        return;
    }

    const { error: linkError } = await supabase.from('parent_children').insert({
        parent_id: user.id,
        child_id: child.id
    });

    if (linkError) {
        console.error('Error linking child:', linkError.message);
    } else {
        console.log(`✅ Successfully added newborn 'Newborn Baby' for ${email}`);
    }
}

addTestNewborn().catch(console.error);
