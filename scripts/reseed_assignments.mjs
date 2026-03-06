import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log('Fetching children...');
    const { data: children, error: childErr } = await supabase.from('children').select('id');
    if (childErr || !children) {
        console.error('Failed to fetch children:', childErr);
        return;
    }

    console.log(`Found ${children.length} children. Fetching activities...`);
    const { data: activities, error: actErr } = await supabase.from('activities').select('id');
    if (actErr || !activities) {
        console.error('Failed to fetch activities:', actErr);
        return;
    }
    console.log(`Found ${activities.length} activities.`);

    const childActivitiesToInsert = [];

    // Assign 8 random activities to each child
    for (const child of children) {
        // Shuffle activities
        const shuffled = [...activities].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 8);

        for (const act of selected) {
            childActivitiesToInsert.push({
                child_id: child.id,
                activity_id: act.id,
            });
        }
    }

    if (childActivitiesToInsert.length > 0) {
        console.log(`Inserting ${childActivitiesToInsert.length} child_activities...`);
        const { error: insErr } = await supabase.from('child_activities').insert(childActivitiesToInsert);
        if (insErr) {
            console.error('Insert error:', insErr);
        } else {
            console.log('✅ Successfully assigned activities to all children.');
        }
    } else {
        console.log('No assignments to make.');
    }
}
run();
