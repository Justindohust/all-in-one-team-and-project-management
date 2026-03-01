/**
 * Process Flow Diagram API Routes
 * Handles saving and loading process flow diagrams for projects
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

// Get diagram for a project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const result = await db.query(
      `SELECT * FROM process_flow_diagrams WHERE project_id = $1`,
      [projectId]
    );
    
    if (result.rows.length === 0) {
      // Return empty diagram structure if none exists
      return res.json({
        success: true,
        data: {
          modulesConfig: [],
          moduleData: {},
          connectionData: {},
          moduleConnections: []
        }
      });
    }
    
    const diagram = result.rows[0];
    res.json({
      success: true,
      data: {
        modulesConfig: diagram.modules_config || [],
        moduleData: diagram.module_data || {},
        connectionData: diagram.connection_data || {},
        moduleConnections: diagram.module_connections || []
      }
    });
  } catch (error) {
    console.error('Get process flow diagram error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch process flow diagram'
    });
  }
});

// Save diagram for a project
router.post('/project/:projectId', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { modulesConfig, moduleData, connectionData, moduleConnections } = req.body;
    
    // Check if diagram already exists
    const existing = await db.query(
      `SELECT id FROM process_flow_diagrams WHERE project_id = $1`,
      [projectId]
    );
    
    let result;
    if (existing.rows.length > 0) {
      // Update existing
      result = await db.query(
        `UPDATE process_flow_diagrams SET
          modules_config = $1,
          module_data = $2,
          connection_data = $3,
          module_connections = $4,
          updated_at = CURRENT_TIMESTAMP
         WHERE project_id = $5
         RETURNING *`,
        [modulesConfig, moduleData, connectionData, moduleConnections, projectId]
      );
    } else {
      // Insert new
      result = await db.query(
        `INSERT INTO process_flow_diagrams (
          project_id, modules_config, module_data, connection_data, module_connections, created_by
         ) VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [projectId, modulesConfig, moduleData, connectionData, moduleConnections, req.user.id]
      );
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Process flow diagram saved successfully'
    });
  } catch (error) {
    console.error('Save process flow diagram error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save process flow diagram'
    });
  }
});

// Delete diagram for a project
router.delete('/project/:projectId', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    await db.query(
      `DELETE FROM process_flow_diagrams WHERE project_id = $1`,
      [projectId]
    );
    
    res.json({
      success: true,
      message: 'Process flow diagram deleted successfully'
    });
  } catch (error) {
    console.error('Delete process flow diagram error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete process flow diagram'
    });
  }
});

module.exports = router;

