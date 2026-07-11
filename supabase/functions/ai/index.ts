// ============================================================================
// ai — Supabase Edge Function
// ============================================================================
// Server-side wrapper around Gemini so the API key never ships in the app
// bundle. Handles two actions:
//   * generate_activities   — daily developmental activity suggestions
//   * synthesize_milestones — infer milestone progress from observations
//
// Requires the caller's Supabase JWT (verify_jwt is on by default) and the
// GEMINI_API_KEY secret (NOT an EXPO_PUBLIC_* value).
// ============================================================================

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function callGemini(prompt: string, temperature: number): Promise<string> {
  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature },
    }),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error?.message || 'Gemini request failed')
  }
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

function cleanJson(text: string): string {
  return text.replace(/```json/gi, '').replace(/```/g, '').trim()
}

// ---------------------------------------------------------------------------
// generate_activities
// ---------------------------------------------------------------------------
function buildActivityPrompt(input: {
  ageDays: number
  count: number
  recentFeedback: { title: string; rating: string; note: string }[]
  existingTitles: string[]
  emergingMilestones: string[]
}): string {
  const { ageDays, count, recentFeedback, existingTitles, emergingMilestones } = input

  let ageContext = ''
  if (ageDays < 25) {
    ageContext = `${ageDays} days old (Newborn phase). Focus on very gentle sensory, visual, and bonding activities appropriate for the fragile newborn state. Emphasize maternal bonding and soothing.`
  } else if (ageDays < 365) {
    const months = Math.floor(ageDays / 30.4375)
    ageContext = `${months} months old (Infant phase). Focus on fundamental motor skills, babbling, reaching, and sensory exploration.`
  } else if (ageDays < 1095) {
    const months = Math.floor(ageDays / 30.4375)
    ageContext = `${months} months old (Toddler phase). Focus on active play, burgeoning vocabulary, fine motor coordination, and simple problem-solving.`
  } else {
    const years = Math.floor(ageDays / 365)
    ageContext = `${years} years old (Preschooler phase). Focus on complex play, emotional regulation, advanced coordination, and early learning concepts.`
  }

  let feedbackContext = ''
  if (recentFeedback?.length > 0) {
    const feedbackStrings = recentFeedback
      .map((f) => `- Activity: "${f.title}", Rating: ${f.rating}, Notes: "${f.note}"`)
      .join('\n')
    feedbackContext = `
RECENT FEEDBACK FROM PARENTS:
The parent recently provided the following feedback on activities the child completed:
${feedbackStrings}

Please use this feedback to adjust your recommendations. For example, if an activity was "Too hard", suggest slightly simpler ones. If the parent noted the child enjoyed something specific, provide more activities in that vein.
`
  }

  let existingContext = ''
  if (existingTitles?.length > 0) {
    existingContext = `
IMPORTANT RULES TO AVOID DUPLICATES:
The child already has the following activities assigned for today:
${existingTitles.map((t) => `- "${t}"`).join('\n')}

You MUST NOT generate any activities with these exact titles, and you MUST NOT generate activities that are highly similar conceptually to these existing ones.
`
  }

  let milestonesContext = ''
  if (emergingMilestones?.length > 0) {
    milestonesContext = `
CURRENT DEVELOPMENTAL GOALS:
The child is currently trying to master the following "emerging" milestones:
${emergingMilestones.map((m) => `- "${m}"`).join('\n')}

Whenever possible, prioritize generating activities that directly help the child practice and achieve these specific milestones. Briefly mention how the activity helps with the milestone in the description.
`
  }

  return `
You are an expert pediatric occupational therapist and early childhood development specialist.
Your task is to perfectly tailor a set of daily developmental activities for a child who is exactly ${ageContext}
${feedbackContext}
${existingContext}
${milestonesContext}

Generate exactly ${count} highly engaging, premium-quality activities.

Each activity must have:
1. "title": A short, catchy, engaging title (max 5 words). MUST BE UNIQUE.
2. "description": A high-quality, encouraging paragraph explaining the developmental value and overall goal. Describe the 'Magic' in this activity.
3. "instructions": A JSON array of 3-5 clear, step-by-step strings for the parent to follow.
4. "materials": A JSON array of 2-4 strings listing any common household items needed.
5. "tips": A JSON array of 1-3 expert "specialist tips" for deepening the engagement or safety.
6. "domain": Must be exactly one of "Cognitive", "Motor", "Language", "Social", or "Sensory".
7. "estimated_time": A short string like "5 min", "10 min" etc.
8. "target_age_months": Approximate target age in months.
9. "target_milestone": If any of the "CURRENT DEVELOPMENTAL GOALS" (emerging milestones) provided above match this activity, include the EXACT milestone title here. If none match, leave this as an empty string.

IMPORTANT: Return the data STRICTLY as a JSON array of objects matching the fields above. Output raw JSON only.
`
}

