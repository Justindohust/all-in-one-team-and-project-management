const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Get team members with stats
router.get('/members', async (req, res, next) => {
  try {
    const { workspaceId, role, search } = req.query;
    
    let query = `
      SELECT u.*, wm.role as workspace_role,
             (SELECT COUNT(*) FROM tasks WHERE assignee_id = u.id) as total_tasks,
             (SELECT COUNT(*) FROM tasks WHERE assignee_id = u.id AND status = 'done') as completed_tasks,
             (SELECT COUNT(DISTINCT project_id) FROM project_members WHERE user_id = u.id) as total_projects
      FROM users u
      JOIN workspace_members wm ON u.id = wm.user_id
      WHERE wm.workspace_id = $1
    `;
    const params = [workspaceId || '01234567-89ab-cdef-0123-456789abcdef'];
    
    if (role) {
      params.push(role);
      query += ` AND wm.role = $${params.length}`;
    }
    
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (u.first_name ILIKE $${params.length} OR u.last_name ILIKE $${params.length} OR u.email ILIKE $${params.length})`;
    }
    
    query += ' ORDER BY u.first_name, u.last_name';
    
    const result = await db.query(query, params);
    
    res.json({
      success: true,
      data: result.rows.map(m => ({
        id: m.id,
        email: m.email,
        firstName: m.first_name,
        lastName: m.last_name,
        avatarUrl: m.avatar_url,
        role: m.workspace_role,
        jobTitle: m.job_title,
        bio: m.bio,
        isOnline: m.is_online,
        lastSeenAt: m.last_seen_at,
        stats: {
          totalTasks: parseInt(m.total_tasks),
          completedTasks: parseInt(m.completed_tasks),
          totalProjects: parseInt(m.total_projects),
          completionRate: m.total_tasks > 0 
            ? Math.round((m.completed_tasks / m.total_tasks) * 100) 
            : 0
        }
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Get team stats
router.get('/stats', async (req, res, next) => {
  try {
    const workspaceId = req.query.workspaceId || '01234567-89ab-cdef-0123-456789abcdef';
    
    const stats = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM workspace_members WHERE workspace_id = $1) as total_members,
        (SELECT COUNT(*) FROM users u JOIN workspace_members wm ON u.id = wm.user_id WHERE wm.workspace_id = $1 AND u.is_online = true) as online_members,
        (SELECT COUNT(*) FROM invitations WHERE workspace_id = $1 AND status = 'pending') as pending_invites,
        (SELECT COUNT(DISTINCT job_title) FROM users u JOIN workspace_members wm ON u.id = wm.user_id WHERE wm.workspace_id = $1) as departments
    `, [workspaceId]);
    
    res.json({
      success: true,
      data: {
        totalMembers: parseInt(stats.rows[0].total_members),
        onlineMembers: parseInt(stats.rows[0].online_members),
        pendingInvites: parseInt(stats.rows[0].pending_invites),
        departments: parseInt(stats.rows[0].departments)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Invite member
router.post('/invite', async (req, res, next) => {
  try {
    const { email, role, message, workspaceId, invitedBy } = req.body;
    
    // Check if already invited
    const existing = await db.query(
      'SELECT id FROM invitations WHERE email = $1 AND workspace_id = $2 AND status = $3',
      [email, workspaceId || '01234567-89ab-cdef-0123-456789abcdef', 'pending']
    );
    
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'User already invited' });
    }
    
    // Check if user already exists
    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      // Check if already a member
      const existingMember = await db.query(
        'SELECT id FROM workspace_members WHERE user_id = $1 AND workspace_id = $2',
        [existingUser.rows[0].id, workspaceId || '01234567-89ab-cdef-0123-456789abcdef']
      );
      
      if (existingMember.rows.length > 0) {
        return res.status(400).json({ success: false, message: 'User is already a member' });
      }
    }
    
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days
    
    const result = await db.query(
      `INSERT INTO invitations (workspace_id, email, role, message, token, invited_by, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [workspaceId || '01234567-89ab-cdef-0123-456789abcdef', email, role || 'member', message, token, invitedBy, expiresAt]
    );
    
    res.status(201).json({
      success: true,
      data: {
        id: result.rows[0].id,
        email: result.rows[0].email,
        role: result.rows[0].role,
        status: result.rows[0].status,
        expiresAt: result.rows[0].expires_at
      },
      message: 'Invitation sent successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Get pending invitations
router.get('/invitations', async (req, res, next) => {
  try {
    const workspaceId = req.query.workspaceId || '01234567-89ab-cdef-0123-456789abcdef';
    
    const result = await db.query(
      `SELECT i.*, u.first_name as inviter_first_name, u.last_name as inviter_last_name
       FROM invitations i
       LEFT JOIN users u ON i.invited_by = u.id
       WHERE i.workspace_id = $1 AND i.status = 'pending'
       ORDER BY i.created_at DESC`,
      [workspaceId]
    );
    
    res.json({
      success: true,
      data: result.rows.map(inv => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        message: inv.message,
        status: inv.status,
        expiresAt: inv.expires_at,
        createdAt: inv.created_at,
        invitedBy: {
          firstName: inv.inviter_first_name,
          lastName: inv.inviter_last_name
        }
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Cancel invitation
router.delete('/invitations/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'DELETE FROM invitations WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invitation not found' });
    }
    
    res.json({ success: true, message: 'Invitation cancelled' });
  } catch (error) {
    next(error);
  }
});

// Update member role
router.patch('/members/:userId/role', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role, workspaceId } = req.body;
    
    const result = await db.query(
      `UPDATE workspace_members SET role = $1 WHERE user_id = $2 AND workspace_id = $3 RETURNING *`,
      [role, userId, workspaceId || '01234567-89ab-cdef-0123-456789abcdef']
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Remove member from workspace
router.delete('/members/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { workspaceId } = req.query;
    
    const result = await db.query(
      'DELETE FROM workspace_members WHERE user_id = $1 AND workspace_id = $2 RETURNING id',
      [userId, workspaceId || '01234567-89ab-cdef-0123-456789abcdef']
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }
    
    res.json({ success: true, message: 'Member removed successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
