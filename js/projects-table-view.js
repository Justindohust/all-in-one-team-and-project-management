/**
 * Projects Table View - Hierarchical table display with 4 levels
 * Supports: Project > Module > Submodule > Task hierarchy
 */

let currentProjectView = 'table';
let currentDetailTab = 'overview';
let selectedItem = null;
let expandedRows = new Set();
let allProjectsData = [];

// Initialize table view
function initProjectsTableView() {
  loadProjectsData();
}

// Load all projects data from API
async function loadProjectsData() {
  try {
    const result = await api.getProjectGroups();
    if (result.success) {
      allProjectsData = flattenProjectsHierarchy(result.data);
      renderTableView();
    }
  } catch (error) {
    console.error('Failed to load projects:', error);
    showTableError('Failed to load projects');
  }
}

// Flatten nested hierarchy into flat list with levels
// IMPORTANT: Parent is pushed BEFORE children so rendering order is correct
function flattenProjectsHierarchy(projectGroups) {
  const flatList = [];
  let idCounter = 1;
  
  projectGroups.forEach(group => {
    if (group.projects) {
      group.projects.forEach(project => {
        // Add project FIRST
        const projectItem = {
          displayId: idCounter++,
          realId: project.id,
          parentId: null,
          level: 0,
          type: 'PROJECT',
          name: project.name,
          status: project.status || 'active',
          assignee: null,
          priority: 'Bình thường',
          startDate: project.startDate ? formatDate(project.startDate) : null,
          finishDate: project.endDate ? formatDate(project.endDate) : null,
          hasChildren: project.modules && project.modules.length > 0,
          children: []
        };
        flatList.push(projectItem); // Parent first!
        
        // Then add modules
        if (project.modules) {
          project.modules.forEach(module => {
            const moduleItem = {
              displayId: idCounter++,
              realId: module.id,
              parentId: projectItem.displayId,
              level: 1,
              type: 'MODULE',
              name: module.name,
              status: module.status || 'active',
              assignee: null,
              priority: module.priority ? capitalize(module.priority) : 'Bình thường',
              startDate: module.start_date ? formatDate(module.start_date) : null,
              finishDate: module.due_date ? formatDate(module.due_date) : null,
              hasChildren: (module.submodules && module.submodules.length > 0) || (module.tasks && module.tasks.length > 0),
              children: []
            };
            projectItem.children.push(moduleItem);
            flatList.push(moduleItem); // Module before its children
            
            // Add submodules (if exists)
            if (module.submodules) {
              module.submodules.forEach(submodule => {
                const submoduleItem = {
                  displayId: idCounter++,
                  realId: submodule.id,
                  parentId: moduleItem.displayId,
                  level: 2,
                  type: 'SUBMODULE',
                  name: submodule.name,
                  status: submodule.status || 'active',
                  assignee: null,
                  priority: submodule.priority ? capitalize(submodule.priority) : 'Bình thường',
                  startDate: submodule.start_date ? formatDate(submodule.start_date) : null,
                  finishDate: submodule.due_date ? formatDate(submodule.due_date) : null,
                  hasChildren: submodule.tasks && submodule.tasks.length > 0,
                  children: []
                };
                moduleItem.children.push(submoduleItem);
                flatList.push(submoduleItem); // Submodule before its tasks
                
                // Add tasks to submodule
                if (submodule.tasks) {
                  submodule.tasks.forEach(task => {
                    const taskItem = createTaskItem(task, submoduleItem.displayId, 3, idCounter++);
                    submoduleItem.children.push(taskItem);
                    flatList.push(taskItem);
                  });
                }
              });
            }
            
            // Add tasks directly to module if no submodules
            if (module.tasks && (!module.submodules || module.submodules.length === 0)) {
              module.tasks.forEach(task => {
                const taskItem = createTaskItem(task, moduleItem.displayId, 2, idCounter++);
                moduleItem.children.push(taskItem);
                flatList.push(taskItem);
              });
            }
          });
        }
      });
    }
  });
  
  return flatList; // Already in correct order: parent before children
}

function createTaskItem(task, parentId, level, id) {
  return {
    displayId: id,
    realId: task.id,
    parentId: parentId,
    level: level,
    type: 'TASK',
    name: task.title || task.name,
    status: task.status || 'todo',
    assignee: task.assignee_name || task.assignee,
    priority: task.priority ? capitalize(task.priority) : 'Bình thường',
    startDate: task.startDate || task.created_at ? formatDate(task.startDate || task.created_at) : null,
    finishDate: task.dueDate || task.due_date ? formatDate(task.dueDate || task.due_date) : null,
    hasChildren: false,
    children: []
  };
}

// Check if an item is visible (all ancestors must be expanded)
function isItemVisible(item) {
  if (item.level === 0) return true;
  // Find parent
  const parent = allProjectsData.find(i => i.displayId === item.parentId);
  if (!parent) return false;
  // Parent must be expanded AND parent itself must be visible
  return expandedRows.has(parent.displayId) && isItemVisible(parent);
}

