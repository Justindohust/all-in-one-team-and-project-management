const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get events for a date range
router.get('/events', async (req, res, next) => {
  try {
    const { startDate, endDate, workspaceId } = req.query;
    
    let query = `
      SELECT ce.*, 
             p.name as project_name, p.color as project_color,
             u.first_name as creator_first_name, u.last_name as creator_last_name
      FROM calendar_events ce
      LEFT JOIN projects p ON ce.project_id = p.id
      LEFT JOIN users u ON ce.created_by = u.id
      WHERE ce.workspace_id = $1
    `;
    const params = [workspaceId || '01234567-89ab-cdef-0123-456789abcdef'];
    
    if (startDate) {
      params.push(startDate);
      query += ` AND ce.start_time >= $${params.length}`;
    }
    
    if (endDate) {
      params.push(endDate);
      query += ` AND ce.start_time <= $${params.length}`;
    }
    
    query += ' ORDER BY ce.start_time';
    
    const result = await db.query(query, params);
    
    // Also get tasks with due dates in the range
    let taskQuery = `
      SELECT t.id, t.title, t.due_date, t.priority, t.status,
             p.name as project_name, p.color as project_color
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.due_date IS NOT NULL
    `;
    const taskParams = [];
    
    if (startDate) {
      taskParams.push(startDate);
      taskQuery += ` AND t.due_date >= $${taskParams.length}`;
    }
    
    if (endDate) {
      taskParams.push(endDate);
      taskQuery += ` AND t.due_date <= $${taskParams.length}`;
    }
    
    taskQuery += ' ORDER BY t.due_date';
    
    const tasksResult = await db.query(taskQuery, taskParams);
    
    res.json({
      success: true,
      data: {
        events: result.rows.map(e => ({
          id: e.id,
          title: e.title,
          description: e.description,
          eventType: e.event_type,
          startTime: e.start_time,
          endTime: e.end_time,
          isAllDay: e.is_all_day,
          recurrence: e.recurrence,
          color: e.color,
          projectId: e.project_id,
          projectName: e.project_name,
          projectColor: e.project_color,
          createdBy: {
            firstName: e.creator_first_name,
            lastName: e.creator_last_name
          }
        })),
        tasks: tasksResult.rows.map(t => ({
          id: t.id,
          title: t.title,
          dueDate: t.due_date,
          priority: t.priority,
          status: t.status,
          projectName: t.project_name,
          projectColor: t.project_color,
          type: 'task'
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

// Create event
router.post('/events', async (req, res, next) => {
  try {
    const { title, description, eventType, startTime, endTime, isAllDay, recurrence, color, projectId, workspaceId, createdBy } = req.body;
    
    const result = await db.query(
      `INSERT INTO calendar_events (workspace_id, project_id, title, description, event_type, start_time, end_time, is_all_day, recurrence, color, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [workspaceId || '01234567-89ab-cdef-0123-456789abcdef', projectId, title, description, eventType || 'event', startTime, endTime, isAllDay || false, recurrence || 'none', color || '#6366f1', createdBy]
    );
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Update event
router.put('/events/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, eventType, startTime, endTime, isAllDay, recurrence, color } = req.body;
    
    const result = await db.query(
      `UPDATE calendar_events 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           event_type = COALESCE($3, event_type),
           start_time = COALESCE($4, start_time),
           end_time = COALESCE($5, end_time),
           is_all_day = COALESCE($6, is_all_day),
           recurrence = COALESCE($7, recurrence),
           color = COALESCE($8, color)
       WHERE id = $9
       RETURNING *`,
      [title, description, eventType, startTime, endTime, isAllDay, recurrence, color, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Delete event
router.delete('/events/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await db.query('DELETE FROM calendar_events WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    
    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
