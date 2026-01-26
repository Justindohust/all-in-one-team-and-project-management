const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all projects
router.get('/', async (req, res, next) => {
  try {
    const { groupId, status, favorite } = req.query;
    
    let query = `
      SELECT p.*, pg.name as group_name,
             (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
             (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'done') as completed_task_count
      FROM projects p
      LEFT JOIN project_groups pg ON p.group_id = pg.id
      WHERE 1=1
    `;
    const params = [];
    
    if (groupId) {
      params.push(groupId);
      query += ` AND p.group_id = $${params.length}`;
    }
    
    if (status) {
      params.push(status);
      query += ` AND p.status = $${params.length}`;
    }
    
    if (favorite === 'true') {
      query += ' AND p.is_favorite = true';
    }
    
    query += ' ORDER BY p.is_favorite DESC, p.name';
    
    const result = await db.query(query, params);
    
    res.json({
      success: true,
      data: result.rows.map(p => ({
        id: p.id,
        groupId: p.group_id,
        groupName: p.group_name,
        name: p.name,
        description: p.description,
        color: p.color,
        status: p.status,
        isFavorite: p.is_favorite,
        progress: p.progress,
        startDate: p.start_date,
        endDate: p.end_date,
        taskCount: parseInt(p.task_count),
        completedTaskCount: parseInt(p.completed_task_count),
        createdAt: p.created_at
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Get project by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      `SELECT p.*, pg.name as group_name,
              (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
              (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'done') as completed_task_count
       FROM projects p
       LEFT JOIN project_groups pg ON p.group_id = pg.id
       WHERE p.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    const p = result.rows[0];
    
    // Get project members
    const members = await db.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.avatar_url, u.job_title, pm.role
       FROM project_members pm
       JOIN users u ON pm.user_id = u.id
       WHERE pm.project_id = $1`,
      [id]
    );
    
    res.json({
      success: true,
      data: {
        id: p.id,
        groupId: p.group_id,
        groupName: p.group_name,
        name: p.name,
        description: p.description,
        color: p.color,
        status: p.status,
        isFavorite: p.is_favorite,
        progress: p.progress,
        startDate: p.start_date,
        endDate: p.end_date,
        taskCount: parseInt(p.task_count),
        completedTaskCount: parseInt(p.completed_task_count),
        createdAt: p.created_at,
        members: members.rows.map(m => ({
          id: m.id,
          email: m.email,
          firstName: m.first_name,
          lastName: m.last_name,
          avatarUrl: m.avatar_url,
          jobTitle: m.job_title,
          role: m.role
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

// Create project
router.post('/', async (req, res, next) => {
  try {
    const { groupId, name, description, color, startDate, endDate, isFavorite, createdBy } = req.body;
    
    const result = await db.query(
      `INSERT INTO projects (group_id, name, description, color, start_date, end_date, is_favorite, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [groupId, name, description, color || '#6366f1', startDate, endDate, isFavorite || false, createdBy]
    );
    
    const project = result.rows[0];
    
    res.status(201).json({
      success: true,
      data: {
        id: project.id,
        groupId: project.group_id,
        name: project.name,
        description: project.description,
        color: project.color,
        status: project.status,
        isFavorite: project.is_favorite,
        progress: project.progress,
        startDate: project.start_date,
        endDate: project.end_date,
        createdAt: project.created_at
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update project
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, color, status, isFavorite, progress, startDate, endDate } = req.body;
    
    const result = await db.query(
      `UPDATE projects 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           color = COALESCE($3, color),
           status = COALESCE($4, status),
           is_favorite = COALESCE($5, is_favorite),
           progress = COALESCE($6, progress),
           start_date = COALESCE($7, start_date),
           end_date = COALESCE($8, end_date)
       WHERE id = $9
       RETURNING *`,
      [name, description, color, status, isFavorite, progress, startDate, endDate, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Toggle favorite
router.patch('/:id/favorite', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      `UPDATE projects SET is_favorite = NOT is_favorite WHERE id = $1 RETURNING id, is_favorite`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Delete project
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await db.query('DELETE FROM projects WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
