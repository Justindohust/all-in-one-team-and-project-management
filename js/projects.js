/**
 * Projects Management - CRUD Operations & Tree View Management
 */

// Global project tree view instance
let projectTreeView = null;
let currentEditingNode = null;
let deleteCallback = null;

// Initialize Projects Tree View
function initProjectsTreeView() {
  const container = document.getElementById('projects-treeview-page');
  if (!container) {
    console.error('Projects container not found');
    return;
  }
  
  // Check if data is loaded
  if (!app.state.projectGroups || app.state.projectGroups.length === 0) {
    container.innerHTML = '<div class="text-center py-8"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div><p class="text-slate-400">Loading projects...</p></div>';
    
    // Wait and retry
    setTimeout(() => {
      if (app.state.projectGroups && app.state.projectGroups.length > 0) {
        initProjectsTreeView();
      } else {
        container.innerHTML = '<div class="text-center py-8 text-slate-400"><svg class="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg><p class="text-sm">No project groups yet</p><button onclick="openTreeNodeModal(null, \'group\')" class="mt-4 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm">Create First Group</button></div>';
      }
    }, 1000);
    return;
  }
  
  console.log('Initializing Projects TreeView with data:', app.state.projectGroups);
  
  // Transform project groups data to tree structure
  const treeData = transformProjectGroupsToTree(app.state.projectGroups);
  
  projectTreeView = new AdvancedTreeView(container, {
    data: treeData,
    allowDrag: true,
    allowEdit: true,
    allowDelete: true,
    allowCreate: true,
    showContextMenu: true,
    onSelect: handleNodeSelect,
    onCreate: handleNodeCreate,
    onUpdate: handleNodeUpdate,
    onDelete: handleNodeDelete,
    onMove: handleNodeMove
  });
}

// Reload project groups from API
async function reloadProjectGroups() {
  try {
    const result = await api.getProjectGroups();
    if (result.success) {
      app.state.projectGroups = result.data;
      
      // Re-transform to tree structure
      const treeData = transformProjectGroupsToTree(app.state.projectGroups);
      
      // Update tree view
      if (projectTreeView) {
        projectTreeView.updateData(treeData);
      }
    }
  } catch (error) {
    console.error('Failed to reload project groups:', error);
  }
}

// Transform backend data to tree structure
function transformProjectGroupsToTree(projectGroups) {
  return projectGroups.map(group => ({
    id: `group-${group.id}`,
    name: group.name,
    type: 'group',
    status: 'active',
    count: group.projects?.length || 0,
    children: (group.projects || []).map(project => transformProjectToTree(project))
  }));
}

function transformProjectToTree(project) {
  const node = {
    id: `project-${project.id}`,
    name: project.name,
    type: 'project',
    status: project.status || 'active',
    count: project.modules?.length || 0
  };
  
  if (project.modules && project.modules.length > 0) {
    node.children = project.modules.map(module => transformModuleToTree(module));
  }
  
  return node;
}

function transformModuleToTree(module) {
  const node = {
    id: `module-${module.id}`,
    name: module.name,
    type: 'module',
    status: module.status || 'active',
    count: module.tasks?.length || 0
  };
  
  if (module.tasks && module.tasks.length > 0) {
    node.children = module.tasks.map(task => ({
      id: `task-${task.id}`,
      name: task.name || task.title,
      type: 'task',
      status: task.status || 'pending'
    }));
  }
  
  return node;
}

// Node Selection Handler
function handleNodeSelect(node) {
  console.log('Selected node:', node);
  showDetailPanel(node);
}

