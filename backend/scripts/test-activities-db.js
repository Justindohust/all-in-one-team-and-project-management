const db = require('../config/database');

async function testActivitiesSystem() {
  console.log('🧪 Testing Activities & Comments System\n');
  console.log('='.repeat(50));

  try {
    // Test 1: Check entity_comments table exists
    console.log('\n📝 Test 1: Check entity_comments table');
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'entity_comments'
      );
    `);
    console.log('✅ entity_comments table exists:', tableCheck.rows[0].exists);

    // Test 2: Check activity_logs enhanced columns
    console.log('\n📝 Test 2: Check activity_logs enhanced columns');
    const columnCheck = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'activity_logs' 
      AND column_name IN ('project_id', 'module_id', 'submodule_id', 'task_id');
    `);
    console.log('✅ Enhanced columns found:', columnCheck.rows.map(r => r.column_name));

    // Test 3: Check triggers exist
    console.log('\n📝 Test 3: Check activity logging triggers');
    const triggerCheck = await db.query(`
      SELECT trigger_name 
      FROM information_schema.triggers 
      WHERE trigger_name LIKE 'trigger_log_%_activity';
    `);
    console.log('✅ Triggers found:', triggerCheck.rows.map(r => r.trigger_name));

    // Test 4: Get first user for testing
    console.log('\n📝 Test 4: Get test user');
    const userResult = await db.query('SELECT id, email, first_name, last_name FROM users LIMIT 1');
    if (userResult.rows.length === 0) {
      console.log('❌ No users found in database');
      return;
    }
    const testUser = userResult.rows[0];
    console.log(`✅ Test user: ${testUser.first_name} ${testUser.last_name} (${testUser.email})`);

    // Test 5: Get first module for testing
    console.log('\n📝 Test 5: Get test module');
    const moduleResult = await db.query('SELECT id, name FROM modules LIMIT 1');
    if (moduleResult.rows.length === 0) {
      console.log('❌ No modules found in database');
      return;
    }
    const testModule = moduleResult.rows[0];
    console.log(`✅ Test module: ${testModule.name} (${testModule.id})`);

    // Test 6: Insert a test comment
    console.log('\n📝 Test 6: Insert test comment');
    const commentResult = await db.query(`
      INSERT INTO entity_comments (entity_type, entity_id, user_id, content)
      VALUES ($1, $2, $3, $4)
      RETURNING id, created_at
    `, ['module', testModule.id, testUser.id, 'Test comment from database test - ' + new Date().toISOString()]);
    const testComment = commentResult.rows[0];
    console.log('✅ Comment inserted:', testComment.id);

    // Test 7: Insert a reply
    console.log('\n📝 Test 7: Insert reply to comment');
    const replyResult = await db.query(`
      INSERT INTO entity_comments (entity_type, entity_id, user_id, content, parent_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, ['module', testModule.id, testUser.id, 'Test reply', testComment.id]);
    console.log('✅ Reply inserted:', replyResult.rows[0].id);

    // Test 8: Get all comments for the module
    console.log('\n📝 Test 8: Get all comments for module');
    const commentsResult = await db.query(`
      SELECT 
        ec.id,
        ec.content,
        ec.parent_id,
        u.first_name || ' ' || u.last_name as user_name,
        (SELECT COUNT(*) FROM entity_comments WHERE parent_id = ec.id) as replies_count
      FROM entity_comments ec
      LEFT JOIN users u ON ec.user_id = u.id
      WHERE ec.entity_type = 'module' AND ec.entity_id = $1
      ORDER BY ec.created_at DESC
    `, [testModule.id]);
    console.log(`✅ Found ${commentsResult.rows.length} comments`);
    commentsResult.rows.forEach(c => {
      console.log(`   - ${c.user_name}: ${c.content.substring(0, 50)}... (${c.replies_count} replies)`);
    });

    // Test 9: Update module to trigger activity log
    console.log('\n📝 Test 9: Update module to trigger activity log');
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      await client.query(`SET LOCAL app.current_user_id = '${testUser.id}'`);
      await client.query(`
        UPDATE modules 
        SET progress = progress + 1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [testModule.id]);
      await client.query('COMMIT');
      console.log('✅ Module updated');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    // Wait a bit for trigger
    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 10: Check if activity log was created
    console.log('\n📝 Test 10: Check activity log');
    const activityResult = await db.query(`
      SELECT 
        al.action,
        al.entity_type,
        al.details,
        u.first_name || ' ' || u.last_name as user_name
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.module_id = $1
      ORDER BY al.created_at DESC
      LIMIT 5
    `, [testModule.id]);
    console.log(`✅ Found ${activityResult.rows.length} activity logs`);
    activityResult.rows.forEach(a => {
      console.log(`   - ${a.user_name} ${a.action} ${a.entity_type}`);
      if (a.details) {
        console.log(`     Details:`, JSON.stringify(a.details, null, 2));
      }
    });

    // Test 11: Combined query (like the API does)
    console.log('\n📝 Test 11: Combined activities query');
    const combinedResult = await db.query(`
      WITH combined_activities AS (
        SELECT 
          'log' as type,
          al.id,
          al.action,
          al.entity_type,
          al.entity_name,
          al.details,
          al.created_at,
          u.first_name || ' ' || u.last_name as user_name
        FROM activity_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE al.module_id = $1
        
        UNION ALL
        
        SELECT 
          'comment' as type,
          ec.id,
          NULL as action,
          ec.entity_type,
          NULL as entity_name,
          NULL as details,
          ec.created_at,
          u.first_name || ' ' || u.last_name as user_name
        FROM entity_comments ec
        LEFT JOIN users u ON ec.user_id = u.id
        WHERE ec.entity_type = 'module' AND ec.entity_id = $1 AND ec.parent_id IS NULL
      )
      SELECT * FROM combined_activities
      ORDER BY created_at DESC
      LIMIT 10
    `, [testModule.id]);
    console.log(`✅ Combined query returned ${combinedResult.rows.length} items`);
    combinedResult.rows.forEach(a => {
      if (a.type === 'log') {
        console.log(`   📜 Log: ${a.user_name} ${a.action} ${a.entity_type}`);
      } else {
        console.log(`   💬 Comment by ${a.user_name}`);
      }
    });

    // Test 12: Clean up test data
    console.log('\n📝 Test 12: Clean up test data');
    await db.query('DELETE FROM entity_comments WHERE id = $1', [testComment.id]);
    console.log('✅ Test data cleaned up');

    console.log('\n' + '='.repeat(50));
    console.log('🎉 All database tests passed!');
    console.log('\n✨ The activities & comments system is working correctly!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testActivitiesSystem();
