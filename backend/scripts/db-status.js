#!/usr/bin/env node

const { Pool } = require('pg');
require('dotenv').config();

async function checkDatabaseStatus() {
  console.log('🔍 Checking database status...\n');
  
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'digihub',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  };

  console.log('📊 Configuration:');
  console.log(`   Host: ${config.host}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   Database: ${config.database}`);
  console.log(`   User: ${config.user}`);
  console.log(`   Mode: ${config.host === 'localhost' ? 'LOCAL (Docker)' : 'REMOTE (VPS)'}\n`);

  const pool = new Pool(config);

  try {
    // Test connection
    console.log('🔌 Testing connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Connection successful!\n');

    // Get database info
    const versionResult = await pool.query('SELECT version()');
    console.log('📌 PostgreSQL Version:');
    console.log(`   ${versionResult.rows[0].version}\n`);

    // List all tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log('📋 Tables in database:');
    if (tablesResult.rows.length === 0) {
      console.log('   (No tables found - database may need initialization)');
    } else {
      for (const row of tablesResult.rows) {
        // Get row count for each table
        const countResult = await pool.query(`SELECT COUNT(*) FROM ${row.table_name}`);
        console.log(`   - ${row.table_name.padEnd(30)} (${countResult.rows[0].count} rows)`);
      }
    }

    console.log('\n✨ Database status check completed!');

  } catch (error) {
    console.error('❌ Error connecting to database:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Check if .env file exists and has correct configuration');
    console.error('   2. For local: Make sure Docker containers are running (docker-compose up)');
    console.error('   3. For remote: Check VPS firewall and PostgreSQL configuration');
    console.error('   4. Verify credentials are correct');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

checkDatabaseStatus();