// Show detail panel
function showDetailPanel(node) {
  const panel = document.getElementById('project-detail-panel');
  const content = document.getElementById('detail-content');
  
  if (!panel || !content) return;
  
  const { type, realId } = parseNodeId(node.id);
  
  const typeColors = {
    group: 'text-primary-400',
    project: 'text-blue-400',
    module: 'text-purple-400',
    task: 'text-green-400'
  };
  
  const typeIcons = {
    group: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>',
    project: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>',
    module: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>',
    task: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>'
  };
  
  content.innerHTML = `
    <div class="flex items-start gap-3 pb-4 border-b border-slate-700">
      <div class="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
        <svg class="w-6 h-6 ${typeColors[type]}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          ${typeIcons[type]}
        </svg>
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-xs uppercase font-semibold ${typeColors[type]}">${type}</span>
          ${node.status ? `<span class="px-2 py-0.5 text-xs rounded ${getStatusClass(node.status)}">${node.status}</span>` : ''}
        </div>
        <h4 class="text-white font-semibold text-lg truncate">${node.name}</h4>
      </div>
    </div>
    
    ${node.description ? `
      <div>
        <h5 class="text-sm font-medium text-slate-400 mb-2">Description</h5>
        <p class="text-slate-300 text-sm">${node.description}</p>
      </div>
    ` : ''}
    
    <div class="grid grid-cols-2 gap-4">
      ${node.status ? `
        <div>
          <h5 class="text-sm font-medium text-slate-400 mb-1">Status</h5>
          <span class="inline-flex px-2 py-1 text-xs rounded ${getStatusClass(node.status)}">${node.status}</span>
        </div>
      ` : ''}
      
      ${node.priority ? `
        <div>
          <h5 class="text-sm font-medium text-slate-400 mb-1">Priority</h5>
          <span class="text-slate-300 text-sm">${capitalize(node.priority)}</span>
        </div>
      ` : ''}
      
      ${node.count !== undefined ? `
        <div>
          <h5 class="text-sm font-medium text-slate-400 mb-1">Items</h5>
          <span class="text-slate-300 text-sm">${node.count}</span>
        </div>
      ` : ''}
    </div>
    
    ${node.startDate || node.dueDate ? `
      <div>
        <h5 class="text-sm font-medium text-slate-400 mb-2">Timeline</h5>
        <div class="space-y-2">
          ${node.startDate ? `
            <div class="flex items-center gap-2 text-sm">
              <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <span class="text-slate-400">Start:</span>
              <span class="text-slate-300">${node.startDate}</span>
            </div>
          ` : ''}
          ${node.dueDate ? `
            <div class="flex items-center gap-2 text-sm">
              <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <span class="text-slate-400">Due:</span>
              <span class="text-slate-300">${node.dueDate}</span>
            </div>
          ` : ''}
        </div>
      </div>
    ` : ''}
    
    <div class="flex gap-2 pt-4 border-t border-slate-700">
      <button onclick="handleNodeUpdate(${JSON.stringify(node).replace(/"/g, '&quot;')})" class="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors">
        Edit
      </button>
      <button onclick="handleNodeDelete(${JSON.stringify(node).replace(/"/g, '&quot;')})" class="px-3 py-2 bg-danger/20 hover:bg-danger/30 text-danger text-sm rounded-lg transition-colors">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
      </button>
    </div>
  `;
  
  panel.classList.remove('hidden');
}

function closeDetailPanel() {
  const panel = document.getElementById('project-detail-panel');
  if (panel) {
    panel.classList.add('hidden');
  }
}

function getStatusClass(status) {
  const statusMap = {
    active: 'bg-success/20 text-success',
    completed: 'bg-blue-500/20 text-blue-400',
    pending: 'bg-warning/20 text-warning',
    archived: 'bg-slate-600/20 text-slate-400',
    todo: 'bg-slate-600/20 text-slate-400',
    in_progress: 'bg-info/20 text-info',
    done: 'bg-success/20 text-success'
  };
  return statusMap[status] || statusMap.pending;
}

// Node Create Handler
function handleNodeCreate(parentNode, templateNode = null) {
  currentEditingNode = null;
  
  const modal = document.getElementById('tree-node-modal');
  const title = document.getElementById('tree-node-modal-title');
  const form = document.getElementById('tree-node-form');
  const typeSelect = document.getElementById('node-type');
  
  // Reset form
  form.reset();
  document.getElementById('node-id').value = '';
  document.getElementById('node-parent-id').value = parentNode ? parentNode.id : '';
  
  // Set title and type based on parent
  if (parentNode) {
    const childType = getChildType(parentNode.type);
    title.textContent = `New ${capitalize(childType)}`;
    typeSelect.value = childType;
    typeSelect.disabled = true;
  } else {
    title.textContent = 'New Item';
    typeSelect.disabled = false;
  }
  
  // If duplicating, copy data
  if (templateNode) {
    document.getElementById('node-name').value = `${templateNode.name} (Copy)`;
    document.getElementById('node-description').value = templateNode.description || '';
    document.getElementById('node-status').value = templateNode.status || 'active';
  }
  
  // Populate assignees
  populateAssignees();
  
  modal.classList.remove('hidden');
}

// Node Update Handler
function handleNodeUpdate(node) {
  currentEditingNode = node;
  
  const modal = document.getElementById('tree-node-modal');
  const title = document.getElementById('tree-node-modal-title');
  const form = document.getElementById('tree-node-form');
  const typeSelect = document.getElementById('node-type');
  
  // Set title
  title.textContent = `Edit ${capitalize(node.type)}`;
  
  // Fill form with node data
  document.getElementById('node-id').value = node.id;
  document.getElementById('node-type').value = node.type;
  document.getElementById('node-name').value = node.name;
  document.getElementById('node-description').value = node.description || '';
  document.getElementById('node-status').value = node.status || 'active';
  
  typeSelect.disabled = true;
  
  // Populate assignees
  populateAssignees();
  
  modal.classList.remove('hidden');
}