// Render table view
function renderTableView() {
  const tbody = document.getElementById('projects-table-body');
  if (!tbody) return;
  
  if (allProjectsData.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="8" style="text-align:center;padding:80px 16px;color:#94a3b8">
        <svg style="width:64px;height:64px;margin:0 auto 16px;opacity:0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
        </svg>
        <p style="font-size:16px;font-weight:500;margin-bottom:8px">No projects yet</p>
        <p style="font-size:14px;margin-bottom:16px">Create your first project to get started</p>
        <button onclick="openTreeNodeModal(null, 'project')" style="padding:8px 16px;background:#3b82f6;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer">
          Create Project
        </button>
      </td></tr>
    `;
    return;
  }
  
  tbody.innerHTML = '';
  
  allProjectsData.forEach(item => {
    if (isItemVisible(item)) {
      tbody.appendChild(createTableRow(item));
    }
  });
}

// Create table row using <tr>/<td>
function createTableRow(item) {
  const row = document.createElement('tr');
  const isSelected = selectedItem?.displayId === item.displayId;
  row.style.cssText = `border-bottom:1px solid rgba(51,65,85,0.5);cursor:pointer;transition:background 0.15s;position:relative;${isSelected ? 'background:rgba(59,130,246,0.1)' : ''}`;
  row.dataset.id = item.displayId;
  row.dataset.type = item.type;

  // Add hover button for adding children (only for PROJECT, MODULE, SUBMODULE)
  const canAddChild = ['PROJECT', 'MODULE', 'SUBMODULE'].includes(item.type);

  row.onmouseenter = () => {
    if (!isSelected) row.style.background = 'rgba(51,65,85,0.3)';
    if (canAddChild) {
      const addBtn = row.querySelector('.add-child-btn');
      if (addBtn) addBtn.style.display = 'flex';
    }
  };
  row.onmouseleave = () => {
    if (!isSelected) row.style.background = '';
    if (canAddChild) {
      const addBtn = row.querySelector('.add-child-btn');
      if (addBtn) addBtn.style.display = 'none';
    }
  };

  // Click to show detail panel
  row.onclick = (e) => {
    if (e.target.closest('.item-name-editable')) return;
    if (e.target.closest('.add-child-btn')) return;
    selectTableItem(item);
  };

  // Double click to expand/collapse
  if (item.hasChildren) {
    row.ondblclick = (e) => {
      if (e.target.closest('.item-name-editable')) return;
      e.stopPropagation();
      toggleRowExpand(item.displayId);
    };
  }

  const cellStyle = 'padding:10px 8px;font-size:13px;vertical-align:middle;white-space:nowrap;';

  // 1. ID Column
  const tdId = document.createElement('td');
  tdId.style.cssText = cellStyle + 'padding-left:16px;color:#cbd5e1;font-family:monospace;position:relative;';
  tdId.textContent = item.displayId;

  // Add child button (hidden by default)
  if (canAddChild) {
    const addChildBtn = document.createElement('button');
    addChildBtn.className = 'add-child-btn';
    addChildBtn.style.cssText = 'display:none;position:absolute;left:0;top:50%;transform:translateY(-50%);width:20px;height:20px;background:#3b82f6;border-radius:4px;align-items:center;justify-content:center;color:#fff;font-size:14px;font-weight:bold;border:none;cursor:pointer;z-index:5;';
    addChildBtn.innerHTML = '+';
    addChildBtn.title = `Add ${getChildType(item.type)}`;
    addChildBtn.onclick = (e) => {
      e.stopPropagation();
      handleAddChild(item);
    };
    tdId.appendChild(addChildBtn);
  }

  row.appendChild(tdId);
  
  // 2. Subject Column (with hierarchy indent + expand arrow + name)
  const tdSubject = document.createElement('td');
  tdSubject.style.cssText = cellStyle + 'white-space:normal;';
  
  const subjectWrap = document.createElement('div');
  subjectWrap.style.cssText = 'display:flex;align-items:center;gap:4px;';
  
  // Indent spacer
  if (item.level > 0) {
    const spacer = document.createElement('span');
    spacer.style.cssText = `display:inline-block;width:${item.level * 20}px;flex-shrink:0;`;
    subjectWrap.appendChild(spacer);
  }
  
  // Expand/collapse arrow or dot
  const arrowBtn = document.createElement('span');
  arrowBtn.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;flex-shrink:0;color:#94a3b8;';
  if (item.hasChildren) {
    const isExp = expandedRows.has(item.displayId);
    arrowBtn.innerHTML = isExp
      ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 9l-7 7-7-7"/></svg>'
      : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg>';
    arrowBtn.style.cursor = 'pointer';
    arrowBtn.onclick = (e) => { e.stopPropagation(); toggleRowExpand(item.displayId); };
  }
  subjectWrap.appendChild(arrowBtn);
  
  // Name text
  const nameEl = document.createElement('span');
  nameEl.style.cssText = 'color:#e2e8f0;overflow:hidden;text-overflow:ellipsis;';
  nameEl.textContent = item.name;
  nameEl.ondblclick = (e) => { e.stopPropagation(); makeNameEditable(nameEl, item); };
  subjectWrap.appendChild(nameEl);
  
  tdSubject.appendChild(subjectWrap);
  row.appendChild(tdSubject);
  
  // 3. Type Column
  const tdType = document.createElement('td');
  tdType.style.cssText = cellStyle;
  const typeColorMap = { 'PROJECT':'#60a5fa','MODULE':'#a78bfa','SUBMODULE':'#818cf8','TASK':'#34d399' };
  tdType.innerHTML = `<span style="color:${typeColorMap[item.type]||'#94a3b8'};font-size:12px;font-weight:500">${item.type}</span>`;
  row.appendChild(tdType);
  
  // 4. Status Column
  const tdStatus = document.createElement('td');
  tdStatus.style.cssText = cellStyle;
  const statusColors = { 'active':'#22d3ee','pending':'#facc15','in_progress':'#3b82f6','completed':'#22c55e','done':'#22c55e','todo':'#22d3ee','Mới':'#22d3ee','mới':'#22d3ee' };
  const sc = statusColors[item.status] || '#94a3b8';
  tdStatus.innerHTML = `<span style="display:inline-flex;align-items:center;gap:6px;padding:3px 10px;border-radius:6px;font-size:12px;font-weight:500;background:${sc}22;color:${sc}"><span style="width:6px;height:6px;border-radius:50%;background:${sc}"></span>${translateStatus(item.status)}</span>`;
  row.appendChild(tdStatus);
  
  // 5. Assignee Column (clickable)
  const tdAssignee = document.createElement('td');
  tdAssignee.style.cssText = cellStyle + 'color:#cbd5e1;cursor:pointer;';
  if (item.assignee) {
    tdAssignee.innerHTML = `<div class="assignee-cell" style="display:flex;align-items:center;gap:6px"><div style="width:22px;height:22px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:10px;color:#fff;font-weight:600;flex-shrink:0">${item.assignee.charAt(0).toUpperCase()}</div><span style="overflow:hidden;text-overflow:ellipsis;font-size:12px">${item.assignee}</span></div>`;
  } else {
    tdAssignee.innerHTML = '<span class="assignee-cell" style="color:#3b82f6">+ Assign</span>';
  }
  tdAssignee.onclick = (e) => {
    e.stopPropagation();
    const target = e.target.closest('.assignee-cell') || e.target;
    showAssigneeDropdown(target, item);
  };
  row.appendChild(tdAssignee);

  // 6. Priority Column (clickable)
  const tdPriority = document.createElement('td');
  tdPriority.style.cssText = cellStyle + 'cursor:pointer;';
  const prioColorMap = { 'low':'#64748b','medium':'#3b82f6','normal':'#3b82f6','bình thường':'#3b82f6','high':'#f97316','urgent':'#ef4444' };
  const prioKey = item.priority ? item.priority.toLowerCase() : 'normal';
  const pc = prioColorMap[prioKey] || '#3b82f6';
  tdPriority.innerHTML = `<span class="priority-cell" style="display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:6px;font-size:12px;font-weight:500;background:${pc}22;color:${pc}">${getPriorityIcon(item.priority)} ${item.priority}</span>`;
  tdPriority.onclick = (e) => {
    e.stopPropagation();
    const target = e.target.closest('.priority-cell') || e.target;
    showPriorityDropdown(target, item);
  };
  row.appendChild(tdPriority);

  // 7. Start Date Column (clickable)
  const tdStart = document.createElement('td');
  tdStart.style.cssText = cellStyle + 'color:#94a3b8;font-size:12px;cursor:pointer;';
  tdStart.innerHTML = `<span class="date-cell" data-field="startDate">${item.startDate || '+ Set date'}</span>`;
  tdStart.onclick = (e) => {
    e.stopPropagation();
    const target = e.target.closest('.date-cell') || e.target;
    target.dataset.field = 'startDate';
    showDatePicker(target, item);
  };
  row.appendChild(tdStart);

  // 8. Finish Date Column (removed - info moved to detail panel)
  
  return row;
}

// Toggle row expansion
function toggleRowExpand(itemId) {
  if (expandedRows.has(itemId)) {
    expandedRows.delete(itemId);
    // Also collapse all children recursively
    collapseChildren(itemId);
  } else {
    expandedRows.add(itemId);
  }
  renderTableView();
}

function collapseChildren(parentId) {
  allProjectsData.forEach(item => {
    if (item.parentId === parentId) {
      expandedRows.delete(item.displayId);
      collapseChildren(item.displayId);
    }
  });
}

// Select table item and show detail panel
function selectTableItem(item) {
  selectedItem = item;
  renderTableView();
  showDetailPanel(item);
}

// Show detail panel with tabs
function showDetailPanel(item) {
  const panel = document.getElementById('project-detail-panel');
  if (!panel) return;
  
  panel.classList.remove('hidden');
  
  // Render current tab content
  renderDetailTabContent(item);
}

function closeDetailPanel() {
  const panel = document.getElementById('project-detail-panel');
  if (panel) {
    panel.classList.add('hidden');
  }
  selectedItem = null;
  if (currentProjectView === 'table') {
    renderTableView();
  }
}

// Switch detail tab
function switchDetailTab(tabName) {
  currentDetailTab = tabName;
  
  // Update tab buttons with new style
  document.querySelectorAll('.detail-tab').forEach(btn => {
    if (btn.dataset.tab === tabName) {
      btn.classList.add('active', 'text-white', 'bg-primary-500');
      btn.classList.remove('text-slate-400', 'bg-slate-700/50', 'hover:bg-slate-700/50');
    } else {
      btn.classList.remove('active', 'text-white', 'bg-primary-500');
      btn.classList.add('text-slate-400', 'hover:bg-slate-700/50');
    }
  });
  
  // Render tab content
  if (selectedItem) {
    renderDetailTabContent(selectedItem);
  }
}

// Render detail tab content
function renderDetailTabContent(item) {
  const content = document.getElementById('detail-content');
  if (!content) return;
  
  switch (currentDetailTab) {
    case 'overview':
      renderOverviewTab(content, item);
      break;
    case 'activity':
      renderActivityTab(content, item);
      break;
    case 'files':
      renderFilesTab(content, item);
      break;
    case 'relations':
      renderRelationsTab(content, item);
      break;
    case 'watch':
      renderWatchTab(content, item);
      break;
  }
}

// Render Overview Tab
function renderOverviewTab(content, item) {
  const typeIcons = {
    'PROJECT': 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    'MODULE': 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
    'SUBMODULE': 'M4 6h16M4 10h16M4 14h16M4 18h16',
    'TASK': 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
  };
  
  const typeColors = {
    'PROJECT': 'text-blue-400',
    'MODULE': 'text-purple-400',
    'SUBMODULE': 'text-indigo-400',
    'TASK': 'text-green-400'
  };
  
  content.innerHTML = `
    <!-- Item Header -->
    <div class="mb-6 p-4 bg-gradient-to-br from-slate-700/30 to-slate-800/30 rounded-xl border border-slate-600/50">
      <div class="flex items-start gap-4 mb-4">
        <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-600/50 to-slate-700/50 flex items-center justify-center flex-shrink-0 shadow-lg">
          <svg class="w-8 h-8 ${typeColors[item.type]}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${typeIcons[item.type]}"/>
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-xs uppercase font-bold tracking-wide ${typeColors[item.type]}">${item.type}</span>
            <span class="text-xs text-slate-500 font-mono">#${item.displayId}</span>
          </div>
          <h4 class="text-white font-bold text-xl leading-tight mb-2">${item.name}</h4>
          <span class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${getStatusBadgeClass(item.status)}">
            <span class="w-2 h-2 rounded-full ${getStatusDotClass(item.status)} animate-pulse"></span>
            ${translateStatus(item.status)}
          </span>
        </div>
      </div>
    </div>
    
    <!-- People Section -->
    <div class="mb-6">
      <h5 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
        </svg>
        People
      </h5>
      <div class="space-y-3 bg-slate-700/20 rounded-xl p-4">
        <div class="flex items-center justify-between">
          <span class="text-sm text-slate-400">Assignee</span>
          <div data-field="assignee">
            ${item.assignee ? `
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-xs text-white font-bold shadow-lg">
                  ${item.assignee.charAt(0).toUpperCase()}
                </div>
                <span class="text-sm text-white font-medium">${item.assignee}</span>
              </div>
            ` : `
              <button class="text-sm text-primary-400 hover:text-primary-300 font-medium">+ Assign</button>
            `}
          </div>
        </div>
      </div>
    </div>
    
    <!-- Details -->
    <div class="mb-6">
      <h5 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        Details
      </h5>
      <div class="space-y-3 bg-slate-700/20 rounded-xl p-4">
        <div class="flex items-center justify-between py-2 border-b border-slate-600/30">
          <span class="text-sm text-slate-400">Priority</span>
          <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${getPriorityBadgeClass(item.priority)}">
            ${getPriorityIcon(item.priority)}
            ${item.priority}
          </span>
        </div>
        <div class="flex items-center justify-between py-2 border-b border-slate-600/30">
          <span class="text-sm text-slate-400">Start Date</span>
          <span class="text-sm text-white font-medium">${item.startDate || '<span class="text-slate-500">Not set</span>'}</span>
        </div>
        <div class="flex items-center justify-between py-2 border-b border-slate-600/30">
          <span class="text-sm text-slate-400">Due Date</span>
          <span class="text-sm ${item.finishDate ? 'text-orange-400 font-medium' : 'text-slate-500'}">${item.finishDate || 'Not set'}</span>
        </div>
        <div class="flex items-center justify-between py-2 border-b border-slate-600/30">
          <span class="text-sm text-slate-400">Created</span>
          <span class="text-sm text-slate-300">${item.created_at ? formatDateTime(item.created_at) : 'N/A'}</span>
        </div>
        <div class="flex items-center justify-between py-2">
          <span class="text-sm text-slate-400">Last Updated</span>
          <span class="text-sm text-slate-300">${item.updated_at ? formatDateTime(item.updated_at) : 'N/A'}</span>
        </div>
      </div>
    </div>
    
    <!-- Action Buttons -->
    <div class="flex gap-2 pt-4">
      <button onclick="editDetailItem()" class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-lg shadow-primary-500/20">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
        </svg>
        Edit
      </button>
      <button onclick="duplicateDetailItem()" class="px-3 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-all duration-200">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
        </svg>
      </button>
      <button onclick="deleteDetailItem()" class="px-3 py-2.5 bg-danger/20 hover:bg-danger/30 text-danger text-sm font-medium rounded-lg transition-all duration-200">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
      </button>
    </div>
  `;
}

// Render Activity Tab
async function renderActivityTab(content, item) {
  try {
    console.log('[Activity Tab] Starting render for', item.type, item.realId);
    
    // Load activity tab template
    const response = await fetch('views/activity-tab.html');
    const template = await response.text();
    content.innerHTML = template;
    
    console.log('[Activity Tab] Template loaded, DOM updated');
    
    // Map item type to entity type for API
    const entityTypeMap = {
      'PROJECT': 'project',
      'MODULE': 'module',
      'SUBMODULE': 'submodule',
      'TASK': 'task'
    };
    
    const entityType = entityTypeMap[item.type];
    
    // Validate entity ID
    if (!item.realId) {
      throw new Error('Invalid item: missing realId');
    }
    
    // Wait for DOM to be ready, then initialize
    await new Promise(resolve => setTimeout(resolve, 10));
    
    console.log('[Activity Tab] Initializing UI...');
    initializeActivityTabUI();
    
    // Initialize activity manager
    if (typeof activityManager !== 'undefined' && entityType) {
      console.log('[Activity Tab] Initializing activityManager for', entityType, item.realId);
      await activityManager.init(entityType, item.realId);
    } else {
      console.warn('[Activity Tab] activityManager not available or invalid entity type');
    }
    
    console.log('[Activity Tab] Render complete');
  } catch (error) {
    console.error('Error rendering activity tab:', error);
    content.innerHTML = `
      <div class="text-center py-8 text-slate-400">
        <p class="text-sm">Failed to load activities</p>
        <p class="text-xs mt-2">${error.message}</p>
      </div>
    `;
  }
}

// Initialize activity tab UI elements
function initializeActivityTabUI() {
  console.log('[Activity Tab UI] Starting initialization...');
  
  // Set current user initials
  const currentUser = api.currentUser;
  if (currentUser) {
    const initials = (currentUser.first_name?.[0] || '') + (currentUser.last_name?.[0] || '');
    const initialsEl = document.getElementById('current-user-initials');
    if (initialsEl) {
      initialsEl.textContent = initials.toUpperCase() || '?';
      console.log('[Activity Tab UI] Set user initials:', initials);
    }
  }
  
  // Setup comment submit button
  const submitBtn = document.getElementById('comment-submit-btn');
  const cancelBtn = document.getElementById('comment-cancel-btn');
  const commentInput = document.getElementById('comment-input');
  
  console.log('[Activity Tab UI] Found elements:', {
    submitBtn: !!submitBtn,
    cancelBtn: !!cancelBtn,
    commentInput: !!commentInput
  });
  
  if (submitBtn && commentInput) {
    // Remove existing listeners if any
    const newSubmitBtn = submitBtn.cloneNode(true);
    submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);
    
    console.log('[Activity Tab UI] Setting up submit button listener');
    
    newSubmitBtn.addEventListener('click', async () => {
      console.log('[Comment Submit] Button clicked');
      const content = commentInput.value.trim();
      
      if (!content) {
        alert('Please enter a comment');
        console.warn('[Comment Submit] Empty content');
        return;
      }
      
      // Disable button during submission
      newSubmitBtn.disabled = true;
      newSubmitBtn.textContent = 'Posting...';
      
      try {
        console.log('[Comment Submit] Submitting:', content);
        
        if (typeof activityManager === 'undefined') {
          throw new Error('ActivityManager not available');
        }
        
        await activityManager.submitComment(content);
        commentInput.value = '';
        console.log('[Comment Submit] Success!');
        
      } catch (error) {
        console.error('[Comment Submit] Error:', error);
        alert('Failed to post comment: ' + error.message);
      } finally {
        newSubmitBtn.disabled = false;
        newSubmitBtn.textContent = 'Comment';
      }
    });
    
    // Enter key to submit (Ctrl+Enter or Cmd+Enter)
    commentInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        console.log('[Comment Submit] Ctrl+Enter detected');
        newSubmitBtn.click();
      }
    });
    
    console.log('[Activity Tab UI] Submit button ready');
  } else {
    console.error('[Activity Tab UI] Missing required elements!');
  }
  
  if (cancelBtn && commentInput) {
    const newCancelBtn = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
    
    newCancelBtn.addEventListener('click', () => {
      console.log('[Comment Cancel] Button clicked');
      commentInput.value = '';
      commentInput.blur();
    });
    
    console.log('[Activity Tab UI] Cancel button ready');
  }
  
  console.log('[Activity Tab UI] Initialization complete');
}

// Helper function to show notifications (reuse if exists)
function showNotification(message, type = 'info') {
  // Simple console log for now - can be enhanced with toast notifications
  if (type === 'error') {
    console.error(message);
  } else if (type === 'warning') {
    console.warn(message);
  } else {
    console.log(message);
  }
}

// Render Files Tab
function renderFilesTab(content, item) {
  content.innerHTML = `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h5 class="text-sm font-semibold text-white">ATTACHMENTS</h5>
        <button class="flex items-center gap-2 px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm rounded transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Upload
        </button>
      </div>
      
      <!-- Drag and Drop Area -->
      <div class="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-primary-500 transition-colors cursor-pointer">
        <svg class="w-12 h-12 mx-auto mb-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
        </svg>
        <p class="text-sm text-slate-300 mb-1">Drag and drop files here</p>
        <p class="text-xs text-slate-400">or click to browse</p>
      </div>
      
      <!-- File List -->
      <div class="space-y-2">
        <p class="text-sm text-slate-400">No files attached yet</p>
      </div>
    </div>
  `;
}

// Render Relations Tab
function renderRelationsTab(content, item) {
  // Find related items (parent and children)
  const parent = item.parentId ? allProjectsData.find(i => i.displayId === item.parentId) : null;
  const children = allProjectsData.filter(i => i.parentId === item.displayId);
  
  content.innerHTML = `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h5 class="text-sm font-semibold text-white">RELATIONSHIPS</h5>
        <button class="flex items-center gap-2 px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm rounded transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Add
        </button>
      </div>
      
      ${parent ? `
        <div class="space-y-2">
          <p class="text-xs text-slate-400 uppercase font-semibold">Parent</p>
          <div class="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer">
            <div class="w-8 h-8 rounded bg-slate-600 flex items-center justify-center">
              <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-white font-medium truncate">${parent.name}</p>
              <p class="text-xs text-slate-400">${parent.type} #${parent.displayId}</p>
            </div>
          </div>
        </div>
      ` : ''}
      
      ${children.length > 0 ? `
        <div class="space-y-2">
          <p class="text-xs text-slate-400 uppercase font-semibold">Children (${children.length})</p>
          <div class="space-y-2">
            ${children.map(child => `
              <div class="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer">
                <div class="w-8 h-8 rounded bg-slate-600 flex items-center justify-center">
                  <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-white font-medium truncate">${child.name}</p>
                  <p class="text-xs text-slate-400">${child.type} #${child.displayId}</p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      
      ${!parent && children.length === 0 ? `
        <div class="text-center py-8 text-slate-400">
          <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
          <p class="text-sm">No relationships yet</p>
        </div>
      ` : ''}
    </div>
  `;
}

// Render Watch Tab
function renderWatchTab(content, item) {
  content.innerHTML = `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h5 class="text-sm font-semibold text-white">WATCHERS</h5>
        <button class="flex items-center gap-2 px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm rounded transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Add Watcher
        </button>
      </div>
      
      <div class="bg-slate-700/30 rounded-lg p-4">
        <label class="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" class="w-4 h-4 rounded border-slate-600 bg-slate-700 text-primary-500 focus:ring-2 focus:ring-primary-500">
          <div class="flex items-center gap-3 flex-1">
            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-xs text-white font-medium">
              ME
            </div>
            <div class="flex-1">
              <p class="text-sm text-white font-medium">Watch this item</p>
              <p class="text-xs text-slate-400">Get notifications about updates</p>
            </div>
          </div>
        </label>
      </div>
      
      <div class="space-y-2">
        <p class="text-xs text-slate-400 uppercase font-semibold">Current Watchers</p>
        <div class="text-center py-8 text-slate-400">
          <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
          </svg>
          <p class="text-sm">No watchers yet</p>
        </div>
      </div>
    </div>
  `;
}

// Detail item actions
function editDetailItem() {
  if (!selectedItem) return;

  // Enable edit mode for detail panel
  const detailPanel = document.getElementById('detail-panel-content');
  if (!detailPanel) return;

  // Toggle edit mode
  const isEditing = detailPanel.classList.contains('edit-mode');

  if (!isEditing) {
    // Enter edit mode
    detailPanel.classList.add('edit-mode');
    makeFieldsEditable();

    // Change button to "Save"
    const editBtn = document.querySelector('[onclick="editDetailItem()"]');
    if (editBtn) {
      editBtn.innerHTML = '<i class="fas fa-save mr-2"></i>Save';
      editBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
      editBtn.classList.add('bg-green-600', 'hover:bg-green-700');
    }
  }else {
    // Save changes
    saveDetailChanges();
  }
}

function makeFieldsEditable() {
  const detailPanel = document.getElementById('detail-panel-content');
  if (!detailPanel) return;

  // Make assignee editable
  const assigneeDiv = detailPanel.querySelector('[data-field="assignee"]');
  if (assigneeDiv) {
    const currentValue = assigneeDiv.textContent.trim();
    assigneeDiv.innerHTML = `
      <select class="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-blue-500 focus:outline-none">
        <option value="">Not assigned</option>
        <option value="user1" ${currentValue === 'John Doe' ? 'selected' : ''}>John Doe</option>
        <option value="user2" ${currentValue === 'Alice Smith' ? 'selected' : ''}>Alice Smith</option>
        <option value="user3" ${currentValue === 'Mike Kim' ? 'selected' : ''}>Mike Kim</option>
        <option value="user4" ${currentValue === 'Tina Nguyen' ? 'selected' : ''}>Tina Nguyen</option>
      </select>
    `;
  }

  // Make priority editable
  const priorityDiv = detailPanel.querySelector('[data-field="priority"]');
  if (priorityDiv) {
    const currentValue = selectedItem.priority || 'Bình thường';
    priorityDiv.innerHTML = `
      <select class="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-blue-500 focus:outline-none">
        <option value="urgent" ${currentValue === 'Urgent' ? 'selected' : ''}>🔴 Urgent</option>
        <option value="high" ${currentValue === 'High' ? 'selected' : ''}>🟠 High</option>
        <option value="medium" ${currentValue === 'Medium' || currentValue === 'Bình thường' ? 'selected' : ''}>🟡 Medium</option>
        <option value="low" ${currentValue === 'Low' ? 'selected' : ''}>🟢 Low</option>
      </select>
    `;
  }

  // Make dates editable
  const startDateDiv = detailPanel.querySelector('[data-field="startDate"]');
  if (startDateDiv) {
    const currentValue = selectedItem.startDate || '';
    startDateDiv.innerHTML = `
      <input type="date" value="${currentValue}"
        class="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-blue-500 focus:outline-none">
    `;
  }

  const dueDateDiv = detailPanel.querySelector('[data-field="dueDate"]');
  if (dueDateDiv) {
    const currentValue = selectedItem.finishDate || '';
    dueDateDiv.innerHTML = `
      <input type="date" value="${currentValue}"
        class="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-blue-500 focus:outline-none">
    `;
  }
}

async function saveDetailChanges() {
  const detailPanel = document.getElementById('detail-panel-content');
  if (!detailPanel) return;

  try {
    // Get updated values
    const assigneeSelect = detailPanel.querySelector('[data-field="assignee"] select');
    const prioritySelect = detailPanel.querySelector('[data-field="priority"] select');
    const startDateInput = detailPanel.querySelector('[data-field="startDate"] input');
    const dueDateInput = detailPanel.querySelector('[data-field="dueDate"] input');

    const updates = {
      assignee: assigneeSelect ? assigneeSelect.value : null,
      priority: prioritySelect ? prioritySelect.value : null,
      start_date: startDateInput ? startDateInput.value : null,
      due_date: dueDateInput ? dueDateInput.value : null
    };

    // Call API to update
    const typeMap = {
      'PROJECT': 'projects',
      'MODULE': 'modules',
      'SUBMODULE': 'submodules',
      'TASK': 'tasks'
    };

    const endpoint = typeMap[selectedItem.type];
    const response = await api.request(`/${endpoint}/${selectedItem.realId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });

    if (response.success) {
      // Update local data
      Object.assign(selectedItem, {
        assignee: updates.assignee,
        priority: updates.priority,
        startDate: updates.start_date,
        finishDate: updates.due_date
      });

      // Exit edit mode
      detailPanel.classList.remove('edit-mode');

      // Restore button
      const editBtn = document.querySelector('[onclick="editDetailItem()"]');
      if (editBtn) {
        editBtn.innerHTML = '<i class="fas fa-edit mr-2"></i>Edit';
        editBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
        editBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
      }

      // Refresh detail panel
      renderDetailPanel(selectedItem);

      // Reload table to reflect changes
      await loadProjectsData();

      showNotification('Success', 'Changes saved successfully', 'success');
    }else {
      throw new Error(response.message || 'Failed to save changes');
    }
  }catch (error) {
    console.error('Error saving changes:', error);
    showNotification('Error', 'Failed to save changes: ' + error.message, 'error');
  }
}

