/**
 * Process Flow Page Controller
 */

// Store projects keyed by id to avoid passing data through onclick attributes
const _pfProjectMap = {};

async function initProcessFlowPage() {
  console.log('[ProcessFlow] Initializing...');

  const container = document.getElementById('process-flow-projects');
  if (!container) return;

  // Show loading spinner
  container.innerHTML = `
    <div class="col-span-full flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
    </div>
  `;

  try {
    // Load all projects
    const response = await api.getProjects();
    const projects = response.data || response;

    if (!projects || projects.length === 0) {
      container.innerHTML = `
        <div class="col-span-full text-center py-12">
          <svg class="w-16 h-16 mx-auto text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/>
          </svg>
          <p class="text-slate-400">Chưa có dự án nào</p>
          <p class="text-slate-500 text-sm mt-1">Tạo dự án mới để bắt đầu vẽ sơ đồ</p>
        </div>
      `;
      return;
    }

    // Cache projects by id (safe lookup — no data in onclick)
    projects.forEach(p => { _pfProjectMap[p.id] = p; });

    // Render projects as cards — use data-project-id, never put data in onclick
    container.innerHTML = projects.map(project => `
      <div class="bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-primary-500/50 transition-all cursor-pointer group pf-project-card"
           data-project-id="${project.id}">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg select-none"
               style="background-color: ${project.color || '#6366f1'}">
            ${project.name.charAt(0).toUpperCase()}
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-medium text-white truncate group-hover:text-primary-400 transition-colors">
              ${_escHtml(project.name)}
            </h3>
            <p class="text-sm text-slate-400 truncate mt-0.5">
              ${_escHtml(project.description || 'Chưa có mô tả')}
            </p>
          </div>
        </div>

        <div class="mt-4 flex items-center justify-between">
          <span class="px-2 py-0.5 text-xs rounded-full ${getProcessFlowStatusClass(project.status)}">
            ${getProcessFlowStatusText(project.status)}
          </span>
          <span class="text-xs text-slate-500">${project.progress || 0}% hoàn thành</span>
        </div>

        <div class="mt-3 h-1 bg-slate-700 rounded-full overflow-hidden">
          <div class="h-full bg-primary-500 rounded-full transition-all" style="width: ${project.progress || 0}%"></div>
        </div>

        <div class="mt-3 flex items-center gap-1.5 text-xs text-slate-500 group-hover:text-primary-400 transition-colors">
          <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/>
          </svg>
          Mở sơ đồ quy trình
        </div>
      </div>
    `).join('');

    // Single delegated listener — no inline onclick needed
    container.addEventListener('click', (e) => {
      const card = e.target.closest('.pf-project-card');
      if (!card) return;
      const projectId = card.dataset.projectId;
      if (projectId) openProcessFlowEditor(projectId);
    });

    console.log('[ProcessFlow] Rendered', projects.length, 'projects');
  } catch (error) {
    console.error('[ProcessFlow] Error loading projects:', error);
    container.innerHTML = `
      <div class="col-span-full text-center py-12">
        <p class="text-red-400">Lỗi khi tải dự án</p>
        <p class="text-slate-500 text-sm mt-1">${error.message}</p>
        <button onclick="initProcessFlowPage()" class="mt-4 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm transition-colors">
          Thử lại
        </button>
      </div>
    `;
  }
}

// Helper functions (prefixed to avoid collision with other modules)
function getProcessFlowStatusClass(status) {
  const classes = {
    active: 'bg-green-500/20 text-green-400',
    completed: 'bg-blue-500/20 text-blue-400',
    pending: 'bg-yellow-500/20 text-yellow-400',
    archived: 'bg-slate-500/20 text-slate-400'
  };
  return classes[status] || classes.pending;
}

function getProcessFlowStatusText(status) {
  const texts = {
    active: 'Hoạt động',
    completed: 'Hoàn thành',
    pending: 'Chờ xử lý',
    archived: 'Lưu trữ'
  };
  return texts[status] || 'Chờ xử lý';
}

// ─── Fullscreen Editor ────────────────────────────────────────────────────────

function openProcessFlowEditor(projectId) {
  const project = _pfProjectMap[projectId];
  if (!project) return;

  console.log('[ProcessFlow] Opening editor for project:', projectId, project.name);

  // Store the return URL so we can go back to Process Flow page
  const returnUrl = window.location.href;
  sessionStorage.setItem('processFlowReturnUrl', returnUrl);
  sessionStorage.setItem('processFlowProjectId', projectId);

  const url = `/process-flow-editor.html?projectId=${encodeURIComponent(projectId)}&projectName=${encodeURIComponent(project.name)}&projectColor=${encodeURIComponent(project.color || '#6366f1')}`;

  // Navigate in the same tab
  window.location.href = url;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function _escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
