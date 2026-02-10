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
function flattenProjectsHierarchy(projectGroups) {
  const flatList = [];
  let idCounter = 1;
  
  projectGroups.forEach(group => {
    if (group.projects) {
      group.projects.forEach(project => {
        // Add project
        const projectItem = {
          displayId: idCounter++,
          realId: project.id,
          parentId: null,
          level: 0,
          type: 'PROJECT',
          name: project.name,
          status: project.status || 'Mới',
          assignee: null,
          priority: 'Bình thường',
          startDate: project.startDate ? formatDate(project.startDate) : null,
          finishDate: project.endDate ? formatDate(project.endDate) : null,
          hasChildren: project.modules && project.modules.length > 0,
          children: []
        };
        
        // Add modules
        if (project.modules) {
          project.modules.forEach(module => {
            const moduleItem = {
              displayId: idCounter++,
              realId: module.id,
              parentId: projectItem.displayId,
              level: 1,
              type: 'MODULE',
              name: module.name,
              status: module.status || 'Mới',
              assignee: null,
              priority: module.priority ? capitalize(module.priority) : 'Bình thường',
              startDate: module.start_date ? formatDate(module.start_date) : null,
              finishDate: module.due_date ? formatDate(module.due_date) : null,
              hasChildren: module.submodules && module.submodules.length > 0,
              children: []
            };
            
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
                  status: submodule.status || 'Mới',
                  assignee: null,
                  priority: submodule.priority ? capitalize(submodule.priority) : 'Bình thường',
                  startDate: submodule.start_date ? formatDate(submodule.start_date) : null,
                  finishDate: submodule.due_date ? formatDate(submodule.due_date) : null,
                  hasChildren: submodule.tasks && submodule.tasks.length > 0,
                  children: []
                };
                
                // Add tasks to submodule
                if (submodule.tasks) {
                  submodule.tasks.forEach(task => {
                    const taskItem = createTaskItem(task, submoduleItem.displayId, 3, idCounter++);
                    submoduleItem.children.push(taskItem);
                    flatList.push(taskItem);
                  });
                }
                
                moduleItem.children.push(submoduleItem);
                flatList.push(submoduleItem);
              });
            }
            
            // Add tasks directly to module if no submodules
            if (module.tasks && !module.submodules) {
              module.tasks.forEach(task => {
                const taskItem = createTaskItem(task, moduleItem.displayId, 2, idCounter++);
                moduleItem.children.push(taskItem);
                flatList.push(taskItem);
              });
            }
            
            projectItem.children.push(moduleItem);
            flatList.push(moduleItem);
          });
        }
        
        flatList.push(projectItem);
      });
    }
  });
  
  return flatList.reverse(); // Reverse to show in correct order
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

// Render table view
function renderTableView() {
  const tbody = document.getElementById('projects-table-body');
  if (!tbody) return;
  
  if (allProjectsData.length === 0) {
    tbody.innerHTML = `
      <div class="flex items-center justify-center h-64 text-slate-400">
        <div class="text-center">
          <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
          </svg>
          <p class="text-lg font-medium mb-2">No projects yet</p>
          <p class="text-sm mb-4">Create your first project to get started</p>
          <button onclick="openTreeNodeModal(null, 'project')" class="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm">
            Create Project
          </button>
        </div>
      </div>
    `;
    return;
  }
  
  tbody.innerHTML = '';
  
  allProjectsData.forEach(item => {
    if (item.level === 0 || expandedRows.has(item.parentId)) {
      tbody.appendChild(createTableRow(item));
    }
  });
}

