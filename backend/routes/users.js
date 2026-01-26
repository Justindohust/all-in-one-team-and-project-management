const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');

// Get all users
router.get('/', async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT id, email, first_name, last_name, role, avatar_url, job_title, bio, is_online, last_seen_at, created_at
       FROM users ORDER BY first_name, last_name`
    );
    
    res.json({
      success: true,
      data: result.rows.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        avatarUrl: user.avatar_url,
        jobTitle: user.job_title,
        bio: user.bio,
        isOnline: user.is_online,
        lastSeenAt: user.last_seen_at,
        createdAt: user.created_at
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Get user by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      `SELECT id, email, first_name, last_name, role, avatar_url, job_title, bio, is_online, last_seen_at, created_at
       FROM users WHERE id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const user = result.rows[0];
    
    // Get user stats
    const stats = await db.query(
      `SELECT 
        (SELECT COUNT(*) FROM tasks WHERE assignee_id = $1) as total_tasks,
        (SELECT COUNT(*) FROM tasks WHERE assignee_id = $1 AND status = 'done') as completed_tasks,
        (SELECT COUNT(DISTINCT project_id) FROM project_members WHERE user_id = $1) as total_projects
      `,
      [id]
    );
    
    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        avatarUrl: user.avatar_url,
        jobTitle: user.job_title,
        bio: user.bio,
        isOnline: user.is_online,
        lastSeenAt: user.last_seen_at,
        createdAt: user.created_at,
        stats: {
          totalTasks: parseInt(stats.rows[0].total_tasks),
          completedTasks: parseInt(stats.rows[0].completed_tasks),
          totalProjects: parseInt(stats.rows[0].total_projects),
          completionRate: stats.rows[0].total_tasks > 0 
            ? Math.round((stats.rows[0].completed_tasks / stats.rows[0].total_tasks) * 100) 
            : 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update user
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, jobTitle, bio } = req.body;
    
    const result = await db.query(
      `UPDATE users 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           job_title = COALESCE($3, job_title),
           bio = COALESCE($4, bio)
       WHERE id = $5
       RETURNING id, email, first_name, last_name, role, avatar_url, job_title, bio`,
      [firstName, lastName, jobTitle, bio, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const user = result.rows[0];
    
    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        avatarUrl: user.avatar_url,
        jobTitle: user.job_title,
        bio: user.bio
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
