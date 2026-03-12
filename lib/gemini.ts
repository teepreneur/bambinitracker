import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
    console.warn("EXPO_PUBLIC_GEMINI_API_KEY is not defined in the environment. Gemini integrations will fail.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

// Define the activity structure expected by the app.
export interface GeneratedActivity {
    title: string;
    description: string;
    domain: 'Cognitive' | 'Motor' | 'Language' | 'Social' | 'Sensory';
    estimated_time: string; // e.g., "10 min"
    target_age_months: number;
}

// Define recent feedback structure
export interface RecentFeedback {
    title: string;
    rating: string;
    note: string;
}

export async function generateActivities(
    ageDays: number,
    count: number = 5,
    recentFeedback: RecentFeedback[] = [],
    existingTitles: string[] = []
): Promise<GeneratedActivity[]> {
    if (!apiKey) {
        throw new Error("Gemini API key is missing. Please set EXPO_PUBLIC_GEMINI_API_KEY in your .env file.");
    }

    // Determine age context
    let ageContext = "";
    if (ageDays < 25) {
        ageContext = `${ageDays} days old (Newborn phase). Focus on very gentle sensory, visual, and bonding activities appropriate for the fragile newborn state. Emphasize maternal bonding and soothing.`;
    } else if (ageDays < 365) {
        const months = Math.floor(ageDays / 30.4375);
        ageContext = `${months} months old (Infant phase). Focus on fundamental motor skills, babbling, reaching, and sensory exploration.`;
    } else if (ageDays < 1095) {
        const months = Math.floor(ageDays / 30.4375);
        ageContext = `${months} months old (Toddler phase). Focus on active play, burgeoning vocabulary, fine motor coordination, and simple problem-solving.`;
    } else {
        const years = Math.floor(ageDays / 365);
        ageContext = `${years} years old (Preschooler phase). Focus on complex play, emotional regulation, advanced coordination, and early learning concepts.`;
    }

    let feedbackContext = "";
    if (recentFeedback && recentFeedback.length > 0) {
        const feedbackStrings = recentFeedback.map(f =>
            `- Activity: "${f.title}", Rating: ${f.rating}, Notes: "${f.note}"`
        ).join('\n');

        feedbackContext = `
RECENT FEEDBACK FROM PARENTS:
The parent recently provided the following feedback on activities the child completed:
${feedbackStrings}

Please use this feedback to adjust your recommendations. For example, if an activity was "Too hard", suggest slightly simpler ones. If the parent noted the child enjoyed something specific, provide more activities in that vein.
`;
    }

    let existingContext = "";
    if (existingTitles && existingTitles.length > 0) {
        existingContext = `
IMPORTANT RULES TO AVOID DUPLICATES:
The child already has the following activities assigned for today:
${existingTitles.map(t => `- "${t}"`).join('\n')}

You MUST NOT generate any activities with these exact titles, and you MUST NOT generate activities that are highly similar conceptually to these existing ones.
`;
    }

    const prompt = `
You are an expert pediatric occupational therapist and early childhood development specialist. 
Your task is to perfectly tailor a set of daily developmental activities for a child who is exactly ${ageContext}
${feedbackContext}
${existingContext}

Generate exactly ${count} highly engaging activities.

Each activity must have:
1. "title": A short, catchy, engaging title (max 5 words). MUST BE UNIQUE. Do not generate two activities with the same or highly similar titles.
2. "description": A clear, concise 2-3 sentence instruction for the parent on exactly what to do and what development it aids.
3. "domain": Must be exactly one of "Cognitive", "Motor", "Language", "Social", or "Sensory". Try to provide a mix of domains.
4. "estimated_time": A short string like "5 min", "10 min", "15 min" etc.
5. "target_age_months": Approximate target age in months (use 0 for newborns).

IMPORTANT: Return the data STRICTLY as a JSON array of objects matching the fields above. Do not include markdown formatting like \`\`\`json or \`\`\`. Output raw JSON only.
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.7,
            }
        });

        const text = response.text || "[]";

        // Clean markdown blocks if Gemini accidentally included them
        const cleanedText = text.replace(/```json/gi, '').replace(/```/g, '').trim();

        const activities: GeneratedActivity[] = JSON.parse(cleanedText);

        // Ensure it's an array
        if (!Array.isArray(activities)) {
            console.error("Gemini returned non-array JSON:", activities);
            return [];
        }

        return activities.slice(0, count);

    } catch (error) {
        console.error("Error generating activities with Gemini:", error);
        throw error;
    }
}
