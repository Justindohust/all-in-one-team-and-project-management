// ViewLoader - Dynamic View Loading System for DigiHub
class ViewLoader {
  constructor() {
    this.viewContainer = null;
    this.modalsContainer = null;
    this.loadedViews = new Map();
    this.currentView = null;
    this.viewCallbacks = new Map();
  }

  // Initialize the view loader
  init(viewContainerId = 'view-container', modalsContainerId = 'modals-container') {
    this.viewContainer = document.getElementById(viewContainerId);
    this.modalsContainer = document.getElementById(modalsContainerId);
    
    if (!this.viewContainer) {
      console.error('View container not found:', viewContainerId);
      return false;
    }
    
    // Load modals once
    this.loadModals();
    
    return true;
  }

  // Register callback for when a view is loaded
  onViewLoad(viewName, callback) {
    if (!this.viewCallbacks.has(viewName)) {
      this.viewCallbacks.set(viewName, []);
    }
    this.viewCallbacks.get(viewName).push(callback);
  }

  // Load modals into the modals container
  async loadModals() {
    if (!this.modalsContainer) return;
    
    try {
      const response = await fetch('views/modals.html');
      if (response.ok) {
        const html = await response.text();
        this.modalsContainer.innerHTML = html;
      }
    } catch (error) {
      console.error('Error loading modals:', error);
    }
  }

  // Load a view by name
  async loadView(viewName) {
    if (!this.viewContainer) {
      console.error('ViewLoader not initialized');
      return false;
    }

    // Check if view is already loaded in cache
    if (this.loadedViews.has(viewName)) {
      this.renderView(viewName, this.loadedViews.get(viewName));
      return true;
    }

    try {
      const response = await fetch(`views/${viewName}.html`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const html = await response.text();
      this.loadedViews.set(viewName, html);
      this.renderView(viewName, html);
      return true;
    } catch (error) {
      console.error(`Error loading view ${viewName}:`, error);
      this.viewContainer.innerHTML = `
        <div class="flex items-center justify-center h-64">
          <div class="text-center">
            <svg class="w-16 h-16 mx-auto text-slate-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <p class="text-slate-400">Error loading page</p>
            <button onclick="viewLoader.loadView('${viewName}')" class="mt-4 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg">
              Try Again
            </button>
          </div>
        </div>
      `;
      return false;
    }
  }

  // Render the view content
  renderView(viewName, html) {
    // Remove initial loading spinner if it exists (only has one child that's not a .page)
    const children = Array.from(this.viewContainer.children);
    children.forEach(child => {
      if (!child.classList.contains('page')) {
        child.remove();
      }
    });

    // Hide all existing pages first
    const existingPages = this.viewContainer.querySelectorAll('.page');
    existingPages.forEach(page => page.classList.add('hidden'));

    // Check if this page element already exists
    let pageElement = this.viewContainer.querySelector(`#${viewName}-page`);
    const isNewPage = !pageElement;
    
    if (!pageElement) {
      // Create new page element
      pageElement = document.createElement('div');
      pageElement.id = `${viewName}-page`;
      pageElement.className = 'page';
      pageElement.innerHTML = html;
      this.viewContainer.appendChild(pageElement);
    }

    // Show the page
    pageElement.classList.remove('hidden');
    this.currentView = viewName;

    // Execute callbacks for this view only if it's newly created
    if (isNewPage && this.viewCallbacks.has(viewName)) {
      this.viewCallbacks.get(viewName).forEach(callback => callback());
    }

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('viewLoaded', { detail: { viewName, isNewPage } }));
  }

  // Get current view name
  getCurrentView() {
    return this.currentView;
  }

  // Clear cache for a specific view or all views
  clearCache(viewName = null) {
    if (viewName) {
      this.loadedViews.delete(viewName);
    } else {
      this.loadedViews.clear();
    }
  }

  // Preload views for faster navigation
  async preloadViews(viewNames) {
    const promises = viewNames.map(async (viewName) => {
      if (!this.loadedViews.has(viewName)) {
        try {
          const response = await fetch(`views/${viewName}.html`);
          if (response.ok) {
            const html = await response.text();
            this.loadedViews.set(viewName, html);
          }
        } catch (error) {
          console.error(`Error preloading view ${viewName}:`, error);
        }
      }
    });
    
    await Promise.all(promises);
  }
}

