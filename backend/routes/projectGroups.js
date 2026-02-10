const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all project groups with projects
router.get('/', async (req, res, next) => {
  try {
    const groupsResult = await db.query(
      `SELECT id, name, description, color, icon, is_expanded, sort_order 
       FROM project_groups 
       ORDER BY sort_order, name`
    );
    
    const projectsResult = await db.query(
      `SELECT p.id, p.group_id, p.name, p.description, p.color, p.status, p.is_favorite, p.progress,
              p.start_date, p.end_date, p.created_at,
              (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
              (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'done') as completed_task_count
       FROM projects p
       ORDER BY p.is_favorite DESC, p.name`
    );
    
    // Get all modules
    const modulesResult = await db.query(
      `SELECT id, project_id, name, description, status, priority, start_date, due_date, progress, sort_order
       FROM modules
       ORDER BY sort_order, name`
    );
    
    // Get all submodules
    const submodulesResult = await db.query(
      `SELECT id, module_id, name, description, status, priority, start_date, due_date, progress, sort_order
       FROM submodules
       ORDER BY sort_order, name`
    );
    
    // Get all tasks
    const tasksResult = await db.query(
      `SELECT t.id, t.project_id, t.module_id, t.submodule_id, t.title, t.description, t.status, t.priority, 
              t.due_date, t.assignee_id, t.sort_order,
              u.first_name || ' ' || u.last_name as assignee_name
       FROM tasks t
       LEFT JOIN users u ON t.assignee_id = u.id
       ORDER BY t.sort_order, t.created_at`
    );
    
    const groups = groupsResult.rows.map(group => ({
      id: group.id,
      name: group.name,
      description: group.description,
      color: group.color,
      icon: group.icon,
      isExpanded: group.is_expanded,
      sortOrder: group.sort_order,
      projects: projectsResult.rows
        .filter(p => p.group_id === group.id)
        .map(p => {
          const project = {
            id: p.id,
            groupId: p.group_id,
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
            modules: []
          };
          
          // Add modules to project
          project.modules = modulesResult.rows
            .filter(m => m.project_id === p.id)
            .map(m => {
              const module = {
                id: m.id,
                projectId: m.project_id,
                name: m.name,
                description: m.description,
                status: m.status,
                priority: m.priority,
                start_date: m.start_date,
                due_date: m.due_date,
                progress: m.progress,
                sortOrder: m.sort_order,
                submodules: [],
                tasks: []
              };
              
              // Add submodules to module
              module.submodules = submodulesResult.rows
                .filter(sm => sm.module_id === m.id)
                .map(sm => ({
                  id: sm.id,
                  moduleId: sm.module_id,
                  name: sm.name,
                  description: sm.description,
                  status: sm.status,
                  priority: sm.priority,
                  start_date: sm.start_date,
                  due_date: sm.due_date,
                  progress: sm.progress,
                  sortOrder: sm.sort_order,
                  tasks: tasksResult.rows
                    .filter(t => t.submodule_id === sm.id)
                    .map(t => ({
                      id: t.id,
                      submoduleId: t.submodule_id,
                      moduleId: t.module_id,
                      title: t.title,
                      name: t.title,
                      description: t.description,
                      status: t.status,
                      priority: t.priority,
                      dueDate: t.due_date,
                      assignee: t.assignee_name,
                      assigneeId: t.assignee_id,
                      sortOrder: t.sort_order
                    }))
                }));
              
              // Add tasks directly to module (tasks not in submodules)
              module.tasks = tasksResult.rows
                .filter(t => t.module_id === m.id && !t.submodule_id)
                .map(t => ({
                  id: t.id,
                  moduleId: t.module_id,
                  title: t.title,
                  name: t.title,
                  description: t.description,
                  status: t.status,
                  priority: t.priority,
                  dueDate: t.due_date,
                  assignee: t.assignee_name,
                  assigneeId: t.assignee_id,
                  sortOrder: t.sort_order
                }));
              
              return module;
            });
          
          return project;
        })
    }));
    
    res.json({ success: true, data: groups });
  } catch (error) {
    next(error);
  }
});

// Create project group
router.post('/', async (req, res, next) => {
  try {
    const { name, description, color, icon, workspaceId } = req.body;
    
    // Get max sort order
    const maxOrder = await db.query('SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM project_groups');
    
    const result = await db.query(
      `INSERT INTO project_groups (workspace_id, name, description, color, icon, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, description, color, icon, is_expanded, sort_order`,
      [workspaceId || '01234567-89ab-cdef-0123-456789abcdef', name, description, color || '#6366f1', icon || 'folder', maxOrder.rows[0].next_order]
    );
    
    const group = result.rows[0];
    
    res.status(201).json({
      success: true,
      data: {
        id: group.id,
        name: group.name,
        description: group.description,
        color: group.color,
        icon: group.icon,
        isExpanded: group.is_expanded,
        sortOrder: group.sort_order,
        projects: []
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update project group
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, color, icon, isExpanded } = req.body;
    
    const result = await db.query(
      `UPDATE project_groups 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           color = COALESCE($3, color),
           icon = COALESCE($4, icon),
           is_expanded = COALESCE($5, is_expanded)
       WHERE id = $6
       RETURNING id, name, description, color, icon, is_expanded, sort_order`,
      [name, description, color, icon, isExpanded, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project group not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Delete project group
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await db.query('DELETE FROM project_groups WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project group not found' });
    }
    
    res.json({ success: true, message: 'Project group deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
