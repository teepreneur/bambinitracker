import * as dotenv from 'dotenv';
dotenv.config();
const { GoogleGenAI } = require('@google/genai');

async function listModels() {
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    const ai = new GoogleGenAI({ apiKey });
    try {
        const models = await ai.models.list();
        console.log("Available models:", JSON.stringify(models, null, 2));
    } catch (e) {
        console.error("Error listing models:", e);
    }
}

listModels();
