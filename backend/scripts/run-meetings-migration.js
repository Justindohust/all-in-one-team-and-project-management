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
  console.log(`📝 Using database config: env.${dbMode}`);
}

async function runMeetingsMigration() {
  console.log('🔄 Running meetings migration...\n');
  
  const config = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'digihub'
  };

  console.log('📊 Configuration:');
  console.log(`   Host: ${config.host}`);
  console.log(`   Database: ${config.database}`);
  console.log(`   User: ${config.user}\n`);

  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'database', '20260215000001-add-meetings.sql');
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      process.exit(1);
    }
    
    const migration = fs.readFileSync(migrationPath, 'utf8');
    console.log('📄 Executing meetings migration...');
    
    // Execute the migration
    await client.query(migration);
    console.log('✅ Meetings tables created successfully!');
    
    // Verify tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('meetings', 'meeting_participants', 'meeting_notifiees')
      ORDER BY table_name
    `);
    
    console.log('\n📋 Created tables:');
    tablesResult.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMeetingsMigration();