function duplicateDetailItem() {
  if (selectedItem) {
    showNotification('Info', 'Duplicate functionality coming soon', 'info');
  }
}

async function deleteDetailItem() {
  if (!selectedItem) return;

  // Confirm deletion
  if (!confirm(`Are you sure you want to delete "${selectedItem.name}"?`)) {
    return;
  }

  try {
    const typeMap = {
      'PROJECT': 'projects',
      'MODULE': 'modules',
      'SUBMODULE': 'submodules',
      'TASK': 'tasks'
    };

    const endpoint = typeMap[selectedItem.type];
    const response = await api.request(`/${endpoint}/${selectedItem.realId}`, {
      method: 'DELETE'
    });

    if (response.success) {
      // Close detail panel
      closeDetailPanel();

      // Reload data
      await loadProjectsData();

      showNotification('Success', `${selectedItem.type} deleted successfully`, 'success');
    } else {
      throw new Error(response.message || 'Failed to delete');
    }
  } catch (error) {
    console.error('Error deleting item:', error);
    showNotification('Error', 'Failed to delete: ' + error.message, 'error');
  }
}

// View switching
function setProjectView(viewType) {
  currentProjectView = viewType;
  
  // Update buttons
  document.getElementById('view-table-btn').classList.toggle('bg-slate-700', viewType === 'table');
  document.getElementById('view-table-btn').classList.toggle('text-white', viewType === 'table');
  document.getElementById('view-table-btn').classList.toggle('text-slate-400', viewType !== 'table');
  
  document.getElementById('view-tree-btn').classList.toggle('bg-slate-700', viewType === 'tree');
  document.getElementById('view-tree-btn').classList.toggle('text-white', viewType === 'tree');
  document.getElementById('view-tree-btn').classList.toggle('text-slate-400', viewType !== 'tree');
  
  const tableContainer = document.getElementById('table-view-container');
  const treeContainer = document.getElementById('tree-view-container');
  
  // Show/hide containers
  if (viewType === 'table') {
    if (tableContainer) tableContainer.classList.remove('hidden');
    if (treeContainer) treeContainer.classList.add('hidden');
  } else if (viewType === 'tree') {
    if (tableContainer) tableContainer.classList.add('hidden');
    if (treeContainer) treeContainer.classList.remove('hidden');
    // Initialize tree view if not already done
    initTreeViewFromTableData();
  }
}

