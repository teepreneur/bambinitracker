/**
 * BAMBINI DATABASE SEED SCRIPT
 * Creates: Parent (Triumph Tetteh), Children (Elodia & Zoe), all Activities
 * Run with:  node seed_database.mjs
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
// Use the Service Role Key (NOT anon key) — get it from:
//   Supabase Dashboard → Project Settings → API → service_role (secret)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY in .env');
    console.error('   Get it from: Supabase Dashboard → Project Settings → API → service_role');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

// ─── PARENT DETAILS ─────────────────────────────────────────────────────────
const PARENT = {
    email: 'triumphtetteh@gmail.com',
    password: '6122013@tt',
    name: 'Triumph Tetteh',
    role: 'parent',
    phone: '0248932204',
};

// ─── CHILDREN DETAILS ───────────────────────────────────────────────────────
const CHILDREN = [
    { name: 'Elodia', dob: '2024-08-28', gender: 'Girl' }, // 18 months from Feb 2026
    { name: 'Zoe', dob: '2024-02-28', gender: 'Girl' }, // 24 months from Feb 2026
];

// ─── ACTIVITIES ──────────────────────────────────────────────────────────────
const ACTIVITIES = [
    // ── GROSS MOTOR ──
    {
        title: 'Balloon Tap', domain: 'Physical', age_band: '12-18m',
        description: 'Float a lightweight balloon and encourage tapping to keep it in the air.',
        instructions: ['Float a lightweight balloon in a safe space.', 'Encourage your child to tap it to keep it in the air.', 'Count how many taps before it falls.'],
        materials: ['Lightweight balloon'], min_age_months: 12, max_age_months: 24,
    },
    {
        title: 'Obstacle Crawl', domain: 'Physical', age_band: '12-18m',
        description: 'Set up soft cushions or mats to crawl over or under to build spatial awareness.',
        instructions: ['Set up soft cushions or mats.', 'Encourage your child to crawl over or under each obstacle.', 'Observe if they navigate 2-3 obstacles without help.'],
        materials: ['Soft cushions', 'Foam mats'], min_age_months: 12, max_age_months: 24,
    },
    {
        title: 'Marching Band', domain: 'Physical', age_band: '12-18m',
        description: 'Play music and guide your child to march in place, lifting knees high.',
        instructions: ['Play some upbeat music.', 'Guide your child to march in place or around the room.', 'Lift your own knees high to demonstrate.'],
        materials: [], min_age_months: 12, max_age_months: 24,
    },
    {
        title: 'Bubble Chase', domain: 'Physical', age_band: '12-18m',
        description: 'Blow bubbles and encourage your child to chase and pop them.',
        instructions: ['Blow bubbles in a safe open space.', 'Encourage your child to chase and pop them.', 'Track if she follows and pops 3-5 bubbles.'],
        materials: ['Bubble solution', 'Bubble wand'], min_age_months: 12, max_age_months: 24,
    },
    {
        title: 'Animal Walk', domain: 'Physical', age_band: '12-18m',
        description: 'Imitate animals — hop like a bunny, waddle like a duck — to enhance coordination.',
        instructions: ['Name an animal and demonstrate its walk.', 'Encourage your child to imitate.', 'Try 2-3 different animals.'],
        materials: [], min_age_months: 12, max_age_months: 24,
    },
    {
        title: 'Dance Party', domain: 'Physical', age_band: '12-18m',
        description: 'Play upbeat music and guide your child to sway, clap, or bounce.',
        instructions: ['Put on upbeat music.', 'Dance together — sway, clap, bounce.', 'Try to sustain movement for 1 minute.'],
        materials: [], min_age_months: 12, max_age_months: 36,
    },
    {
        title: 'Simon Says', domain: 'Physical', age_band: '18-24m',
        description: 'Play Simon Says with jump, spin, or clap to build listening and motor skills.',
        instructions: ['Start with "Simon says jump!"', 'Use 3-4 different actions.', 'See how many commands they follow correctly.'],
        materials: [], min_age_months: 18, max_age_months: 36,
    },
    {
        title: 'Hopscotch', domain: 'Physical', age_band: '18-24m',
        description: 'Draw a simple 2-3 square hopscotch grid for hopping practice.',
        instructions: ['Draw a simple hopscotch grid with chalk or tape.', 'Demonstrate hopping through.', 'Encourage your child to hop through once.'],
        materials: ['Chalk or tape'], min_age_months: 18, max_age_months: 36,
    },
    {
        title: 'Kick the Ball', domain: 'Physical', age_band: '18-24m',
        description: 'Provide a soft ball to kick gently toward a target.',
        instructions: ['Place a soft ball on the ground.', 'Set a target (e.g., a cone or pillow).', 'Encourage kicking 2-3 times.'],
        materials: ['Soft ball', 'Cone or pillow'], min_age_months: 18, max_age_months: 36,
    },
    // ── FINE MOTOR ──
    {
        title: 'Stacking Cups', domain: 'Physical', age_band: '12-18m',
        description: 'Stack and knock down cups to build hand-eye coordination.',
        instructions: ['Give your child a set of stacking cups.', 'Demonstrate stacking 2-3 cups.', 'Let them knock the tower down and rebuild.'],
        materials: ['Stacking cups'], min_age_months: 12, max_age_months: 24,
    },
    {
        title: 'Finger Painting', domain: 'Creative', age_band: '12-18m',
        description: 'Use fingers to paint on paper, stimulating creativity and tactile skills.',
        instructions: ['Lay out paper and child-safe paints.', 'Encourage using fingers to make marks.', 'Name colors as they paint.'],
        materials: ['Child-safe finger paint', 'Paper'], min_age_months: 12, max_age_months: 36,
    },
    {
        title: 'Peg Board Sorting', domain: 'Cognitive', age_band: '12-18m',
        description: 'Sort large pegs by color into a pegboard to build fine motor and color skills.',
        instructions: ['Show how to push a peg into the board.', 'Ask your child to add the next peg.', 'Try sorting by color.'],
        materials: ['Peg board', 'Large pegs'], min_age_months: 12, max_age_months: 24,
    },
    {
        title: 'Playdough Press', domain: 'Creative', age_band: '18-24m',
        description: 'Press objects into playdough to make patterns, strengthening hand muscles.',
        instructions: ['Provide playdough and safe objects (e.g., shells, forks).', 'Demonstrate pressing an object to make an imprint.', 'Encourage 2-3 different imprints.'],
        materials: ['Playdough', 'Safe pressing objects'], min_age_months: 18, max_age_months: 36,
    },
    {
        title: 'Bead Stringing', domain: 'Physical', age_band: '18-24m',
        description: 'String large beads onto a cord to develop fine motor precision.',
        instructions: ['Thread a cord through a large bead to start.', 'Encourage your child to add more beads.', 'Count the beads as they go.'],
        materials: ['Large chunky beads', 'Thick cord'], min_age_months: 18, max_age_months: 36,
    },
    {
        title: 'Tong Transfer', domain: 'Physical', age_band: '18-24m',
        description: 'Use tongs to move pom-poms between bowls, building grip strength.',
        instructions: ['Provide tongs and two bowls with pom-poms in one.', 'Demonstrate transferring a pom-pom.', 'Encourage transferring 3-5 pom-poms.'],
        materials: ['Child-safe tongs', 'Pom-poms', 'Two bowls'], min_age_months: 18, max_age_months: 36,
    },
    // ── COGNITIVE ──
    {
        title: 'Peek-a-Boo', domain: 'Cognitive', age_band: '6-12m',
        description: 'A classic game to help your baby understand object permanence.',
        instructions: ['Cover your face with your hands.', 'Ask "Where am I?"', 'Reveal your face and say "Peek-a-boo!"'],
        materials: [], min_age_months: 6, max_age_months: 18,
    },
    {
        title: 'Shape Sorter', domain: 'Cognitive', age_band: '12-18m',
        description: 'Sort shapes into matching slots to build problem-solving and shape recognition.',
        instructions: ['Show your child a shape and the matching slot.', 'Guide their hand if needed.', 'Celebrate each successful sort.'],
        materials: ['Shape sorter toy'], min_age_months: 12, max_age_months: 24,
    },
    {
        title: 'Color Sorting', domain: 'Cognitive', age_band: '18-24m',
        description: 'Sort colorful objects into matching colored bowls to reinforce color recognition.',
        instructions: ['Set out 3-4 colored bowls.', 'Place colorful objects in a pile.', 'Show how red objects go in the red bowl.', 'Ask your child to sort the rest.'],
        materials: ['Colored bowls or baskets', 'Colorful child-safe objects'], min_age_months: 18, max_age_months: 36,
    },
    {
        title: 'Simple Puzzle', domain: 'Cognitive', age_band: '18-24m',
        description: 'Complete a 3-5 piece puzzle to develop spatial reasoning and persistence.',
        instructions: ['Choose a chunky puzzle with 3-5 pieces.', 'Remove all pieces and name each one.', 'Guide your child to fit them back.'],
        materials: ['Chunky child puzzle'], min_age_months: 18, max_age_months: 36,
    },
    {
        title: 'Memory Match', domain: 'Cognitive', age_band: '18-24m',
        description: 'Match pairs of cards face-down to build memory and concentration.',
        instructions: ['Lay 4-6 pairs face-down.', 'Turn over one card, then another, looking for a match.', 'Name each item as you turn cards over.'],
        materials: ['Simple picture matching cards'], min_age_months: 18, max_age_months: 36,
    },
    // ── LANGUAGE ──
    {
        title: 'Nursery Rhyme Sing-Along', domain: 'Language', age_band: '12-18m',
        description: 'Boost vocabulary and rhythm recognition through singing repeated rhymes.',
        instructions: ['Sit comfortably with your child.', 'Sing "Twinkle Twinkle" or "Wheels on the Bus".', 'Use hand motions and pause before the last word for them to fill in.'],
        materials: [], min_age_months: 12, max_age_months: 24,
    },
    {
        title: 'Picture Book Reading', domain: 'Language', age_band: '12-18m',
        description: 'Point and name objects in a picture book to build vocabulary.',
        instructions: ['Choose a bright picture book.', 'Point to each object and name it clearly.', 'Ask "What is this?" and wait for a response.'],
        materials: ['Picture book'], min_age_months: 12, max_age_months: 30,
    },
    {
        title: 'Body Parts Naming', domain: 'Language', age_band: '12-18m',
        description: 'Point to and name body parts to build vocabulary and self-awareness.',
        instructions: ['Say "Where is your nose?" and point to yours.', 'Encourage your child to point to their own.', 'Work through 4-5 body parts.'],
        materials: [], min_age_months: 12, max_age_months: 24,
    },
    {
        title: 'Animal Sounds', domain: 'Language', age_band: '12-24m',
        description: 'Match animals to their sounds to develop vocabulary and memory.',
        instructions: ['Show a picture of an animal.', 'Make its sound and ask your child to copy.', 'Try 3-4 different animals.'],
        materials: ['Animal picture cards or book'], min_age_months: 12, max_age_months: 30,
    },
    {
        title: 'Story Retelling', domain: 'Language', age_band: '18-24m',
        description: 'After reading a simple story, ask your child to retell it in their own words.',
        instructions: ['Read a simple 5-page picture book.', 'Ask "What happened first?"', 'Prompt with "And then what?"'],
        materials: ['Simple picture book'], min_age_months: 18, max_age_months: 36,
    },
    // ── SOCIAL-EMOTIONAL ──
    {
        title: 'Passing the Ball', domain: 'Social', age_band: '12-18m',
        description: 'Roll a ball back and forth to introduce turn-taking and cooperative play.',
        instructions: ['Sit on the floor facing your child.', 'Gently roll a ball toward them.', 'Encourage them to roll it back, saying "My turn, your turn!"'],
        materials: ['Soft ball'], min_age_months: 12, max_age_months: 30,
    },
    {
        title: 'Emotion Cards', domain: 'Social', age_band: '18-24m',
        description: 'Show faces with emotions (happy, sad) and ask your child to name them.',
        instructions: ['Show a card with a happy face.', 'Ask "How does this person feel?"', 'Try 2-3 different emotions.'],
        materials: ['Emotion picture cards'], min_age_months: 18, max_age_months: 36,
    },
    {
        title: 'Group Cleanup', domain: 'Social', age_band: '18-24m',
        description: 'Ask your child to help put toys away to foster cooperation and responsibility.',
        instructions: ['After playtime, say "Let\'s clean up together!"', 'Show putting one toy away.', 'Encourage 2-3 toys put away.'],
        materials: [], min_age_months: 18, max_age_months: 36,
    },
    {
        title: 'Feelings Talk', domain: 'Social', age_band: '18-24m',
        description: 'Ask your child how they feel during play to encourage emotional expression.',
        instructions: ['During play, ask "Are you happy right now?"', 'Make a happy face to prompt.', 'Accept any verbal or non-verbal response.'],
        materials: [], min_age_months: 18, max_age_months: 36,
    },
    // ── SENSORY ──
    {
        title: 'Sensory Bin Exploration', domain: 'Creative', age_band: '12-18m',
        description: 'Fill a shallow bin with rice or oats and hidden toys to stimulate the senses.',
        instructions: ['Fill a shallow bin with dry oatmeal or large pasta.', 'Add scoops and hidden small toys.', 'Let your child dig, pour, and discover.'],
        materials: ['Shallow bin', 'Dry oatmeal or large pasta', 'Scoops', 'Small safe toys'], min_age_months: 12, max_age_months: 30,
    },
    {
        title: 'Water Play', domain: 'Creative', age_band: '12-18m',
        description: 'A shallow tray of water to splash for tactile and visual stimulation.',
        instructions: ['Fill a tray with a little water.', 'Encourage splashing with hands.', 'Observe and join in the fun!'],
        materials: ['Shallow tray', 'Water'], min_age_months: 12, max_age_months: 30,
    },
    {
        title: 'Sound Shakers', domain: 'Creative', age_band: '12-18m',
        description: 'Shakers with different contents to explore auditory differences.',
        instructions: ['Provide containers filled with rice, beans, or beads.', 'Demonstrate shaking each one.', 'Ask which one is louder.'],
        materials: ['Sealed containers', 'Rice', 'Beans', 'Beads'], min_age_months: 12, max_age_months: 24,
    },
    {
        title: 'Bubble Wrap Pop', domain: 'Creative', age_band: '18-24m',
        description: 'Pop bubble wrap to engage the tactile and auditory senses.',
        instructions: ['Give your child a sheet of bubble wrap.', 'Demonstrate pressing a bubble to pop it.', 'Count the pops together!'],
        materials: ['Bubble wrap'], min_age_months: 18, max_age_months: 36,
    },
    {
        title: 'Sand Play', domain: 'Creative', age_band: '18-24m',
        description: 'Scoop and pour sand in a tray to stimulate fine motor and sensory exploration.',
        instructions: ['Fill a tray with sand.', 'Provide scoops and cups.', 'Let your child scoop and pour freely.'],
        materials: ['Sand tray', 'Scoops', 'Cups'], min_age_months: 18, max_age_months: 36,
    },
];

// ─── MAIN SEED FUNCTION ──────────────────────────────────────────────────────
async function seed() {
    console.log('🌱 Starting Bambini database seed...\n');

    // ── 1. Create parent auth user ──────────────────────────────────────────
    console.log('👤 Creating parent user...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: PARENT.email,
        password: PARENT.password,
        options: { data: { full_name: PARENT.name, role: PARENT.role } }
    });

    let parentProfileId;

    if (signUpError) {
        if (signUpError.message.includes('already registered')) {
            console.log('   ℹ️  User already exists — signing in instead...');
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email: PARENT.email,
                password: PARENT.password,
            });
            if (signInError) { console.error('❌ Sign-in error:', signInError.message); process.exit(1); }
            parentProfileId = signInData.user.id;
        } else {
            console.error('❌ Sign-up error:', signUpError.message); process.exit(1);
        }
    } else {
        parentProfileId = signUpData.user.id;
    }

    console.log(`   ✅ Parent ID: ${parentProfileId}`);

    // ── 2. Upsert profile row ───────────────────────────────────────────────
    console.log('📋 Upserting profile...');
    const { error: profileError } = await supabase.from('profiles').upsert({
        id: parentProfileId,
        name: PARENT.name,
        email: PARENT.email,
        role: PARENT.role,
        phone: PARENT.phone,
    }, { onConflict: 'id' });
    if (profileError) console.warn('   ⚠️  Profile upsert warning:', profileError.message);
    else console.log('   ✅ Profile ready');

    // ── 3. Upsert children ──────────────────────────────────────────────────
    console.log('\n👧 Adding children...');
    const childIds = [];
    for (const child of CHILDREN) {
        // Check if child already exists linked to parent
        const { data: existingLinks } = await supabase
            .from('parent_children')
            .select('child_id, children(name)')
            .eq('parent_id', parentProfileId);

        const alreadyLinked = existingLinks?.find(l => l.children?.name === child.name);
        if (alreadyLinked) {
            console.log(`   ℹ️  ${child.name} already linked — skipping`);
            childIds.push(alreadyLinked.child_id);
            continue;
        }

        const { data: childData, error: childError } = await supabase
            .from('children')
            .insert({ name: child.name, dob: child.dob, gender: child.gender })
            .select().single();

        if (childError) { console.error(`❌ Child insert error (${child.name}):`, childError.message); continue; }

        const { error: linkError } = await supabase
            .from('parent_children')
            .insert({ parent_id: parentProfileId, child_id: childData.id });

        if (linkError) { console.error(`❌ Link error (${child.name}):`, linkError.message); continue; }

        childIds.push(childData.id);
        console.log(`   ✅ ${child.name} added (DOB: ${child.dob})`);
    }

    // ── 4. Seed activities ──────────────────────────────────────────────────
    console.log('\n🎯 Seeding activities...');
    // Clear existing activities first to avoid duplicates
    await supabase.from('activities').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    let activityCount = 0;
    for (const activity of ACTIVITIES) {
        const { error } = await supabase.from('activities').insert(activity);
        if (error) console.warn(`   ⚠️  Activity "${activity.title}": ${error.message}`);
        else { activityCount++; process.stdout.write('.'); }
    }
    console.log(`\n   ✅ ${activityCount}/${ACTIVITIES.length} activities seeded`);

    // ── 5. Assign Activities to Children ──────────────────────────────────────────────
    console.log('\n📅 Assigning mixed activities to children...');
    const { data: allActivities } = await supabase.from('activities').select('id, domain');
    if (allActivities && allActivities.length > 0) {
        // Clear existing assignments to avoid duplicates
        await supabase.from('child_activities').delete().in('child_id', childIds);

        const domains = ['Physical', 'Cognitive', 'Language', 'Social', 'Creative'];

        for (const childId of childIds) {
            let assignedIds = [];
            // Assign one from each domain
            for (const domain of domains) {
                const domainActs = allActivities.filter(a => a.domain === domain && !assignedIds.includes(a.id));
                if (domainActs.length > 0) {
                    const act = domainActs[Math.floor(Math.random() * domainActs.length)];
                    assignedIds.push(act.id);
                }
            }

            // Pad to 7 activities with random ones
            while (assignedIds.length < 7) {
                const randomAct = allActivities[Math.floor(Math.random() * allActivities.length)];
                if (!assignedIds.includes(randomAct.id)) {
                    assignedIds.push(randomAct.id);
                }
            }

            for (const actId of assignedIds) {
                const { data, error } = await supabase.from('child_activities').insert({
                    child_id: childId,
                    activity_id: actId
                }).select();
                if (error) {
                    console.error(`❌ child_activities INSERT ERROR for child ${childId}:`, error);
                } else if (!data || data.length === 0) {
                    console.warn(`⚠️ No data returned for insert! child_id=${childId}, activity_id=${actId}`);
                }
            }
        }
        console.log(`   ✅ Activities assigned to children`);
    }

    console.log('\n🎉 Seed complete!');
    console.log(`\n📱 Login with:`);
    console.log(`   Email:    ${PARENT.email}`);
    console.log(`   Password: ${PARENT.password}`);
}

seed().catch(console.error);
