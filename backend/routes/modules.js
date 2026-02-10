const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

// Get all modules for a project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const result = await db.query(
      `SELECT m.*, 
        u.first_name || ' ' || u.last_name as creator_name,
        (SELECT COUNT(*) FROM tasks WHERE module_id = m.id) as task_count
      FROM modules m
      LEFT JOIN users u ON m.created_by = u.id
      WHERE m.project_id = $1
      ORDER BY m.sort_order, m.created_at`,
      [projectId]
    );
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get modules error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch modules'
    });
  }
});

// Get module by ID with tasks
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const moduleResult = await db.query(
      `SELECT m.*, 
        u.first_name || ' ' || u.last_name as creator_name,
        p.name as project_name
      FROM modules m
      LEFT JOIN users u ON m.created_by = u.id
      LEFT JOIN projects p ON m.project_id = p.id
      WHERE m.id = $1`,
      [id]
    );
    
    if (moduleResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }
    
    const tasksResult = await db.query(
      `SELECT t.*,
        u.first_name || ' ' || u.last_name as assignee_name
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      WHERE t.module_id = $1
      ORDER BY t.sort_order, t.created_at`,
      [id]
    );
    
    const module = moduleResult.rows[0];
    module.tasks = tasksResult.rows;
    
    res.json({
      success: true,
      data: module
    });
  } catch (error) {
    console.error('Get module error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch module'
    });
  }
});

// Create new module
router.post('/', auth, async (req, res) => {
  try {
    const {
      project_id,
      name,
      description,
      status = 'active',
      priority = 'medium',
      start_date,
      due_date,
      sort_order = 0
    } = req.body;
    
    if (!project_id || !name) {
      return res.status(400).json({
        success: false,
        message: 'Project ID and name are required'
      });
    }
    
    const result = await db.query(
      `INSERT INTO modules (
        project_id, name, description, status, priority,
        start_date, due_date, sort_order, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [project_id, name, description, status, priority, start_date, due_date, sort_order, req.user.id]
    );
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Module created successfully'
    });
  } catch (error) {
    console.error('Create module error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create module'
    });
  }
});

// Update module
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      status,
      priority,
      start_date,
      due_date,
      progress,
      sort_order
    } = req.body;
    
    const result = await db.query(
      `UPDATE modules SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        status = COALESCE($3, status),
        priority = COALESCE($4, priority),
        start_date = COALESCE($5, start_date),
        due_date = COALESCE($6, due_date),
        progress = COALESCE($7, progress),
        sort_order = COALESCE($8, sort_order),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *`,
      [name, description, status, priority, start_date, due_date, progress, sort_order, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Module updated successfully'
    });
  } catch (error) {
    console.error('Update module error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update module'
    });
  }
});

// Move module to different project
router.patch('/:id/move', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { project_id } = req.body;
    
    if (!project_id) {
      return res.status(400).json({
        success: false,
        message: 'Target project ID is required'
      });
    }
    
    const result = await db.query(
      `UPDATE modules SET
        project_id = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *`,
      [project_id, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Module moved successfully'
    });
  } catch (error) {
    console.error('Move module error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to move module'
    });
  }
});

// Delete module
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'DELETE FROM modules WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Module deleted successfully'
    });
  } catch (error) {
    console.error('Delete module error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete module'
    });
  }
});

module.exports = router;