// Initialize tree view using already-loaded table data
function initTreeViewFromTableData() {
  const container = document.getElementById('projects-treeview-page');
  if (!container) return;
  
  // If tree view already initialized and has data, just return
  if (window._projectTreeViewInitialized && projectTreeView) return;
  
  // Use app.state.projectGroups if available
  if (app.state.projectGroups && app.state.projectGroups.length > 0) {
    const treeData = transformProjectGroupsToTree(app.state.projectGroups);
    
    projectTreeView = new AdvancedTreeView(container, {
      data: treeData,
      allowDrag: true,
      allowEdit: true,
      allowDelete: true,
      allowCreate: true,
      showContextMenu: true,
      onSelect: handleTreeNodeSelect,
      onCreate: handleNodeCreate,
      onUpdate: handleNodeUpdate,
      onDelete: handleNodeDelete,
      onMove: handleNodeMove
    });
    
    window._projectTreeViewInitialized = true;
  } else {
    // Data not loaded yet, fetch it
    loadTreeViewData();
  }
}

// Load tree view data from API
async function loadTreeViewData() {
  try {
    const result = await api.getProjectGroups();
    if (result.success) {
      app.state.projectGroups = result.data;
      window._projectTreeViewInitialized = false;
      initTreeViewFromTableData();
    }
  } catch (error) {
    console.error('Failed to load tree view data:', error);
  }
}

