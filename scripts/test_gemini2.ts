import * as dotenv from 'dotenv';
dotenv.config();

import { generateActivities } from '../lib/gemini';

async function runTest() {
    try {
        console.log("Starting direct API test...");
        console.log("API Key loaded:", !!process.env.EXPO_PUBLIC_GEMINI_API_KEY);

        const activities = await generateActivities(10, 2);
        console.log("Final Activities Array:", activities);
        console.log("Length:", activities.length);
    } catch (error) {
        console.error("Test Error:", error);
    }
}

runTest();
