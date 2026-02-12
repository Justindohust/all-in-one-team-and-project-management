const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

// Helper function to set user context for triggers
async function setUserContext(client, userId) {
  try {
    await client.query(`SET LOCAL app.current_user_id = '${userId}'`);
  } catch (error) {
    console.error('Error setting user context:', error);
  }
}

// Get activities for an entity (module, submodule, task, project)
router.get('/:entityType/:entityId', auth, async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    
    // Validate entity type
    const validTypes = ['project', 'module', 'submodule', 'task'];
    if (!validTypes.includes(entityType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid entity type'
      });
    }
    
    // Build query based on entity type
    let whereClause;
    switch (entityType) {
      case 'project':
        whereClause = 'al.project_id = $1';
        break;
      case 'module':
        whereClause = 'al.module_id = $1';
        break;
      case 'submodule':
        whereClause = 'al.submodule_id = $1';
        break;
      case 'task':
        whereClause = 'al.task_id = $1';
        break;
    }
    
    // Get activity logs
    const logsQuery = `
      SELECT 
        'log' as type,
        al.id,
        al.action,
        al.entity_type,
        al.entity_id,
        al.entity_name,
        al.details,
        al.created_at,
        al.user_id,
        u.first_name || ' ' || u.last_name as user_name,
        u.avatar_url as user_avatar,
        NULL as content,
        NULL as parent_id,
        NULL as replies_count
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE ${whereClause}
    `;
    
    // Get comments (including replies count)
    const commentsQuery = `
      SELECT 
        'comment' as type,
        ec.id,
        NULL as action,
        ec.entity_type,
        ec.entity_id,
        NULL as entity_name,
        NULL as details,
        ec.created_at,
        ec.user_id,
        u.first_name || ' ' || u.last_name as user_name,
        u.avatar_url as user_avatar,
        ec.content,
        ec.parent_id,
        (SELECT COUNT(*) FROM entity_comments WHERE parent_id = ec.id) as replies_count
      FROM entity_comments ec
      LEFT JOIN users u ON ec.user_id = u.id
      WHERE ec.entity_type = $2 AND ec.entity_id = $1 AND ec.parent_id IS NULL
    `;
    
    // Combine queries and sort by date
    const combinedQuery = `
      WITH combined_activities AS (
        ${logsQuery}
        UNION ALL
        ${commentsQuery}
      )
      SELECT * FROM combined_activities
      ORDER BY created_at DESC
      LIMIT $3 OFFSET $4
    `;
    
    const result = await db.query(combinedQuery, [entityId, entityType, limit, offset]);
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total FROM (
        SELECT id FROM activity_logs al WHERE ${whereClause}
        UNION ALL
        SELECT id FROM entity_comments WHERE entity_type = $2 AND entity_id = $1 AND parent_id IS NULL
      ) as total_activities
    `;
    const countResult = await db.query(countQuery, [entityId, entityType]);
    
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countResult.rows[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activities'
    });
  }
});

// Get replies for a comment
router.get('/comments/:commentId/replies', auth, async (req, res) => {
  try {
    const { commentId } = req.params;
    
    const result = await db.query(
      `SELECT 
        ec.id,
        ec.content,
        ec.created_at,
        ec.updated_at,
        ec.user_id,
        u.first_name || ' ' || u.last_name as user_name,
        u.avatar_url as user_avatar
      FROM entity_comments ec
      LEFT JOIN users u ON ec.user_id = u.id
      WHERE ec.parent_id = $1
      ORDER BY ec.created_at ASC`,
      [commentId]
    );
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get comment replies error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comment replies'
    });
  }
});

// Create a comment
router.post('/comments', auth, async (req, res) => {
  const client = await db.getClient();
  try {
    const { entityType, entityId, content, parentId = null } = req.body;
    const userId = req.user.id;
    
    // Validate required fields
    if (!entityType || !entityId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Entity type, entity ID, and content are required'
      });
    }
    
    // Validate entity type
    const validTypes = ['project', 'module', 'submodule', 'task'];
    if (!validTypes.includes(entityType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid entity type'
      });
    }
    
    await client.query('BEGIN');
    
    // Set user context for activity logging
    await setUserContext(client, userId);
    
    // If it's a reply, verify parent comment exists
    if (parentId) {
      const parentCheck = await client.query(
        'SELECT id FROM entity_comments WHERE id = $1',
        [parentId]
      );
      
      if (parentCheck.rows.length === 0) {
        throw new Error('Parent comment not found');
      }
    }
    
    // Insert comment
    const result = await client.query(
      `INSERT INTO entity_comments (entity_type, entity_id, user_id, content, parent_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, created_at, updated_at`,
      [entityType, entityId, userId, content, parentId]
    );
    
    const comment = result.rows[0];
    
    // Get user info
    const userResult = await client.query(
      `SELECT first_name || ' ' || last_name as user_name, avatar_url as user_avatar
       FROM users WHERE id = $1`,
      [userId]
    );
    
    await client.query('COMMIT');
    
    res.status(201).json({
      success: true,
      data: {
        ...comment,
        user_id: userId,
        ...userResult.rows[0],
        content,
        entity_type: entityType,
        entity_id: entityId,
        parent_id: parentId
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create comment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create comment'
    });
  } finally {
    client.release();
  }
});

// Update a comment
router.put('/comments/:commentId', auth, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }
    
    // Check if user owns the comment
    const checkResult = await db.query(
      'SELECT user_id FROM entity_comments WHERE id = $1',
      [commentId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }
    
    if (checkResult.rows[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own comments'
      });
    }
    
    // Update comment
    const result = await db.query(
      `UPDATE entity_comments 
       SET content = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [content, commentId]
    );
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update comment'
    });
  }
});

// Delete a comment
router.delete('/comments/:commentId', auth, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;
    
    // Check if user owns the comment or is admin
    const checkResult = await db.query(
      `SELECT ec.user_id, u.role 
       FROM entity_comments ec
       JOIN users u ON u.id = $1
       WHERE ec.id = $2`,
      [userId, commentId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }
    
    const comment = checkResult.rows[0];
    if (comment.user_id !== userId && comment.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own comments'
      });
    }
    
    // Delete comment (cascades to replies)
    await db.query('DELETE FROM entity_comments WHERE id = $1', [commentId]);
    
    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment'
    });
  }
});

module.exports = router;