// Handle tree node select - show detail panel with same format as table view
function handleTreeNodeSelect(node) {
  const { type, realId } = parseNodeId(node.id);
  
  // Convert tree node to table-compatible item for detail panel
  const item = {
    displayId: realId,
    realId: realId,
    type: type.toUpperCase(),
    name: node.name,
    status: node.status || 'active',
    assignee: node.assignee || null,
    priority: node.priority || 'Bình thường',
    startDate: node.startDate || null,
    finishDate: node.dueDate || null,
    hasChildren: node.children && node.children.length > 0,
    children: node.children || []
  };
  
  selectedItem = item;
  showDetailPanel(item);
}

// Utility functions
function formatDate(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function translateStatus(status) {
  const statusMap = {
    'active': 'Mới',
    'pending': 'Đang chờ',
    'in_progress': 'Đang tiến hành',
    'completed': 'Hoàn thành',
    'done': 'Hoàn thành',
    'todo': 'Mới'
  };
  return statusMap[status] || status;
}

// Make item name editable inline
function makeNameEditable(nameSpan, item) {
  const currentName = nameSpan.textContent;
  
  // Create textarea
  const textarea = document.createElement('textarea');
  textarea.className = 'item-name-editable';
  textarea.style.cssText = 'background:#334155;color:#e2e8f0;font-size:13px;padding:4px 8px;border-radius:4px;border:1px solid #3b82f6;outline:none;resize:none;width:100%;min-width:150px;font-family:inherit;';
  textarea.value = currentName;
  textarea.rows = 1;
  
  // Auto-resize textarea
  const autoResize = () => {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  };
  
  textarea.addEventListener('input', autoResize);
  
  // Replace span with textarea
  nameSpan.replaceWith(textarea);
  textarea.focus();
  textarea.select();
  autoResize();
  
  // Save on blur or Enter
  const saveEdit = async () => {
    const newName = textarea.value.trim();
    if (newName && newName !== currentName) {
      item.name = newName;
      console.log(`Updated ${item.type} #${item.realId} name to: ${newName}`);
    }
    
    // Replace textarea back with span
    const newSpan = document.createElement('span');
    newSpan.style.cssText = 'color:#e2e8f0;overflow:hidden;text-overflow:ellipsis;';
    newSpan.textContent = item.name;
    newSpan.ondblclick = (e) => {
      e.stopPropagation();
      makeNameEditable(newSpan, item);
    };
    textarea.replaceWith(newSpan);
  };
  
  textarea.addEventListener('blur', saveEdit);
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      // Cancel edit
      const newSpan = document.createElement('span');
      newSpan.style.cssText = 'color:#e2e8f0;overflow:hidden;text-overflow:ellipsis;';
      newSpan.textContent = currentName;
      newSpan.ondblclick = (e) => {
        e.stopPropagation();
        makeNameEditable(newSpan, item);
      };
      textarea.replaceWith(newSpan);
    }
  });
}

