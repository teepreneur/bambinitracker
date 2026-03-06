import * as dotenv from 'dotenv';
dotenv.config();

// Important: Require gemini dynamically AFTER dotenv to ensure process.env is hydrated
async function test() {
    try {
        const { generateActivities } = require('../lib/gemini');
        console.log("Generating activities...");
        const result = await generateActivities(10, 2);
        console.log("Result:", result);
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