function sanitizeActivities(raw: unknown, ageDays: number, count: number) {
  const validDomains = ['Cognitive', 'Motor', 'Language', 'Social', 'Sensory']
  const list = Array.isArray(raw) ? raw : []
  return list
    .map((a: any) => ({
      title: String(a.title || 'Untitled Activity').slice(0, 50),
      description: String(a.description || 'No description provided.'),
      domain: validDomains.includes(a.domain) ? a.domain : 'Cognitive',
      estimated_time: String(a.estimated_time || '10 min').includes('min') ? a.estimated_time : '10 min',
      target_age_months: Number(a.target_age_months) || Math.floor(ageDays / 30.4375),
      target_milestone: a.target_milestone && typeof a.target_milestone === 'string' ? a.target_milestone : undefined,
      instructions: Array.isArray(a.instructions) ? a.instructions.map(String) : [],
      materials: Array.isArray(a.materials) ? a.materials.map(String) : [],
      tips: Array.isArray(a.tips) ? a.tips.map(String) : [],
    }))
    .slice(0, count)
}

// ---------------------------------------------------------------------------
// synthesize_milestones
// ---------------------------------------------------------------------------
function buildSynthesisPrompt(input: {
  childName: string
  ageMonths: number
  observations: { title: string; note: string; domain: string }[]
  potentialMilestones: { id: string; title: string; description: string; domain: string }[]
}): string {
  const obsText = input.observations
    .map((o) => `- Activity: "${o.title}", Note: "${o.note}", Domain: ${o.domain}`)
    .join('\n')
  const milestoneText = input.potentialMilestones
    .map((m) => `- ID: ${m.id}, Title: "${m.title}", Description: "${m.description}", Domain: ${m.domain}`)
    .join('\n')

  return `
You are a pediatric developmental specialist. Analysis of child observation notes to identify milestone achievements.

CHILD CONTEXT:
Name: ${input.childName}
Age: ${input.ageMonths} months

RECENT OBSERVATIONS (Activity Logs and Parent Notes):
${obsText}

TARGET MILESTONES (Current developmental goals for this age):
${milestoneText}

TASK:
Review the observations. If any observation clearly suggests that ${input.childName} is showing signs of achieving one of the target milestones, return that specific milestone.
Be conservative. Only suggest a transition if the note provides concrete evidence.

RESPONSE FORMAT:
Return a SINGLE JSON object (or null if no milestone matches) with these fields:
1. "milestone_id": The exact ID from the target milestones list.
2. "suggested_status": Either "achieved" (if mastered) or "emerging" (if showing signs but not fully mastered).
3. "reasoning": A 1-sentence explanation of why this milestone matches the observation, addressed to the parent.

Strictly raw JSON. Do not include markdown.
`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  if (!GEMINI_API_KEY) return json({ error: 'AI is not configured' }, 500)

  try {
    const { action, payload } = await req.json().catch(() => ({}))

    if (action === 'generate_activities') {
      const input = {
        ageDays: Number(payload?.ageDays) || 0,
        count: Number(payload?.count) || 5,
        recentFeedback: payload?.recentFeedback ?? [],
        existingTitles: payload?.existingTitles ?? [],
        emergingMilestones: payload?.emergingMilestones ?? [],
      }
      const text = await callGemini(buildActivityPrompt(input), 0.7)
      const parsed = JSON.parse(cleanJson(text || '[]'))
      return json({ activities: sanitizeActivities(parsed, input.ageDays, input.count) })
    }

    if (action === 'synthesize_milestones') {
      const input = {
        childName: String(payload?.childName ?? ''),
        ageMonths: Number(payload?.ageMonths) || 0,
        observations: payload?.observations ?? [],
        potentialMilestones: payload?.potentialMilestones ?? [],
      }
      if (input.observations.length === 0 || input.potentialMilestones.length === 0) {
        return json({ insight: null })
      }
      const text = await callGemini(buildSynthesisPrompt(input), 0.1)
      const cleaned = cleanJson(text || 'null')
      const insight = cleaned === 'null' ? null : JSON.parse(cleaned)
      return json({ insight })
    }

    return json({ error: 'Unknown action' }, 400)
  } catch (error) {
    return json({ error: (error as Error).message ?? 'AI request failed' }, 500)
  }
})