// Create global instance
const viewLoader = new ViewLoader();

// Navigation function using view loader
function navigateTo(pageId) {
  // Update sidebar active state
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active', 'bg-primary-500/20', 'text-primary-400', 'border-primary-400');
    item.classList.add('text-slate-400', 'hover:bg-slate-700/50', 'border-transparent');
  });

  const activeNav = document.querySelector(`.nav-item[data-page="${pageId}"]`);
  if (activeNav) {
    activeNav.classList.remove('text-slate-400', 'hover:bg-slate-700/50', 'border-transparent');
    activeNav.classList.add('active', 'bg-primary-500/20', 'text-primary-400', 'border-primary-400');
  }

  // Update page title
  const pageTitles = {
    dashboard: 'Dashboard',
    projects: 'Projects',
    tasks: 'Tasks',
    calendar: 'Calendar',
    team: 'Team',
    messages: 'Messages',
    reports: 'Reports',
    settings: 'Settings'
  };
  
  const titleElement = document.getElementById('page-title');
  if (titleElement) {
    titleElement.textContent = pageTitles[pageId] || 'Dashboard';
  }

  // Load the view
  viewLoader.loadView(pageId);

  // Close mobile sidebar if open
  closeMobileSidebar();
}

// Mobile sidebar functions
function openMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar) {
    sidebar.classList.remove('-translate-x-full');
    sidebar.classList.add('translate-x-0');
  }
  if (overlay) {
    overlay.classList.remove('hidden');
  }
}

function closeMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar && window.innerWidth < 1024) {
    sidebar.classList.remove('translate-x-0');
    sidebar.classList.add('-translate-x-full');
  }
  if (overlay) {
    overlay.classList.add('hidden');
  }
}

// Settings tab function
function showSettingsTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.settings-tab').forEach(tab => {
    tab.classList.remove('active', 'bg-primary-500/20', 'text-primary-400');
    tab.classList.add('text-slate-400', 'hover:bg-slate-700/50');
  });

  const activeTab = document.querySelector(`.settings-tab[onclick*="${tabName}"]`);
  if (activeTab) {
    activeTab.classList.remove('text-slate-400', 'hover:bg-slate-700/50');
    activeTab.classList.add('active', 'bg-primary-500/20', 'text-primary-400');
  }

  // Show corresponding content
  document.querySelectorAll('.settings-content').forEach(content => {
    content.classList.add('hidden');
  });

  const activeContent = document.getElementById(`settings-${tabName}`);
  if (activeContent) {
    activeContent.classList.remove('hidden');
  }
}

// Modal functions
function openProjectModal() {
  const modal = document.getElementById('project-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeProjectModal() {
  const modal = document.getElementById('project-modal');
  if (modal) modal.classList.add('hidden');
}

function openTaskModal() {
  const modal = document.getElementById('task-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeTaskModal() {
  const modal = document.getElementById('task-modal');
  if (modal) modal.classList.add('hidden');
}

function openInviteModal() {
  const modal = document.getElementById('invite-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeInviteModal() {
  const modal = document.getElementById('invite-modal');
  if (modal) modal.classList.add('hidden');
}

function openEventModal() {
  const modal = document.getElementById('event-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeEventModal() {
  const modal = document.getElementById('event-modal');
  if (modal) modal.classList.add('hidden');
}

// Task view toggle
function toggleTaskView(view) {
  const listBtn = document.getElementById('task-view-list');
  const kanbanBtn = document.getElementById('task-view-kanban');
  const listView = document.getElementById('task-list-view');
  const kanbanView = document.getElementById('task-kanban-view');

  if (view === 'list') {
    listBtn?.classList.add('bg-primary-500');
    listBtn?.classList.remove('bg-slate-700');
    kanbanBtn?.classList.remove('bg-primary-500');
    kanbanBtn?.classList.add('bg-slate-700');
    listView?.classList.remove('hidden');
    kanbanView?.classList.add('hidden');
  } else {
    kanbanBtn?.classList.add('bg-primary-500');
    kanbanBtn?.classList.remove('bg-slate-700');
    listBtn?.classList.remove('bg-primary-500');
    listBtn?.classList.add('bg-slate-700');
    kanbanView?.classList.remove('hidden');
    listView?.classList.add('hidden');
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ViewLoader, viewLoader, navigateTo };
}
