const db = require('../config/database');

async function fixPasswords() {
  try {
    // This is the hash for 'password123'
    const hash = '$2a$10$5nKtp0vzR5RYLIF7.zqS/e48IJXTOqvNxI16HSU1xJ.3Txz1uS4xa';
    
    const result = await db.query('UPDATE users SET password_hash = $1', [hash]);
    
    console.log('✅ Updated', result.rowCount, 'users');
    console.log('✅ All users can now login with password: password123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixPasswords();

