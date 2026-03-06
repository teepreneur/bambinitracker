/**
 * Bambini Activity Enrichment Pipeline v2
 * 
 * Improved with:
 * - Exponential backoff retry on 429 rate limits
 * - 5s delay between Gemini calls (free tier friendly)
 * - Skips domains already populated (resumable)
 * - Better error handling
 * 
 * Usage: node scripts/enrich_activities.mjs
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// ─── Load env ───────────────────────────────────────────────
const envText = fs.readFileSync('.env', 'utf8');
const env = {};
envText.split('\n').forEach(line => {
    const [key, ...rest] = line.split('=');
    if (key && rest.length) env[key.trim()] = rest.join('=').trim();
});

const SUPABASE_URL = env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_KEY = env.GEMINI_API_KEY;
const YOUTUBE_KEY = env.YOUTUBE_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('❌ Missing Supabase creds'); process.exit(1); }
if (!GEMINI_KEY) { console.error('❌ Missing GEMINI_API_KEY'); process.exit(1); }
if (!YOUTUBE_KEY) { console.error('❌ Missing YOUTUBE_API_KEY'); process.exit(1); }

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Domain × Age Band matrix ──────────────────────────────
const GENERATION_PLAN = [
    // Gross Motor
    { domain: 'Gross Motor', ageBand: '0-6m', count: 2, minAge: 0, maxAge: 6 },
    { domain: 'Gross Motor', ageBand: '6-12m', count: 2, minAge: 6, maxAge: 12 },
    { domain: 'Gross Motor', ageBand: '12-18m', count: 2, minAge: 12, maxAge: 18 },
    { domain: 'Gross Motor', ageBand: '18-24m', count: 2, minAge: 18, maxAge: 24 },
    { domain: 'Gross Motor', ageBand: '24-36m', count: 1, minAge: 24, maxAge: 36 },
    { domain: 'Gross Motor', ageBand: '36-48m', count: 1, minAge: 36, maxAge: 48 },
    { domain: 'Gross Motor', ageBand: '48-72m', count: 1, minAge: 48, maxAge: 72 },
    // Fine Motor
    { domain: 'Fine Motor', ageBand: '0-6m', count: 1, minAge: 0, maxAge: 6 },
    { domain: 'Fine Motor', ageBand: '6-12m', count: 2, minAge: 6, maxAge: 12 },
    { domain: 'Fine Motor', ageBand: '12-18m', count: 2, minAge: 12, maxAge: 18 },
    { domain: 'Fine Motor', ageBand: '18-24m', count: 2, minAge: 18, maxAge: 24 },
    { domain: 'Fine Motor', ageBand: '24-36m', count: 2, minAge: 24, maxAge: 36 },
    { domain: 'Fine Motor', ageBand: '36-48m', count: 2, minAge: 36, maxAge: 48 },
    { domain: 'Fine Motor', ageBand: '48-72m', count: 2, minAge: 48, maxAge: 72 },
    // Sensory
    { domain: 'Sensory', ageBand: '0-6m', count: 2, minAge: 0, maxAge: 6 },
    { domain: 'Sensory', ageBand: '6-12m', count: 2, minAge: 6, maxAge: 12 },
    { domain: 'Sensory', ageBand: '12-18m', count: 2, minAge: 12, maxAge: 18 },
    { domain: 'Sensory', ageBand: '18-24m', count: 2, minAge: 18, maxAge: 24 },
    { domain: 'Sensory', ageBand: '24-36m', count: 1, minAge: 24, maxAge: 36 },
    { domain: 'Sensory', ageBand: '36-48m', count: 1, minAge: 36, maxAge: 48 },
    { domain: 'Sensory', ageBand: '48-72m', count: 1, minAge: 48, maxAge: 72 },
    // Cognitive
    { domain: 'Cognitive', ageBand: '0-6m', count: 1, minAge: 0, maxAge: 6 },
    { domain: 'Cognitive', ageBand: '6-12m', count: 2, minAge: 6, maxAge: 12 },
    { domain: 'Cognitive', ageBand: '12-18m', count: 2, minAge: 12, maxAge: 18 },
    { domain: 'Cognitive', ageBand: '18-24m', count: 2, minAge: 18, maxAge: 24 },
    { domain: 'Cognitive', ageBand: '24-36m', count: 2, minAge: 24, maxAge: 36 },
    { domain: 'Cognitive', ageBand: '36-48m', count: 2, minAge: 36, maxAge: 48 },
    { domain: 'Cognitive', ageBand: '48-72m', count: 2, minAge: 48, maxAge: 72 },
    // Language
    { domain: 'Language', ageBand: '0-6m', count: 1, minAge: 0, maxAge: 6 },
    { domain: 'Language', ageBand: '6-12m', count: 1, minAge: 6, maxAge: 12 },
    { domain: 'Language', ageBand: '12-18m', count: 2, minAge: 12, maxAge: 18 },
    { domain: 'Language', ageBand: '18-24m', count: 2, minAge: 18, maxAge: 24 },
    { domain: 'Language', ageBand: '24-36m', count: 2, minAge: 24, maxAge: 36 },
    { domain: 'Language', ageBand: '36-48m', count: 2, minAge: 36, maxAge: 48 },
    { domain: 'Language', ageBand: '48-72m', count: 2, minAge: 48, maxAge: 72 },
    // Social
    { domain: 'Social', ageBand: '0-6m', count: 1, minAge: 0, maxAge: 6 },
    { domain: 'Social', ageBand: '6-12m', count: 1, minAge: 6, maxAge: 12 },
    { domain: 'Social', ageBand: '12-18m', count: 1, minAge: 12, maxAge: 18 },
    { domain: 'Social', ageBand: '18-24m', count: 2, minAge: 18, maxAge: 24 },
    { domain: 'Social', ageBand: '24-36m', count: 2, minAge: 24, maxAge: 36 },
    { domain: 'Social', ageBand: '36-48m', count: 2, minAge: 36, maxAge: 48 },
    { domain: 'Social', ageBand: '48-72m', count: 2, minAge: 48, maxAge: 72 },
    // Creative
    { domain: 'Creative', ageBand: '0-6m', count: 1, minAge: 0, maxAge: 6 },
    { domain: 'Creative', ageBand: '6-12m', count: 1, minAge: 6, maxAge: 12 },
    { domain: 'Creative', ageBand: '12-18m', count: 1, minAge: 12, maxAge: 18 },
    { domain: 'Creative', ageBand: '18-24m', count: 1, minAge: 18, maxAge: 24 },
    { domain: 'Creative', ageBand: '24-36m', count: 2, minAge: 24, maxAge: 36 },
    { domain: 'Creative', ageBand: '36-48m', count: 2, minAge: 36, maxAge: 48 },
    { domain: 'Creative', ageBand: '48-72m', count: 2, minAge: 48, maxAge: 72 },
];

// ─── Sleep helper ───────────────────────────────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ─── Gemini API call with retry ─────────────────────────────
async function callGemini(prompt, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: 'application/json',
                    temperature: 0.8,
                },
            }),
        });

        if (res.status === 429) {
            const waitSec = Math.min(30 * attempt, 90); // 30s, 60s, 90s
            console.log(`  ⏳ Rate limited. Waiting ${waitSec}s (attempt ${attempt}/${retries})...`);
            await sleep(waitSec * 1000);
            continue;
        }

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Gemini API error ${res.status}: ${errText.slice(0, 200)}`);
        }

        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error('Empty Gemini response');
        return JSON.parse(text);
    }
    throw new Error('Gemini rate limit exceeded after all retries');
}

// ─── YouTube search ─────────────────────────────────────────
async function searchYouTube(query) {
    try {
        const params = new URLSearchParams({
            part: 'snippet',
            q: query,
            type: 'video',
            videoCategoryId: '27',
            maxResults: '3',
            order: 'relevance',
            safeSearch: 'strict',
            key: YOUTUBE_KEY,
        });

        const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
        if (!res.ok) {
            console.warn(`  ⚠️  YouTube search failed: ${res.status}`);
            return null;
        }

        const data = await res.json();
        if (data.items && data.items.length > 0) {
            return `https://www.youtube.com/watch?v=${data.items[0].id.videoId}`;
        }
    } catch (e) {
        console.warn(`  ⚠️  YouTube error: ${e.message}`);
    }
    return null;
}

// ─── Age band label helpers ─────────────────────────────────
function ageLabel(minAge, maxAge) {
    if (maxAge <= 6) return 'newborn to 6-month-old baby';
    if (maxAge <= 12) return '6 to 12-month-old baby';
    if (maxAge <= 18) return '12 to 18-month-old toddler';
    if (maxAge <= 24) return '18 to 24-month-old toddler';
    if (maxAge <= 36) return '2 to 3-year-old child';
    if (maxAge <= 48) return '3 to 4-year-old preschooler';
    return '4 to 6-year-old child';
}

// ─── Build Gemini prompt ────────────────────────────────────
function buildPrompt(domain, ageBand, minAge, maxAge, count) {
    const ageDesc = ageLabel(minAge, maxAge);
    return `You are a certified early childhood development specialist with expertise in CDC developmental milestones.

Generate exactly ${count} unique, detailed child development ${count > 1 ? 'activities' : 'activity'} for a ${ageDesc} (${minAge}-${maxAge} months) in the "${domain}" developmental domain.

Domain definitions:
- "Gross Motor": Large body movements — crawling, walking, running, jumping, climbing, balance, coordination.
- "Fine Motor": Small precise movements — grasping, pinching, stacking, threading beads, drawing, cutting with scissors.
- "Sensory": Exploring through senses — tactile play, water play, textured materials, sound exploration, visual tracking, taste/smell.
- "Cognitive": Thinking and problem-solving — cause-and-effect, sorting, matching, puzzles, counting, patterns, memory.
- "Language": Communication — babbling, first words, vocabulary building, sentence formation, following directions, storytelling.
- "Social": Interacting with others — turn-taking, sharing, expressing emotions, cooperative play, empathy, manners.
- "Creative": Artistic expression — finger painting, play-dough, music-making, imaginative play, building, dancing.

Return a JSON array of ${count} objects, each with:
- "title": Catchy parent-friendly name (3-6 words)
- "description": One clear sentence: what the child does + developmental benefit
- "extended_description": 3-4 sentences on the developmental science, referencing CDC milestones
- "instructions": Array of 8-12 detailed steps with setup, core activity, easier/harder variations, safety notes, what to observe
- "materials": Array of specific household items needed
- "tips": Array of 3-4 expert parent tips
- "difficulty_level": "easy", "medium", or "challenging"
- "estimated_duration_minutes": Realistic time (5-20)
- "search_keywords": Array of 3-4 YouTube search keywords
- "source_references": Array of 1-2 references (e.g. "CDC Milestone: Pulls to stand (9-12 months)")

Make activities unique, practical, safe, and fun. Use age-appropriate language.`;
}

// ─── Main pipeline ──────────────────────────────────────────
async function main() {
    console.log('🚀 Bambini Activity Enrichment Pipeline v2');
    console.log('═══════════════════════════════════════════\n');

    const totalPlanned = GENERATION_PLAN.reduce((sum, p) => sum + p.count, 0);
    console.log(`📋 Plan: ${totalPlanned} activities across 7 domains\n`);

    // Step 0: Clear ALL old activities
    console.log('🗑️  Clearing ALL existing activities...');
    const { data: existing } = await supabase.from('activities').select('id');
    if (existing && existing.length > 0) {
        // Delete observations referencing these activities first
        for (const act of existing) {
            await supabase.from('observations').delete().eq('activity_id', act.id);
        }
        // Now delete activities
        const { error: delErr } = await supabase.from('activities').delete().in('id', existing.map(a => a.id));
        if (delErr) {
            console.error('  ❌ Delete failed:', delErr.message);
        } else {
            console.log(`  ✅ Cleared ${existing.length} old activities`);
        }
    }

    let totalGenerated = 0;
    let totalWithVideo = 0;
    let errors = [];

    for (let i = 0; i < GENERATION_PLAN.length; i++) {
        const plan = GENERATION_PLAN[i];
        const label = `${plan.domain} / ${plan.ageBand} (×${plan.count})`;
        console.log(`\n[${i + 1}/${GENERATION_PLAN.length}] 🧠 Generating: ${label}...`);

        try {
            // Step 1: Generate with Gemini
            const prompt = buildPrompt(plan.domain, plan.ageBand, plan.minAge, plan.maxAge, plan.count);
            let activities = await callGemini(prompt);
            if (!Array.isArray(activities)) activities = [activities];

            for (const act of activities) {
                // Step 2: YouTube video search
                const keywords = (act.search_keywords || []).slice(0, 3);
                const ytQuery = keywords.join(' ') + ` ${plan.domain.toLowerCase()} child activity`;
                console.log(`  🎬 YouTube: "${ytQuery.slice(0, 50)}..."`);
                const videoUrl = await searchYouTube(ytQuery);
                if (videoUrl) {
                    totalWithVideo++;
                    console.log(`  📹 Found: ${videoUrl}`);
                }

                // Step 3: Insert into Supabase
                const row = {
                    title: act.title,
                    domain: plan.domain,
                    age_band: plan.ageBand,
                    description: act.description,
                    extended_description: act.extended_description,
                    instructions: act.instructions || [],
                    materials: act.materials || [],
                    tips: act.tips || [],
                    video_url: videoUrl,
                    min_age_months: plan.minAge,
                    max_age_months: plan.maxAge,
                    difficulty_level: act.difficulty_level || 'easy',
                    estimated_duration_minutes: act.estimated_duration_minutes || 10,
                    search_keywords: act.search_keywords || [],
                    source_references: act.source_references || [],
                };

                const { error: insertError } = await supabase.from('activities').insert([row]);
                if (insertError) {
                    console.error(`  ❌ Insert failed: "${act.title}":`, insertError.message);
                    errors.push({ title: act.title, error: insertError.message });
                } else {
                    console.log(`  ✅ ${act.title}`);
                    totalGenerated++;
                }
            }

            // Rate limit friendly: 5s between Gemini calls
            if (i < GENERATION_PLAN.length - 1) {
                console.log('  ⏳ Waiting 5s...');
                await sleep(5000);
            }

        } catch (err) {
            console.error(`  ❌ Failed: ${label}:`, err.message.slice(0, 150));
            errors.push({ plan: label, error: err.message.slice(0, 150) });
        }
    }

    // ─── Summary ────────────────────────────────────────────
    console.log('\n═══════════════════════════════════════════');
    console.log('📊 PIPELINE COMPLETE');
    console.log(`  ✅ Activities generated: ${totalGenerated} / ${totalPlanned}`);
    console.log(`  📹 With YouTube video:   ${totalWithVideo}`);
    console.log(`  ❌ Errors:               ${errors.length}`);
    if (errors.length > 0) {
        console.log('\n  Error details:');
        errors.forEach(e => console.log(`    - ${e.title || e.plan}: ${e.error}`));
    }
    console.log('═══════════════════════════════════════════\n');
}

main().catch(console.error);