// Get priority icon HTML
function getPriorityIcon(priority) {
  const priorityLower = priority ? priority.toLowerCase() : 'medium';
  const s = 'width="12" height="12"'; // icon size
  const icons = {
    'low': `<svg ${s} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>`,
    'medium': `<svg ${s} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14"/></svg>`,
    'normal': `<svg ${s} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14"/></svg>`,
    'bình thường': `<svg ${s} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14"/></svg>`,
    'high': `<svg ${s} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>`,
    'urgent': `<svg ${s} fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>`
  };
  return icons[priorityLower] || icons['medium'];
}

function getStatusBadgeClass(status) {
  const classMap = {
    'active': 'bg-cyan-500/20 text-cyan-400',
    'pending': 'bg-yellow-500/20 text-yellow-400',
    'in_progress': 'bg-blue-500/20 text-blue-400',
    'completed': 'bg-green-500/20 text-green-400',
    'done': 'bg-green-500/20 text-green-400',
    'todo': 'bg-cyan-500/20 text-cyan-400'
  };
  return classMap[status] || 'bg-slate-500/20 text-slate-400';
}

function getStatusDotClass(status) {
  const classMap = {
    'active': 'bg-cyan-400',
    'pending': 'bg-yellow-400',
    'in_progress': 'bg-blue-400',
    'completed': 'bg-green-400',
    'done': 'bg-green-400',
    'todo': 'bg-cyan-400'
  };
  return classMap[status] || 'bg-slate-400';
}

