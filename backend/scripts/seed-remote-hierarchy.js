#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'env.remote') });

async function seedCompleteHierarchy() {
  console.log('🌱 Seeding complete hierarchy data to remote database...\n');
  
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

    // Read and execute seed-complete-hierarchy.sql
    const seedPath = path.join(__dirname, '..', 'database', 'seed-complete-hierarchy.sql');
    
    if (!fs.existsSync(seedPath)) {
      console.error('❌ seed-complete-hierarchy.sql not found!');
      process.exit(1);
    }

    console.log('📝 Executing seed-complete-hierarchy.sql...');
    const seed = fs.readFileSync(seedPath, 'utf8');
    
    // Execute the seed file
    await client.query(seed);
    
    console.log('✅ Complete hierarchy data seeded successfully!\n');
    
    // Verify the data
    console.log('🔍 Verifying seeded data...\n');
    
    const projects = await client.query('SELECT COUNT(*) FROM projects');
    console.log(`   Projects: ${projects.rows[0].count}`);
    
    const modules = await client.query('SELECT COUNT(*) FROM modules');
    console.log(`   Modules: ${modules.rows[0].count}`);
    
    const submodules = await client.query('SELECT COUNT(*) FROM submodules');
    console.log(`   Submodules: ${submodules.rows[0].count}`);
    
    const tasks = await client.query('SELECT COUNT(*) FROM tasks');
    console.log(`   Tasks: ${tasks.rows[0].count}`);
    
    console.log('\n✨ Database seeding completed successfully!');
    console.log(`\n📊 Remote database: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);

    await client.end();

  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    console.error('\nDetails:', error);
    process.exit(1);
  }
}

seedCompleteHierarchy();
