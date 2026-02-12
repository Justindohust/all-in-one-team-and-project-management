#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Read DB mode from file, fallback to 'local'
const dbModeFile = path.join(__dirname, '..', '.db-mode');
let dbMode = 'local';
if (fs.existsSync(dbModeFile)) {
  dbMode = fs.readFileSync(dbModeFile, 'utf8').trim();
}

const envFile = path.join(__dirname, '..', `env.${dbMode}`);
if (fs.existsSync(envFile)) {
  require('dotenv').config({ path: envFile });
}

async function runMigration() {
  console.log('🔄 Running migration: Add comments and activities system...\n');
  
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'digihub_user',
    password: process.env.DB_PASSWORD || 'digihub_secret_2026',
    database: process.env.DB_NAME || 'digihub'
  });

  try {
    await client.connect();
    console.log(`✅ Connected to database (${dbMode})`);

    // Read and execute migration
    const migrationPath = path.join(__dirname, '..', 'database', '20260212000002-add-comments-and-activities.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found!');
      process.exit(1);
    }

    console.log('📝 Executing migration...');
    const migration = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute migration
    await client.query(migration);
    
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('📋 Changes applied:');
    console.log('  - Created entity_comments table');
    console.log('  - Enhanced activity_logs table');
    console.log('  - Created triggers for automatic activity logging');
    console.log('  - Migrated existing task comments');
    console.log('');

    await client.end();

  } catch (error) {
    console.error('❌ Error running migration:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();
