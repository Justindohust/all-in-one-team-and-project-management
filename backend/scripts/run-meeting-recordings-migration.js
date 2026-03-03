#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'env.remote') });

async function runMigration() {
  console.log('🔄 Running migration: Add meeting recordings table...\n');

  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'digihub'
  });

  try {
    await client.connect();
    console.log(`✅ Connected to remote database at ${process.env.DB_HOST}`);

    // Read and execute migration
    const migrationPath = path.join(__dirname, '..', 'database', '20260225000001-add-meeting-recordings.sql');

    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found!');
      process.exit(1);
    }

    console.log('📝 Executing migration...');
    const migration = fs.readFileSync(migrationPath, 'utf8');
    await client.query(migration);

    console.log('✅ Migration completed successfully!');

    // Verify tables exist
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('meeting_recordings', 'meeting_recording_participants')
      ORDER BY table_name
    `);

    console.log('\n📋 Created tables:');
    tablesResult.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });

    await client.end();

  } catch (error) {
    console.error('❌ Error running migration:', error.message);
    process.exit(1);
  }
}

runMigration();