function getStatusBannerClass(status) {
  return 'bg-cyan-500/10';
}

function getStatusBorderClass(status) {
  return 'border-cyan-500/30';
}

function getPriorityBadgeClass(priority) {
  const priorityLower = priority ? priority.toLowerCase() : 'medium';
  const classMap = {
    'low': 'bg-slate-500/20 text-slate-300',
    'medium': 'bg-blue-500/20 text-blue-300',
    'normal': 'bg-blue-500/20 text-blue-300',
    'bình thường': 'bg-blue-500/20 text-blue-300',
    'high': 'bg-orange-500/20 text-orange-300',
    'urgent': 'bg-red-500/20 text-red-300'
  };
  return classMap[priorityLower] || 'bg-blue-500/20 text-blue-300';
}

function showTableError(message) {
  const tbody = document.getElementById('projects-table-body');
  if (tbody) {
    tbody.innerHTML = `
      <tr><td colspan="8" style="text-align:center;padding:80px 16px;color:#94a3b8">
        <svg style="width:64px;height:64px;margin:0 auto 16px;color:#f87171" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <p style="font-size:16px;font-weight:500;margin-bottom:8px">${message}</p>
        <button onclick="loadProjectsData()" style="margin-top:16px;padding:8px 16px;background:#3b82f6;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer">
          Retry
        </button>
      </td></tr>
    `;
  }
}

