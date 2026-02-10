const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all tasks with filters
router.get('/', async (req, res, next) => {
  try {
    const { projectId, status, priority, assigneeId, search } = req.query;
    
    let query = `
      SELECT t.*, 
             p.name as project_name, p.color as project_color,
             u.first_name as assignee_first_name, u.last_name as assignee_last_name, 
             u.avatar_url as assignee_avatar, u.email as assignee_email
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assignee_id = u.id
      WHERE 1=1
    `;
    const params = [];
    
    if (projectId) {
      params.push(projectId);
      query += ` AND t.project_id = $${params.length}`;
    }
    
    if (status) {
      params.push(status);
      query += ` AND t.status = $${params.length}`;
    }
    
    if (priority) {
      params.push(priority);
      query += ` AND t.priority = $${params.length}`;
    }
    
    if (assigneeId) {
      params.push(assigneeId);
      query += ` AND t.assignee_id = $${params.length}`;
    }
    
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (t.title ILIKE $${params.length} OR t.description ILIKE $${params.length})`;
    }
    
    query += ' ORDER BY t.sort_order, t.created_at DESC';
    
    const result = await db.query(query, params);
    
    res.json({
      success: true,
      data: result.rows.map(t => ({
        id: t.id,
        projectId: t.project_id,
        projectName: t.project_name,
        projectColor: t.project_color,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        dueDate: t.due_date,
        completedAt: t.completed_at,
        estimatedHours: t.estimated_hours,
        actualHours: t.actual_hours,
        tags: t.tags,
        createdAt: t.created_at,
        assignee: t.assignee_id ? {
          id: t.assignee_id,
          firstName: t.assignee_first_name,
          lastName: t.assignee_last_name,
          avatarUrl: t.assignee_avatar,
          email: t.assignee_email
        } : null
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Get tasks grouped by status (for Kanban)
router.get('/kanban', async (req, res, next) => {
  try {
    const { projectId } = req.query;
    
    let query = `
      SELECT t.*, 
             p.name as project_name, p.color as project_color,
             u.first_name as assignee_first_name, u.last_name as assignee_last_name, 
             u.avatar_url as assignee_avatar
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assignee_id = u.id
    `;
    const params = [];
    
    if (projectId) {
      params.push(projectId);
      query += ` WHERE t.project_id = $${params.length}`;
    }
    
    query += ' ORDER BY t.sort_order, t.created_at DESC';
    
    const result = await db.query(query, params);
    
    const kanban = {
      todo: [],
      in_progress: [],
      in_review: [],
      done: []
    };
    
    result.rows.forEach(t => {
      const task = {
        id: t.id,
        projectId: t.project_id,
        projectName: t.project_name,
        projectColor: t.project_color,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        dueDate: t.due_date,
        assignee: t.assignee_id ? {
          id: t.assignee_id,
          firstName: t.assignee_first_name,
          lastName: t.assignee_last_name,
          avatarUrl: t.assignee_avatar
        } : null
      };
      
      if (kanban[t.status]) {
        kanban[t.status].push(task);
      }
    });
    
    res.json({ success: true, data: kanban });
  } catch (error) {
    next(error);
  }
});

// Get task by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      `SELECT t.*, 
              p.name as project_name, p.color as project_color,
              u.first_name as assignee_first_name, u.last_name as assignee_last_name, 
              u.avatar_url as assignee_avatar, u.email as assignee_email
       FROM tasks t
       LEFT JOIN projects p ON t.project_id = p.id
       LEFT JOIN users u ON t.assignee_id = u.id
       WHERE t.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    
    const t = result.rows[0];
    
    // Get comments
    const comments = await db.query(
      `SELECT tc.*, u.first_name, u.last_name, u.avatar_url
       FROM task_comments tc
       LEFT JOIN users u ON tc.user_id = u.id
       WHERE tc.task_id = $1
       ORDER BY tc.created_at DESC`,
      [id]
    );
    
    res.json({
      success: true,
      data: {
        id: t.id,
        projectId: t.project_id,
        projectName: t.project_name,
        projectColor: t.project_color,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        dueDate: t.due_date,
        completedAt: t.completed_at,
        estimatedHours: t.estimated_hours,
        actualHours: t.actual_hours,
        tags: t.tags,
        createdAt: t.created_at,
        assignee: t.assignee_id ? {
          id: t.assignee_id,
          firstName: t.assignee_first_name,
          lastName: t.assignee_last_name,
          avatarUrl: t.assignee_avatar,
          email: t.assignee_email
        } : null,
        comments: comments.rows.map(c => ({
          id: c.id,
          content: c.content,
          createdAt: c.created_at,
          user: {
            id: c.user_id,
            firstName: c.first_name,
            lastName: c.last_name,
            avatarUrl: c.avatar_url
          }
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

// Create task
router.post('/', async (req, res, next) => {
  try {
    const { projectId, moduleId, title, description, status, priority, assigneeId, dueDate, estimatedHours, tags, createdBy } = req.body;
    
    const result = await db.query(
      `INSERT INTO tasks (project_id, module_id, title, description, status, priority, assignee_id, due_date, estimated_hours, tags, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [projectId, moduleId, title, description, status || 'todo', priority || 'medium', assigneeId, dueDate, estimatedHours, tags, createdBy]
    );
    
    // Log activity
    await db.query(
      `INSERT INTO activity_logs (workspace_id, user_id, action, entity_type, entity_id, entity_name)
       VALUES ('01234567-89ab-cdef-0123-456789abcdef', $1, 'created', 'task', $2, $3)`,
      [createdBy, result.rows[0].id, title]
    );
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Update task
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, assigneeId, dueDate, estimatedHours, actualHours, tags } = req.body;
    
    // Check if status changed to done
    let completedAt = null;
    if (status === 'done') {
      const current = await db.query('SELECT status FROM tasks WHERE id = $1', [id]);
      if (current.rows.length > 0 && current.rows[0].status !== 'done') {
        completedAt = new Date();
      }
    }
    
    const result = await db.query(
      `UPDATE tasks 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           status = COALESCE($3, status),
           priority = COALESCE($4, priority),
           assignee_id = COALESCE($5, assignee_id),
           due_date = COALESCE($6, due_date),
           estimated_hours = COALESCE($7, estimated_hours),
           actual_hours = COALESCE($8, actual_hours),
           tags = COALESCE($9, tags),
           completed_at = COALESCE($10, completed_at)
       WHERE id = $11
       RETURNING *`,
      [title, description, status, priority, assigneeId, dueDate, estimatedHours, actualHours, tags, completedAt, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Update task status (quick update for Kanban drag & drop)
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    let completedAt = null;
    if (status === 'done') {
      completedAt = new Date();
    }
    
    const result = await db.query(
      `UPDATE tasks SET status = $1, completed_at = $2 WHERE id = $3 RETURNING *`,
      [status, completedAt, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Add comment to task
router.post('/:id/comments', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content, userId } = req.body;
    
    const result = await db.query(
      `INSERT INTO task_comments (task_id, user_id, content) VALUES ($1, $2, $3) RETURNING *`,
      [id, userId, content]
    );
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Delete task
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await db.query('DELETE FROM tasks WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
