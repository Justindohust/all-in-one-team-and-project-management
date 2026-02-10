const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

// Read DB mode from file, fallback to 'local'
const dbModeFile = path.join(__dirname, '..', '.db-mode');
let dbMode = 'local';
if (fs.existsSync(dbModeFile)) {
  dbMode = fs.readFileSync(dbModeFile, 'utf8').trim();
}

const envFile = path.join(__dirname, '..', `env.${dbMode}`);

if (fs.existsSync(envFile)) {
  require('dotenv').config({ path: envFile });
  console.log(`📝 Using database config: env.${dbMode}`);
} else {
  console.warn(`⚠️  env.${dbMode} not found, using defaults`);
}

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'digihub',
  user: process.env.DB_USER || 'digihub_user',
  password: process.env.DB_PASSWORD || 'digihub_secret_2026',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
  console.log('📦 Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  pool
};
