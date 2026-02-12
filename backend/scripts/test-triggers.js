const db = require('../config/database');

async function testTriggers() {
  console.log('🧪 Testing Activity Triggers\n');

  try {
    // Get a test user and project
    const userResult = await db.query('SELECT id FROM users LIMIT 1');
    const userId = userResult.rows[0].id;
    
    const projectResult = await db.query('SELECT id FROM projects LIMIT 1');
    const projectId = projectResult.rows[0].id;

    console.log('Test user ID:', userId);
    console.log('Test project ID:', projectId);

    // Create a new module with user context
    console.log('\n📝 Creating new module...');
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      // Set user context for trigger
      await client.query(`SET LOCAL app.current_user_id = '${userId}'`);
      
      // Create module
      const result = await client.query(`
        INSERT INTO modules (project_id, name, description, status, priority, created_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, name
      `, [projectId, 'Test Module ' + Date.now(), 'Test module for trigger', 'active', 'medium', userId]);
      
      const newModule = result.rows[0];
      console.log('✅ Module created:', newModule.id);
      
      await client.query('COMMIT');
      
      // Wait a bit for trigger to execute
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if activity log was created
      console.log('\n📝 Checking activity logs...');
      const logResult = await client.query(`
        SELECT 
          al.*,
          u.first_name || ' ' || u.last_name as user_name
        FROM activity_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE al.module_id = $1
        ORDER BY al.created_at DESC
      `, [newModule.id]);
      
      console.log(`Found ${logResult.rows.length} activity logs:`);
      logResult.rows.forEach(log => {
        console.log(`  - ${log.user_name} ${log.action} ${log.entity_type}:`, log.entity_name);
        console.log(`    Details:`, log.details);
      });
      
      if (logResult.rows.length > 0) {
        console.log('\n✅ Trigger is working!');
      } else {
        console.log('\n⚠️  No activity logs found. Trigger might not be working correctly.');
        console.log('This could be because:');
        console.log('1. Trigger needs app.current_user_id to be set');
        console.log('2. Trigger might have an error');
        console.log('3. Transaction isolation might be preventing immediate visibility');
      }
      
      // Clean up
      console.log('\n📝 Cleaning up...');
      await client.query('DELETE FROM modules WHERE id = $1', [newModule.id]);
      console.log('✅ Cleanup complete');
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testTriggers();
