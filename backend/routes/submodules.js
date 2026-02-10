const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

// Get all submodules for a module
router.get('/module/:moduleId', auth, async (req, res) => {
  try {
    const { moduleId } = req.params;
    
    const result = await db.query(
      `SELECT s.*, 
        u.first_name || ' ' || u.last_name as creator_name,
        (SELECT COUNT(*) FROM tasks WHERE submodule_id = s.id) as task_count
      FROM submodules s
      LEFT JOIN users u ON s.created_by = u.id
      WHERE s.module_id = $1
      ORDER BY s.sort_order, s.created_at`,
      [moduleId]
    );
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get submodules error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch submodules'
    });
  }
});

// Get submodule by ID with tasks
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const submoduleResult = await db.query(
      `SELECT s.*, 
        u.first_name || ' ' || u.last_name as creator_name,
        m.name as module_name,
        p.name as project_name
      FROM submodules s
      LEFT JOIN users u ON s.created_by = u.id
      LEFT JOIN modules m ON s.module_id = m.id
      LEFT JOIN projects p ON m.project_id = p.id
      WHERE s.id = $1`,
      [id]
    );
    
    if (submoduleResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Submodule not found'
      });
    }
    
    const tasksResult = await db.query(
      `SELECT t.*,
        u.first_name || ' ' || u.last_name as assignee_name
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      WHERE t.submodule_id = $1
      ORDER BY t.sort_order, t.created_at`,
      [id]
    );
    
    const submodule = submoduleResult.rows[0];
    submodule.tasks = tasksResult.rows;
    
    res.json({
      success: true,
      data: submodule
    });
  } catch (error) {
    console.error('Get submodule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch submodule'
    });
  }
});

// Create new submodule
router.post('/', auth, async (req, res) => {
  try {
    const {
      module_id,
      name,
      description,
      status = 'active',
      priority = 'medium',
      start_date,
      due_date,
      sort_order = 0
    } = req.body;
    
    if (!module_id || !name) {
      return res.status(400).json({
        success: false,
        message: 'Module ID and name are required'
      });
    }
    
    const result = await db.query(
      `INSERT INTO submodules (
        module_id, name, description, status, priority, 
        start_date, due_date, sort_order, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        module_id, name, description, status, priority,
        start_date, due_date, sort_order, req.user.id
      ]
    );
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Submodule created successfully'
    });
  } catch (error) {
    console.error('Create submodule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create submodule'
    });
  }
});

// Update submodule
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
      `UPDATE submodules SET
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
        message: 'Submodule not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Submodule updated successfully'
    });
  } catch (error) {
    console.error('Update submodule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update submodule'
    });
  }
});

// Move submodule to different module
router.patch('/:id/move', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { module_id } = req.body;
    
    if (!module_id) {
      return res.status(400).json({
        success: false,
        message: 'Target module ID is required'
      });
    }
    
    const result = await db.query(
      `UPDATE submodules SET
        module_id = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *`,
      [module_id, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Submodule not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Submodule moved successfully'
    });
  } catch (error) {
    console.error('Move submodule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to move submodule'
    });
  }
});

// Delete submodule
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if submodule has tasks
    const tasksCheck = await db.query(
      'SELECT COUNT(*) as count FROM tasks WHERE submodule_id = $1',
      [id]
    );
    
    if (parseInt(tasksCheck.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete submodule with existing tasks. Please reassign or delete tasks first.'
      });
    }
    
    const result = await db.query(
      'DELETE FROM submodules WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Submodule not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Submodule deleted successfully'
    });
  } catch (error) {
    console.error('Delete submodule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete submodule'
    });
  }
});

// Update submodule progress
router.patch('/:id/progress', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { progress } = req.body;
    
    if (progress === undefined || progress < 0 || progress > 100) {
      return res.status(400).json({
        success: false,
        message: 'Progress must be between 0 and 100'
      });
    }
    
    const result = await db.query(
      `UPDATE submodules SET
        progress = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *`,
      [progress, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Submodule not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Progress updated successfully'
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update progress'
    });
  }
});

module.exports = router;
