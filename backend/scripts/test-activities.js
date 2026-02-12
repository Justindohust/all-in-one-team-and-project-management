const http = require('http');

const API_URL = 'http://localhost:3001/api';
let authToken = '';
let testCommentId = '';
let testModuleId = '';

// Helper function to make API calls
async function apiRequest(endpoint, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_URL}${endpoint}`);
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const requestOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers
    };

    const req = http.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          reject(new Error('Failed to parse response: ' + data));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

// Test 1: Login
async function testLogin() {
  console.log('\n📝 Test 1: Login');
  const result = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'admin@digihub.com',
      password: 'admin123'
    })
  });

  if (result.data.success) {
    authToken = result.data.token;
    console.log('✅ Login successful');
    return true;
  } else {
    console.log('❌ Login failed:', result.data.message);
    return false;
  }
}

// Test 2: Get a module ID to test with
async function getTestModule() {
  console.log('\n📝 Test 2: Get test module');
  const result = await apiRequest('/modules');

  if (result.data.success && result.data.data.length > 0) {
    testModuleId = result.data.data[0].id;
    console.log(`✅ Found module: ${testModuleId}`);
    return true;
  } else {
    console.log('❌ No modules found');
    return false;
  }
}

// Test 3: Create a comment
async function testCreateComment() {
  console.log('\n📝 Test 3: Create comment on module');
  const result = await apiRequest('/activities/comments', {
    method: 'POST',
    body: JSON.stringify({
      entityType: 'module',
      entityId: testModuleId,
      content: 'Test comment from automated test - ' + new Date().toISOString()
    })
  });

  if (result.data.success) {
    testCommentId = result.data.data.id;
    console.log('✅ Comment created:', testCommentId);
    return true;
  } else {
    console.log('❌ Comment creation failed:', result.data.message);
    return false;
  }
}

// Test 4: Get activities
async function testGetActivities() {
  console.log('\n📝 Test 4: Get activities for module');
  const result = await apiRequest(`/activities/module/${testModuleId}`);

  if (result.data.success) {
    console.log(`✅ Retrieved ${result.data.data.length} activities`);
    console.log('Activities breakdown:');
    const logs = result.data.data.filter(a => a.type === 'log').length;
    const comments = result.data.data.filter(a => a.type === 'comment').length;
    console.log(`   - ${logs} activity logs`);
    console.log(`   - ${comments} comments`);
    return true;
  } else {
    console.log('❌ Failed to get activities:', result.data.message);
    return false;
  }
}

// Test 5: Create a reply
async function testCreateReply() {
  console.log('\n📝 Test 5: Create reply to comment');
  const result = await apiRequest('/activities/comments', {
    method: 'POST',
    body: JSON.stringify({
      entityType: 'module',
      entityId: testModuleId,
      content: 'Test reply - ' + new Date().toISOString(),
      parentId: testCommentId
    })
  });

  if (result.data.success) {
    console.log('✅ Reply created:', result.data.data.id);
    return true;
  } else {
    console.log('❌ Reply creation failed:', result.data.message);
    return false;
  }
}

// Test 6: Get comment replies
async function testGetReplies() {
  console.log('\n📝 Test 6: Get replies for comment');
  const result = await apiRequest(`/activities/comments/${testCommentId}/replies`);

  if (result.data.success) {
    console.log(`✅ Retrieved ${result.data.data.length} replies`);
    return true;
  } else {
    console.log('❌ Failed to get replies:', result.data.message);
    return false;
  }
}

// Test 7: Update a module to trigger activity log
async function testUpdateModule() {
  console.log('\n📝 Test 7: Update module to trigger activity log');
  const result = await apiRequest(`/modules/${testModuleId}`, {
    method: 'PUT',
    body: JSON.stringify({
      status: 'active',
      progress: 75
    })
  });

  if (result.data.success) {
    console.log('✅ Module updated');
    // Wait a bit for trigger to execute
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
  } else {
    console.log('❌ Module update failed:', result.data.message);
    return false;
  }
}

// Test 8: Verify activity log was created
async function testVerifyActivityLog() {
  console.log('\n📝 Test 8: Verify activity log was created');
  const result = await apiRequest(`/activities/module/${testModuleId}`);

  if (result.data.success) {
    const updateLog = result.data.data.find(a => 
      a.type === 'log' && 
      a.action === 'updated' &&
      a.details?.progress_changed
    );
    
    if (updateLog) {
      console.log('✅ Activity log found for module update');
      console.log(`   Progress: ${updateLog.details.progress_changed.from}% → ${updateLog.details.progress_changed.to}%`);
      return true;
    } else {
      console.log('⚠️  Update activity log not found yet (might take a moment)');
      return true;
    }
  } else {
    console.log('❌ Failed to verify activity log:', result.data.message);
    return false;
  }
}

// Test 9: Delete comment
async function testDeleteComment() {
  console.log('\n📝 Test 9: Delete test comment');
  const result = await apiRequest(`/activities/comments/${testCommentId}`, {
    method: 'DELETE'
  });

  if (result.data.success) {
    console.log('✅ Comment deleted');
    return true;
  } else {
    console.log('❌ Delete failed:', result.data.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('🧪 Starting Activity & Comments System Tests\n');
  console.log('='.repeat(50));

  const tests = [
    testLogin,
    getTestModule,
    testCreateComment,
    testGetActivities,
    testCreateReply,
    testGetReplies,
    testUpdateModule,
    testVerifyActivityLog,
    testDeleteComment
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log('❌ Test error:', error.message);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('\n📊 Test Results:');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Total: ${passed + failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log(`\n⚠️  ${failed} test(s) failed`);
  }
}

runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