// Create table row
function createTableRow(item) {
  const row = document.createElement('div');
  row.className = `table-row flex items-center gap-4 px-4 py-3 border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors cursor-pointer ${selectedItem?.displayId === item.displayId ? 'bg-primary-500/10' : ''}`;
  row.dataset.id = item.displayId;
  row.dataset.type = item.type;
  row.onclick = () => selectTableItem(item);
  
  // ID Column
  const idCol = document.createElement('div');
  idCol.className = 'w-16 text-slate-300 text-sm font-mono';
  idCol.textContent = item.displayId;
  row.appendChild(idCol);
  
  // Subject Column (with hierarchy indent and expand/collapse)
  const subjectCol = document.createElement('div');
  subjectCol.className = 'flex-1 min-w-[300px] flex items-center gap-2';
  
  // Indent
  const indent = document.createElement('div');
  indent.style.width = `${item.level * 24}px`;
  subjectCol.appendChild(indent);
  
  // Expand/Collapse button
  if (item.hasChildren) {
    const expandBtn = document.createElement('button');
    expandBtn.className = 'flex-shrink-0 w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white transition-colors';
    expandBtn.innerHTML = expandedRows.has(item.displayId) 
      ? '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>'
      : '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>';
    expandBtn.onclick = (e) => {
      e.stopPropagation();
      toggleRowExpand(item.displayId);
    };
    subjectCol.appendChild(expandBtn);
  } else {
    const spacer = document.createElement('div');
    spacer.className = 'w-5';
    subjectCol.appendChild(spacer);
  }
  
  // Hierarchy indicator line
  if (item.level > 0) {
    const hierarchyLine = document.createElement('div');
    hierarchyLine.className = 'w-4 h-px bg-slate-600';
    subjectCol.appendChild(hierarchyLine);
  }
  
  // Item name
  const nameSpan = document.createElement('span');
  nameSpan.className = 'text-slate-200 text-sm truncate';
  nameSpan.textContent = item.name;
  subjectCol.appendChild(nameSpan);
  
  row.appendChild(subjectCol);
  
  // Type Column
  const typeCol = document.createElement('div');
  typeCol.className = 'w-32 text-sm';
  const typeColors = {
    'PROJECT': 'text-blue-400',
    'MODULE': 'text-purple-400',
    'SUBMODULE': 'text-indigo-400',
    'TASK': 'text-green-400',
    'RESEARCH/SURVEY': 'text-pink-400'
  };
  typeCol.innerHTML = `<span class="${typeColors[item.type] || 'text-slate-400'}">${item.type}</span>`;
  row.appendChild(typeCol);
  
  // Status Column
  const statusCol = document.createElement('div');
  statusCol.className = 'w-32';
  statusCol.innerHTML = `
    <span class="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs ${getStatusBadgeClass(item.status)}">
      <span class="w-2 h-2 rounded-full ${getStatusDotClass(item.status)}"></span>
      ${translateStatus(item.status)}
    </span>
  `;
  row.appendChild(statusCol);
  
  // Assignee Column
  const assigneeCol = document.createElement('div');
  assigneeCol.className = 'w-32 text-sm text-slate-300';
  if (item.assignee) {
    assigneeCol.innerHTML = `
      <div class="flex items-center gap-2">
        <div class="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-xs text-white font-medium">
          ${item.assignee.charAt(0).toUpperCase()}
        </div>
        <span class="truncate">${item.assignee}</span>
      </div>
    `;
  } else {
    assigneeCol.innerHTML = '<span class="text-slate-500">-</span>';
  }
  row.appendChild(assigneeCol);
  
  // Priority Column
  const priorityCol = document.createElement('div');
  priorityCol.className = 'w-32';
  priorityCol.innerHTML = `
    <span class="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs ${getPriorityBadgeClass(item.priority)}">
      <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"/>
      </svg>
      ${item.priority}
    </span>
  `;
  row.appendChild(priorityCol);
  
  // Start Date Column
  const startCol = document.createElement('div');
  startCol.className = 'w-32 text-sm text-slate-400';
  startCol.innerHTML = item.startDate ? `
    <div class="flex items-center gap-1.5">
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
      </svg>
      ${item.startDate}
    </div>
  ` : '<span class="text-slate-600">-</span>';
  row.appendChild(startCol);
  
  // Finish Date Column
  const finishCol = document.createElement('div');
  finishCol.className = 'w-32 text-sm';
  if (item.finishDate) {
    const isOverdue = new Date(item.finishDate) < new Date() && item.status !== 'completed' && item.status !== 'done';
    finishCol.innerHTML = `
      <div class="flex items-center gap-1.5 ${isOverdue ? 'text-red-400' : 'text-slate-400'}">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
        ${item.finishDate}
      </div>
    `;
  } else {
    finishCol.innerHTML = '<span class="text-slate-600">-</span>';
  }
  row.appendChild(finishCol);
  
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
  renderTableView();
}

