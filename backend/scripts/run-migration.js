#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'env.remote') });

async function runMigration() {
  console.log('🔄 Running migration: Add urgent priority to tasks...\n');
  
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
    const migrationPath = path.join(__dirname, '..', 'database', '20260212000001-add-urgent-to-tasks.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found!');
      process.exit(1);
    }

    console.log('📝 Executing migration...');
    const migration = fs.readFileSync(migrationPath, 'utf8');
    await client.query(migration);
    
    console.log('✅ Migration completed successfully!');

    await client.end();

  } catch (error) {
    console.error('❌ Error running migration:', error.message);
    process.exit(1);
  }
}

runMigration();
