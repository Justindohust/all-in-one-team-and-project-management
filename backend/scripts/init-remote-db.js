#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'env.remote') });

async function initRemoteDatabase() {
  console.log('🚀 Initializing remote database...\n');
  
  // Connect to PostgreSQL server (not specific database)
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'postgres' // Connect to default postgres database first
  });

  try {
    await client.connect();
    console.log(`✅ Connected to PostgreSQL at ${process.env.DB_HOST}`);

    // Check if database exists
    const dbName = process.env.DB_NAME || 'digihub';
    const checkDbQuery = `SELECT 1 FROM pg_database WHERE datname = $1`;
    const result = await client.query(checkDbQuery, [dbName]);

    if (result.rows.length === 0) {
      console.log(`📦 Creating database: ${dbName}`);
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Database ${dbName} created successfully`);
    } else {
      console.log(`ℹ️  Database ${dbName} already exists`);
    }

    await client.end();

    // Now connect to the specific database to create tables
    const dbClient = new Client({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: dbName
    });

    await dbClient.connect();
    console.log(`\n📊 Connected to database: ${dbName}`);

    // Read and execute schema
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      console.log('📝 Executing schema.sql...');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      await dbClient.query(schema);
      console.log('✅ Schema created successfully');
    } else {
      console.warn('⚠️  schema.sql not found, skipping...');
    }

    // Read and execute seed data
    const seedPath = path.join(__dirname, '..', 'database', 'seed.sql');
    if (fs.existsSync(seedPath)) {
      console.log('🌱 Executing seed.sql...');
      const seed = fs.readFileSync(seedPath, 'utf8');
      await dbClient.query(seed);
      console.log('✅ Seed data inserted successfully');
    } else {
      console.warn('⚠️  seed.sql not found, skipping...');
    }

    // Execute migrations if exist
    const migrationsDir = path.join(__dirname, '..', 'database');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.match(/^\d{14}-.*\.sql$/))
      .sort();

    if (migrationFiles.length > 0) {
      console.log(`\n🔄 Running ${migrationFiles.length} migration(s)...`);
      for (const file of migrationFiles) {
        console.log(`   Running: ${file}`);
        const migration = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        await dbClient.query(migration);
      }
      console.log('✅ All migrations executed successfully');
    }

    await dbClient.end();
    console.log('\n✨ Remote database initialization completed!');
    console.log(`\n📊 Database ready at: ${process.env.DB_HOST}:${process.env.DB_PORT}/${dbName}`);

  } catch (error) {
    console.error('❌ Error initializing remote database:', error.message);
    console.error('\n💡 Make sure:');
    console.error('   1. PostgreSQL is running on the remote server');
    console.error('   2. The server allows remote connections');
    console.error('   3. Your credentials are correct');
    console.error('   4. Firewall allows port 5432');
    process.exit(1);
  }
}

// Check if using remote configuration
if (process.env.DB_HOST === 'localhost' || process.env.DB_HOST === '127.0.0.1') {
  console.error('❌ This script is for remote database initialization.');
  console.error('💡 Switch to remote config first: npm run db:switch remote');
  process.exit(1);
}

initRemoteDatabase();
