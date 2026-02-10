#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const mode = args[0];

if (!mode || !['local', 'remote'].includes(mode)) {
  console.error('❌ Usage: npm run db:switch <local|remote>');
  console.log('\nExamples:');
  console.log('  npm run db:switch local   - Switch to local Docker database');
  console.log('  npm run db:switch remote  - Switch to remote VPS database');
  process.exit(1);
}

const envSource = path.join(__dirname, '..', `.env.${mode}`);
const envTarget = path.join(__dirname, '..', '.env');

try {
  if (!fs.existsSync(envSource)) {
    console.error(`❌ File .env.${mode} not found!`);
    process.exit(1);
  }

  // Copy the selected .env file
  fs.copyFileSync(envSource, envTarget);
  
  console.log(`✅ Switched to ${mode.toUpperCase()} database configuration`);
  console.log(`📝 Active config: .env.${mode}`);
  
  // Display current configuration (without showing password)
  const envContent = fs.readFileSync(envTarget, 'utf8');
  const dbHost = envContent.match(/DB_HOST=(.+)/)?.[1] || 'unknown';
  const dbName = envContent.match(/DB_NAME=(.+)/)?.[1] || 'unknown';
  const dbUser = envContent.match(/DB_USER=(.+)/)?.[1] || 'unknown';
  
  console.log('\n📊 Current Database Configuration:');
  console.log(`   Host: ${dbHost}`);
  console.log(`   Database: ${dbName}`);
  console.log(`   User: ${dbUser}`);
  console.log('\n💡 Restart your server for changes to take effect.');
  
} catch (error) {
  console.error('❌ Error switching database configuration:', error.message);
  process.exit(1);
}