// Node Delete Handler
function handleNodeDelete(node) {
  const modal = document.getElementById('delete-confirm-modal');
  const message = document.getElementById('delete-confirm-message');
  
  const childrenCount = node.children ? node.children.length : 0;
  const childrenText = childrenCount > 0 ? ` and all ${childrenCount} children` : '';
  
  message.textContent = `Are you sure you want to delete "${node.name}"${childrenText}? This action cannot be undone.`;
  
  deleteCallback = async () => {
    try {
      // Extract real ID from prefixed ID
      const { type, realId } = parseNodeId(node.id);
      
      // Call appropriate API endpoint
      const result = await deleteNodeFromAPI(type, realId);
      
      if (result.success) {
        // Reload data from API
        await reloadProjectGroups();
        
        // Show success message
        showNotification('Success', `${capitalize(type)} deleted successfully`, 'success');
      } else {
        throw new Error(result.message || 'Delete failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
      showNotification('Error', error.message || 'Failed to delete item', 'error');
    }
  };
  
  modal.classList.remove('hidden');
}

// Node Move Handler (Drag & Drop)
async function handleNodeMove(draggedNode, targetNode) {
  try {
    console.log('Moving', draggedNode.name, 'to', targetNode.name);
    
    const { type: draggedType, realId: draggedId } = parseNodeId(draggedNode.id);
    const { type: targetType, realId: targetId } = parseNodeId(targetNode.id);
    
    // Validate move is allowed
    if (!isValidMove(draggedType, targetType)) {
      showNotification('Error', `Cannot move ${draggedType} into ${targetType}`, 'error');
      return;
    }
    
    // Call API to move node
    const result = await moveNodeInAPI(draggedType, draggedId, targetType, targetId);
    
    if (result.success) {
      // Reload data from API
      await reloadProjectGroups();
      
      showNotification('Success', 'Item moved successfully', 'success');
    } else {
      throw new Error(result.message || 'Move failed');
    }
  } catch (error) {
    console.error('Move error:', error);
    showNotification('Error', error.message || 'Failed to move item', 'error');
  }
}

// Save Tree Node (Create/Update)
async function saveTreeNode(event) {
  event.preventDefault();
  
  const nodeId = document.getElementById('node-id').value;
  const parentId = document.getElementById('node-parent-id').value;
  const type = document.getElementById('node-type').value;
  const name = document.getElementById('node-name').value;
  const description = document.getElementById('node-description').value;
  const status = document.getElementById('node-status').value;
  const priority = document.getElementById('node-priority').value;
  const startDate = document.getElementById('node-start-date').value;
  const dueDate = document.getElementById('node-due-date').value;
  const assignees = Array.from(document.getElementById('node-assignees').selectedOptions).map(opt => opt.value);
  
  const nodeData = {
    name,
    description,
    status,
    priority,
    startDate,
    dueDate,
    assignees,
    type
  };
  
  try {
    let result;
    
    if (nodeId) {
      // Update existing node
      const { type: nodeType, realId } = parseNodeId(nodeId);
      result = await updateNodeInAPI(nodeType, realId, nodeData);
      
      if (result.success) {
        await reloadProjectGroups();
        showNotification('Success', `${capitalize(type)} updated successfully`, 'success');
      }
    } else {
      // Create new node
      const { type: parentType, realId: parentRealId } = parentId ? parseNodeId(parentId) : { type: null, realId: null };
      result = await createNodeInAPI(type, nodeData, parentType, parentRealId);
      
      if (result.success) {
        await reloadProjectGroups();
        showNotification('Success', `${capitalize(type)} created successfully`, 'success');
      }
    }
    
    if (result.success) {
      closeTreeNodeModal();
    } else {
      throw new Error(result.message || 'Save failed');
    }
  } catch (error) {
    console.error('Save error:', error);
    showNotification('Error', error.message || 'Failed to save item', 'error');
  }
}

// API Calls - Use real API endpoints
async function createNodeInAPI(type, data, parentType, parentId) {
  try {
    let endpoint = '';
    let payload = { ...data };
    
    switch (type) {
      case 'group':
        endpoint = '/api/project-groups';
        payload = {
          name: data.name,
          description: data.description,
          workspaceId: '01234567-89ab-cdef-0123-456789abcdef' // Default workspace
        };
        break;
      case 'project':
        endpoint = '/api/projects';
        payload = {
          name: data.name,
          description: data.description,
          groupId: parentId ? parentId.split('-')[1] : null,
          status: data.status,
          startDate: data.startDate,
          endDate: data.dueDate
        };
        break;
      case 'module':
        endpoint = '/api/modules';
        payload = {
          project_id: parentId ? parentId.split('-')[1] : null,
          name: data.name,
          description: data.description,
          status: data.status,
          priority: data.priority,
          start_date: data.startDate,
          due_date: data.dueDate
        };
        break;
      case 'task':
        endpoint = '/api/tasks';
        payload = {
          moduleId: parentId ? parentId.split('-')[1] : null,
          projectId: null, // Will be set by backend based on module
          title: data.name,
          description: data.description,
          status: data.status === 'active' ? 'todo' : data.status,
          priority: data.priority,
          dueDate: data.dueDate,
          assigneeId: data.assignees?.[0],
          createdBy: api.currentUser?.id
        };
        break;
      default:
        throw new Error(`Unknown type: ${type}`);
    }
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to create item');
    }
    
    return result;
  } catch (error) {
    console.error('Create error:', error);
    throw error;
  }
}

async function updateNodeInAPI(type, id, data) {
  try {
    let endpoint = '';
    let payload = {};
    
    switch (type) {
      case 'group':
        endpoint = `/api/project-groups/${id}`;
        payload = {
          name: data.name,
          description: data.description
        };
        break;
      case 'project':
        endpoint = `/api/projects/${id}`;
        payload = {
          name: data.name,
          description: data.description,
          status: data.status,
          startDate: data.startDate,
          endDate: data.dueDate
        };
        break;
      case 'module':
        endpoint = `/api/modules/${id}`;
        payload = {
          name: data.name,
          description: data.description,
          status: data.status,
          priority: data.priority,
          start_date: data.startDate,
          due_date: data.dueDate
        };
        break;
      case 'task':
        endpoint = `/api/tasks/${id}`;
        payload = {
          title: data.name,
          description: data.description,
          status: data.status === 'active' ? 'todo' : data.status,
          priority: data.priority,
          dueDate: data.dueDate,
          assigneeId: data.assignees?.[0]
        };
        break;
      default:
        throw new Error(`Unknown type: ${type}`);
    }
    
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to update item');
    }
    
    return result;
  } catch (error) {
    console.error('Update error:', error);
    throw error;
  }
}

