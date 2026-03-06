require('dotenv').config();
const { generateActivities } = require('../lib/gemini.js') || require('tsx/cjs/api').require('../lib/gemini.ts', __filename);

// Actually tsx can require directly if we just use tsx. Let's make an async IIFE in TS.
