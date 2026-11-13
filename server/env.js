const path = require('path');
const dotenv = require('dotenv');

// Load .env.local first (written by `neon deploy` / `neon env pull`), then .env as fallback
dotenv.config({ path: path.join(__dirname, '../.env.local') });
dotenv.config({ path: path.join(__dirname, '../.env') });

module.exports = process.env;