async function deleteNodeFromAPI(type, id) {
  try {
    let endpoint = '';
    
    switch (type) {
      case 'group':
        endpoint = `/api/project-groups/${id}`;
        break;
      case 'project':
        endpoint = `/api/projects/${id}`;
        break;
      case 'module':
        endpoint = `/api/modules/${id}`;
        break;
      case 'task':
        endpoint = `/api/tasks/${id}`;
        break;
      default:
        throw new Error(`Unknown type: ${type}`);
    }
    
    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to delete item');
    }
    
    return result;
  } catch (error) {
    console.error('Delete error:', error);
    throw error;
  }
}

async function moveNodeInAPI(draggedType, draggedId, targetType, targetId) {
  try {
    let endpoint = '';
    let payload = {};
    
    // Only support specific move operations
    if (draggedType === 'project' && targetType === 'group') {
      endpoint = `/api/projects/${draggedId}`;
      payload = { groupId: targetId };
    } else if (draggedType === 'module' && targetType === 'project') {
      endpoint = `/api/modules/${draggedId}/move`;
      payload = { project_id: targetId };
    } else if (draggedType === 'task' && targetType === 'module') {
      endpoint = `/api/tasks/${draggedId}`;
      payload = { moduleId: targetId };
    } else {
      throw new Error('Invalid move operation');
    }
    
    const response = await fetch(endpoint, {
      method: draggedType === 'module' ? 'PATCH' : 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to move item');
    }
    
    return result;
  } catch (error) {
    console.error('Move error:', error);
    throw error;
  }
}

// Tree Data Manipulation
function addNodeToTree(newNode, parentId) {
  const addRecursive = (nodes) => {
    for (const node of nodes) {
      if (node.id === parentId) {
        if (!node.children) node.children = [];
        node.children.push(newNode);
        return true;
      }
      if (node.children && addRecursive(node.children)) {
        return true;
      }
    }
    return false;
  };
  
  if (parentId) {
    addRecursive(projectTreeView.options.data);
  } else {
    projectTreeView.options.data.push(newNode);
  }
}

function updateNodeInTree(nodeId, updates) {
  const updateRecursive = (nodes) => {
    for (const node of nodes) {
      if (node.id === nodeId) {
        Object.assign(node, updates);
        return true;
      }
      if (node.children && updateRecursive(node.children)) {
        return true;
      }
    }
    return false;
  };
  
  updateRecursive(projectTreeView.options.data);
}

function removeNodeFromTree(nodeId) {
  const removeRecursive = (nodes) => {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].id === nodeId) {
        nodes.splice(i, 1);
        return true;
      }
      if (nodes[i].children && removeRecursive(nodes[i].children)) {
        return true;
      }
    }
    return false;
  };
  
  removeRecursive(projectTreeView.options.data);
}