// Switch detail tab
function switchDetailTab(tabName) {
  currentDetailTab = tabName;
  
  // Update tab buttons
  document.querySelectorAll('.detail-tab').forEach(btn => {
    if (btn.dataset.tab === tabName) {
      btn.classList.add('active', 'text-primary-400', 'border-primary-400');
      btn.classList.remove('text-slate-400', 'border-transparent');
    } else {
      btn.classList.remove('active', 'text-primary-400', 'border-primary-400');
      btn.classList.add('text-slate-400', 'border-transparent');
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
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="w-12 h-12 rounded-lg bg-slate-700/50 flex items-center justify-center flex-shrink-0">
          <svg class="w-7 h-7 ${typeColors[item.type]}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${typeIcons[item.type]}"/>
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs uppercase font-semibold ${typeColors[item.type]}">${item.type}</span>
            <span class="text-xs text-slate-500">#${item.displayId}</span>
          </div>
          <h4 class="text-white font-semibold text-lg leading-tight">${item.name}</h4>
        </div>
      </div>
      
      <!-- Status Banner -->
      <div class="p-3 rounded-lg ${getStatusBannerClass(item.status)} border ${getStatusBorderClass(item.status)}">
        <p class="text-sm">
          <span class="font-medium">Công việc mới chưng - Sẽ được phân loại sau</span>
        </p>
      </div>
    </div>
    
    <!-- People Section -->
    <div class="mb-6">
      <h5 class="text-sm font-semibold text-white mb-3">PEOPLE</h5>
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-sm text-slate-400">Assignee</span>
          ${item.assignee ? `
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-xs text-white font-medium">
                ${item.assignee.charAt(0).toUpperCase()}
              </div>
              <span class="text-sm text-white font-medium">${item.assignee}</span>
            </div>
          ` : `
            <button class="text-sm text-primary-400 hover:text-primary-300">Assign</button>
          `}
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-slate-400">Accountable</span>
          <span class="text-sm text-slate-500">-</span>
        </div>
      </div>
    </div>
    
    <!-- Estimates and Progress -->
    <div class="mb-6">
      <h5 class="text-sm font-semibold text-white mb-3">ESTIMATES AND PROGRESS</h5>
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-sm text-slate-400">Work</span>
          <span class="text-sm text-white">1h</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-slate-400">Remaining work</span>
          <span class="text-sm text-white">1h</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-slate-400">% Complete</span>
          <span class="text-sm text-white">0%</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-slate-400">Spent time</span>
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span class="text-sm text-white">0.2h</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Details -->
    <div class="mb-6">
      <h5 class="text-sm font-semibold text-white mb-3">DETAILS</h5>
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-sm text-slate-400">Priority *</span>
          <span class="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs ${getPriorityBadgeClass(item.priority)}">
            ${item.priority}
          </span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-slate-400">Date</span>
          <span class="text-sm text-white">${item.startDate || 'Not set'} - ${item.finishDate ? `<span class="text-red-400">${item.finishDate}</span>` : 'Not set'}</span>
        </div>
      </div>
    </div>
    
    <!-- Action Buttons -->
    <div class="flex gap-2 pt-4 border-t border-slate-700">
      <button onclick="editDetailItem()" class="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
        </svg>
        Edit
      </button>
      <button onclick="duplicateDetailItem()" class="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
        </svg>
      </button>
      <button onclick="deleteDetailItem()" class="px-3 py-2 bg-danger/20 hover:bg-danger/30 text-danger text-sm rounded-lg transition-colors">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
      </button>
    </div>
  `;
}

// Render Activity Tab
function renderActivityTab(content, item) {
  content.innerHTML = `
    <div class="space-y-4">
      <!-- Add Comment Form -->
      <div class="bg-slate-700/30 rounded-lg p-4">
        <textarea
          placeholder="Add a comment..."
          rows="3"
          class="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
        ></textarea>
        <div class="flex items-center justify-end gap-2 mt-2">
          <button class="px-3 py-1.5 text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
          <button class="px-4 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm rounded transition-colors">Comment</button>
        </div>
      </div>
      
      <!-- Activity Timeline -->
      <div class="space-y-4">
        <h5 class="text-sm font-semibold text-white">ACTIVITY LOG</h5>
        
        <div class="space-y-4">
          <!-- Activity Item -->
          <div class="flex gap-3">
            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-xs text-white font-medium flex-shrink-0">
              DG
            </div>
            <div class="flex-1">
              <div class="bg-slate-700/30 rounded-lg p-3">
                <div class="flex items-start justify-between mb-2">
                  <span class="text-sm font-medium text-white">Đỗ Gia Đăng</span>
                  <span class="text-xs text-slate-400">Created on 08/26/2025 8:14 AM</span>
                </div>
                <p class="text-sm text-slate-300">Đã tạo ${item.type.toLowerCase()} này</p>
              </div>
            </div>
          </div>
          
          <!-- Activity Item -->
          <div class="flex gap-3">
            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xs text-white font-medium flex-shrink-0">
              DG
            </div>
            <div class="flex-1">
              <div class="bg-slate-700/30 rounded-lg p-3">
                <div class="flex items-start justify-between mb-2">
                  <span class="text-sm font-medium text-white">Đỗ Gia Đăng</span>
                  <span class="text-xs text-slate-400">Last updated on 08/26/2025 8:14 AM</span>
                </div>
                <p class="text-sm text-slate-300">Đã cập nhật trạng thái thành <span class="text-primary-400">${translateStatus(item.status)}</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
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
  if (selectedItem) {
    const typeMap = {
      'PROJECT': 'project',
      'MODULE': 'module',
      'SUBMODULE': 'submodule',
      'TASK': 'task'
    };
    handleNodeUpdate({
      id: `${typeMap[selectedItem.type]}-${selectedItem.realId}`,
      name: selectedItem.name,
      type: typeMap[selectedItem.type],
      status: selectedItem.status,
      priority: selectedItem.priority,
      startDate: selectedItem.startDate,
      dueDate: selectedItem.finishDate
    });
  }
}

function duplicateDetailItem() {
  if (selectedItem) {
    showNotification('Info', 'Duplicate functionality coming soon', 'info');
  }
}

function deleteDetailItem() {
  if (selectedItem) {
    const typeMap = {
      'PROJECT': 'project',
      'MODULE': 'module',
      'SUBMODULE': 'submodule',
      'TASK': 'task'
    };
    handleNodeDelete({
      id: `${typeMap[selectedItem.type]}-${selectedItem.realId}`,
      name: selectedItem.name,
      type: typeMap[selectedItem.type]
    });
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
  
  // Show/hide containers
  if (viewType === 'table') {
    document.getElementById('table-view-container').style.display = 'flex';
  } else {
    showNotification('Info', 'Tree view coming soon', 'info');
  }
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
      <div class="flex items-center justify-center h-64 text-slate-400">
        <div class="text-center">
          <svg class="w-16 h-16 mx-auto mb-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p class="text-lg font-medium mb-2">${message}</p>
          <button onclick="loadProjectsData()" class="mt-4 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm">
            Retry
          </button>
        </div>
      </div>
    `;
  }
}

// Export functions
window.initProjectsTableView = initProjectsTableView;
window.setProjectView = setProjectView;
window.switchDetailTab = switchDetailTab;
window.closeDetailPanel = closeDetailPanel;
window.editDetailItem = editDetailItem;
window.duplicateDetailItem = duplicateDetailItem;
window.deleteDetailItem = deleteDetailItem;