// Helper function to format date and time
function formatDateTime(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  // If less than 1 minute ago
  if (diffMins < 1) return 'Just now';
  // If less than 1 hour ago
  if (diffMins < 60) return `${diffMins}min${diffMins > 1 ? 's' : ''} ago`;
  // If less than 24 hours ago
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''}ago`;
  // If less than 7 days ago
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  // Otherwise show full date
  const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return date.toLocaleDateString('en-US', options);
}

// Helper function to get child type based on parent type
function getChildType(parentType) {
  const childMap = {
    'PROJECT': 'Module',
    'MODULE': 'Submodule',
    'SUBMODULE': 'Task'
  };
  return childMap[parentType] || 'Item';
}

// Handle adding a child item
function handleAddChild(parentItem) {
  const childType = getChildType(parentItem.type);
  console.log(`Adding ${childType} to ${parentItem.type}: ${parentItem.name}`);

  // Show notification
  if (window.showNotification) {
    window.showNotification(`Add ${childType}feature coming soon!`, 'info');
  } else {
    alert(`Add ${childType} to "${parentItem.name}"\n\nThis feature will open a modal to create a new ${childType}.`);
  }

  // TODO: Open modal to create child item
  // openTreeNodeModal(parentItem, childType.toLowerCase());
}

// Export functions
window.initProjectsTableView = initProjectsTableView;
window.setProjectView = setProjectView;
window.switchDetailTab = switchDetailTab;
window.closeDetailPanel = closeDetailPanel;
window.editDetailItem = editDetailItem;
window.duplicateDetailItem = duplicateDetailItem;
window.deleteDetailItem = deleteDetailItem;
window.initTreeViewFromTableData = initTreeViewFromTableData;
window.handleTreeNodeSelect = handleTreeNodeSelect;
window.loadProjectsData = loadProjectsData;
window.formatDateTime = formatDateTime;
window.handleAddChild = handleAddChild;
window.getChildType = getChildType;