function moveNodeInTree(draggedId, targetId) {
  let draggedNode = null;
  
  // Find and remove dragged node
  const findAndRemove = (nodes) => {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].id === draggedId) {
        draggedNode = nodes.splice(i, 1)[0];
        return true;
      }
      if (nodes[i].children && findAndRemove(nodes[i].children)) {
        return true;
      }
    }
    return false;
  };
  
  findAndRemove(projectTreeView.options.data);
  
  // Add to target
  if (draggedNode) {
    addNodeToTree(draggedNode, targetId);
  }
}

// Utility Functions
function parseNodeId(nodeId) {
  const parts = nodeId.split('-');
  return {
    type: parts[0],
    realId: parseInt(parts.slice(1).join('-'))
  };
}

function getChildType(parentType) {
  const typeMap = {
    group: 'project',
    project: 'module',
    module: 'task'
  };
  return typeMap[parentType] || 'task';
}

function isValidMove(draggedType, targetType) {
  const validMoves = {
    project: ['group'],
    module: ['project'],
    task: ['module']
  };
  return validMoves[draggedType]?.includes(targetType);
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function populateAssignees() {
  const select = document.getElementById('node-assignees');
  select.innerHTML = '';
  
  if (app.state.teamMembers && app.state.teamMembers.length > 0) {
    app.state.teamMembers.forEach(member => {
      const option = document.createElement('option');
      option.value = member.id;
      option.textContent = `${member.firstName} ${member.lastName}`;
      select.appendChild(option);
    });
  }
}

function showNotification(title, message, type = 'info') {
  console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
  
  // Create toast notification
  const toast = document.createElement('div');
  toast.className = `fixed bottom-4 right-4 z-50 max-w-sm p-4 rounded-lg shadow-lg border transition-all transform translate-y-0 ${
    type === 'success' ? 'bg-green-600 border-green-500 text-white' :
    type === 'error' ? 'bg-red-600 border-red-500 text-white' :
    type === 'warning' ? 'bg-yellow-600 border-yellow-500 text-white' :
    'bg-blue-600 border-blue-500 text-white'
  }`;
  
  toast.innerHTML = `
    <div class="flex items-start gap-3">
      <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        ${type === 'success' ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>' :
          type === 'error' ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>' :
          type === 'warning' ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>' :
          '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>'}
      </svg>
      <div class="flex-1">
        <p class="font-semibold">${title}</p>
        <p class="text-sm opacity-90">${message}</p>
      </div>
      <button onclick="this.parentElement.parentElement.remove()" class="text-white hover:opacity-70">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  `;
  
  document.body.appendChild(toast);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    toast.style.transform = 'translateY(100px)';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

// Modal Management
function openTreeNodeModal(parentNode = null, nodeType = 'group') {
  handleNodeCreate(parentNode);
}

function closeTreeNodeModal() {
  document.getElementById('tree-node-modal').classList.add('hidden');
  currentEditingNode = null;
}

function closeDeleteConfirmModal() {
  document.getElementById('delete-confirm-modal').classList.add('hidden');
  deleteCallback = null;
}

function confirmDelete() {
  if (deleteCallback) {
    deleteCallback();
  }
  closeDeleteConfirmModal();
}

// Tree Controls
function expandAllProjects() {
  if (projectTreeView) {
    projectTreeView.expandAll();
  }
}

function collapseAllProjects() {
  if (projectTreeView) {
    projectTreeView.collapseAll();
  }
}

// Export functions
window.initProjectsTreeView = initProjectsTreeView;
window.openTreeNodeModal = openTreeNodeModal;
window.closeTreeNodeModal = closeTreeNodeModal;
window.saveTreeNode = saveTreeNode;
window.closeDeleteConfirmModal = closeDeleteConfirmModal;
window.confirmDelete = confirmDelete;
window.expandAllProjects = expandAllProjects;
window.collapseAllProjects = collapseAllProjects;
window.closeDetailPanel = closeDetailPanel;
