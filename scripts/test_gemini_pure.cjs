const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

async function test() {
    console.log("Starting pure CommonJS test...");

    // Create the AI exactly like in lib/gemini.ts
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
        console.error("NO API KEY LOADED");
        return;
    }

    console.log("API Key loaded successfully:", apiKey.substring(0, 5) + "...");
    const ai = new GoogleGenAI({ apiKey: apiKey });

    // The Prompt from lib/gemini.ts
    const ageContext = "0 months old (Newborn phase). Focus on very gentle sensory, visual, and bonding activities appropriate for the fragile newborn state. Emphasize maternal bonding and soothing.";
    const count = 4;
    const prompt = `
You are an expert pediatric occupational therapist and early childhood development specialist. 
Your task is to perfectly tailor a set of daily developmental activities for a child who is exactly ${ageContext}

Generate exactly ${count} highly engaging activities.

Each activity must have:
1. "title": A short, catchy, engaging title (max 5 words).
2. "description": A clear, concise 2-3 sentence instruction for the parent on exactly what to do and what development it aids.
3. "domain": Must be exactly one of "Cognitive", "Motor", "Language", "Social", or "Sensory".
4. "estimated_time": A short string like "5 min", "10 min", "15 min" etc.
5. "target_age_months": Approximate target age in months (use 0 for newborns).

IMPORTANT: Return the data STRICTLY as a JSON array of objects matching the fields above. Do not include markdown formatting like \`\`\`json or \`\`\`. Output raw JSON only.
`;

    try {
        console.log("Calling Gemini 2.5 Flash...");
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.7,
            }
        });

        console.log("Raw Response Text length:", response.text?.length);
        console.log("Raw Response:", response.text);

        const text = response.text || "[]";
        const cleanedText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        const activities = JSON.parse(cleanedText);

        console.log("Perfectly Parsed Activities List:");
        console.log(activities);
    } catch (e) {
        console.error("Gemini Failure:", e);
    }
}

test();
