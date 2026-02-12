/**
 * Test script for Activities & Comments API
 */

const BASE_URL = 'http://localhost:3001/api';
let token = null;

// Color codes for console
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

// Login to get token
async function login() {
  log('\n🔐 Logging in...', 'blue');
  
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@digihub.com',
      password: 'admin123'
    })
  });
  
  const data = await response.json();
  
  if (data.success) {
    token = data.data.token;
    log('✅ Login successful', 'green');
    return data.data.user.id;
  } else {
    log('❌ Login failed: ' + data.message, 'red');
    throw new Error('Login failed');
  }
}

// Test: Get activities for a module
async function testGetActivities(moduleId) {
  log('\n📊 Testing: Get Activities for Module', 'blue');
  
  const response = await fetch(`${BASE_URL}/activities/module/${moduleId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await response.json();
  
  if (data.success) {
    log(`✅ Retrieved ${data.data.length} activities`, 'green');
    log(`   Pagination: Page ${data.pagination.page}/${data.pagination.totalPages}`, 'yellow');
    
    // Show sample activities
    if (data.data.length > 0) {
      log('   Sample activities:', 'yellow');
      data.data.slice(0, 3).forEach((activity, i) => {
        log(`   ${i + 1}. [${activity.type}] ${activity.action || 'comment'} by ${activity.user_name}`, 'yellow');
      });
    }
    return data.data;
  } else {
    log('❌ Failed to get activities: ' + data.message, 'red');
    return null;
  }
}

// Test: Create a comment
async function testCreateComment(moduleId) {
  log('\n💬 Testing: Create Comment', 'blue');
  
  const response = await fetch(`${BASE_URL}/activities/comments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      entityType: 'module',
      entityId: moduleId,
      content: 'This is a test comment from the API test script! 🎉'
    })
  });
  
  const data = await response.json();
  
  if (data.success) {
    log('✅ Comment created successfully', 'green');
    log(`   Comment ID: ${data.data.id}`, 'yellow');
    return data.data.id;
  } else {
    log('❌ Failed to create comment: ' + data.message, 'red');
    return null;
  }
}

// Test: Create a reply
async function testCreateReply(moduleId, parentId) {
  log('\n💬 Testing: Create Reply', 'blue');
  
  const response = await fetch(`${BASE_URL}/activities/comments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      entityType: 'module',
      entityId: moduleId,
      content: 'This is a reply to the comment! 👍',
      parentId: parentId
    })
  });
  
  const data = await response.json();
  
  if (data.success) {
    log('✅ Reply created successfully', 'green');
    log(`   Reply ID: ${data.data.id}`, 'yellow');
    return data.data.id;
  } else {
    log('❌ Failed to create reply: ' + data.message, 'red');
    return null;
  }
}

// Test: Get comment replies
async function testGetReplies(commentId) {
  log('\n📨 Testing: Get Comment Replies', 'blue');
  
  const response = await fetch(`${BASE_URL}/activities/comments/${commentId}/replies`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await response.json();
  
  if (data.success) {
    log(`✅ Retrieved ${data.data.length} replies`, 'green');
    if (data.data.length > 0) {
      log('   Replies:', 'yellow');
      data.data.forEach((reply, i) => {
        log(`   ${i + 1}. ${reply.user_name}: ${reply.content}`, 'yellow');
      });
    }
    return data.data;
  } else {
    log('❌ Failed to get replies: ' + data.message, 'red');
    return null;
  }
}

// Test: Update a comment
async function testUpdateComment(commentId) {
  log('\n✏️  Testing: Update Comment', 'blue');
  
  const response = await fetch(`${BASE_URL}/activities/comments/${commentId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      content: 'This comment has been updated! ✨'
    })
  });
  
  const data = await response.json();
  
  if (data.success) {
    log('✅ Comment updated successfully', 'green');
    return true;
  } else {
    log('❌ Failed to update comment: ' + data.message, 'red');
    return false;
  }
}

// Test: Delete a comment
async function testDeleteComment(commentId) {
  log('\n🗑️  Testing: Delete Comment', 'blue');
  
  const response = await fetch(`${BASE_URL}/activities/comments/${commentId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await response.json();
  
  if (data.success) {
    log('✅ Comment deleted successfully', 'green');
    return true;
  } else {
    log('❌ Failed to delete comment: ' + data.message, 'red');
    return false;
  }
}

// Get a module ID for testing
async function getTestModuleId() {
  log('\n🔍 Finding a test module...', 'blue');
  
  const response = await fetch(`${BASE_URL}/modules/project/00000000-0000-0000-0000-000000000001`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await response.json();
  
  if (data.success && data.data.length > 0) {
    const moduleId = data.data[0].id;
    log(`✅ Using module: ${data.data[0].name} (${moduleId})`, 'green');
    return moduleId;
  } else {
    log('⚠️  No modules found, creating test data might be needed', 'yellow');
    return null;
  }
}

// Main test runner
async function runTests() {
  log('═══════════════════════════════════════════', 'blue');
  log('  Activities & Comments API Test Suite', 'blue');
  log('═══════════════════════════════════════════', 'blue');
  
  try {
    // Step 1: Login
    await login();
    
    // Step 2: Get a test module
    const moduleId = await getTestModuleId();
    
    if (!moduleId) {
      log('\n❌ Cannot proceed without a module ID', 'red');
      log('   Please create a project and module first', 'yellow');
      return;
    }
    
    // Step 3: Get existing activities
    await testGetActivities(moduleId);
    
    // Step 4: Create a comment
    const commentId = await testCreateComment(moduleId);
    
    if (commentId) {
      // Step 5: Create a reply
      const replyId = await testCreateReply(moduleId, commentId);
      
      // Step 6: Get replies
      if (replyId) {
        await testGetReplies(commentId);
      }
      
      // Step 7: Update comment
      await testUpdateComment(commentId);
      
      // Step 8: Get activities again to see changes
      await testGetActivities(moduleId);
      
      // Step 9: Delete the reply (if exists)
      if (replyId) {
        await testDeleteComment(replyId);
      }
      
      // Step 10: Delete the comment
      await testDeleteComment(commentId);
    }
    
    log('\n═══════════════════════════════════════════', 'green');
    log('  ✅ All tests completed!', 'green');
    log('═══════════════════════════════════════════', 'green');
    
  } catch (error) {
    log('\n❌ Test suite failed: ' + error.message, 'red');
    console.error(error);
  }
}

// Run the tests
runTests();
