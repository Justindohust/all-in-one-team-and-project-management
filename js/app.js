/**
 * DigiHub App - Main Application Controller
 * Handles state management and API integration
 */

class DigiHubApp {
  constructor() {
    this.state = {
      isLoading: true,
      isAuthenticated: false,
      currentUser: null,
      projectGroups: [],
      projects: [],
      tasks: [],
      teamMembers: [],
      channels: [],
      currentChannel: null,
      messages: [],
      dashboardStats: null
    };
    
    this.treeView = null;
    this.treeViewPage = null;
  }

  // Initialize the application
  async init() {
    console.log('DigiHub App initializing...');
    
    // Check if user is logged in
    if (api.isLoggedIn()) {
      this.state.isAuthenticated = true;
      this.state.currentUser = api.currentUser;
      await this.loadInitialData();
      this.state.isLoading = false;
      this.updateUI();
    } else {
      // Not logged in - show login modal
      this.state.isLoading = false;
      this.showLoginModal();
    }
  }
  
  // Show login modal
  showLoginModal() {
    setTimeout(() => {
      const loginModal = document.getElementById('login-modal');
      if (loginModal) {
        loginModal.classList.remove('hidden');
      }
    }, 100);
  }

  // Load initial data from API
  async loadInitialData() {
    try {
      // Load data in parallel
      const [projectGroupsResult, dashboardResult, teamResult] = await Promise.all([
        api.getProjectGroups().catch(e => ({ success: false })),
        api.getDashboardStats().catch(e => ({ success: false })),
        api.getTeamMembers().catch(e => ({ success: false }))
      ]);

      if (projectGroupsResult.success) {
        this.state.projectGroups = projectGroupsResult.data;
        this.updateTreeViews();
      }

      if (dashboardResult.success) {
        this.state.dashboardStats = dashboardResult.data;
        this.updateDashboardStats();
      }

      if (teamResult.success) {
        this.state.teamMembers = teamResult.data;
      }

      console.log('Initial data loaded successfully');
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  }

  // Update UI based on state
  updateUI() {
    this.updateUserProfile();
    this.updateDashboardStats();
  }

  // Update user profile in sidebar
  updateUserProfile() {
    const user = this.state.currentUser;
    if (!user) return;

    const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    
    // Update sidebar profile
    const profileName = document.querySelector('#sidebar .text-white.truncate');
    const profileEmail = document.querySelector('#sidebar .text-slate-400.truncate');
    const profileAvatar = document.querySelector('#sidebar .w-10.h-10.rounded-full');
    
    if (profileName) profileName.textContent = fullName || 'User';
    if (profileEmail) profileEmail.textContent = user.email || '';
    if (profileAvatar) profileAvatar.textContent = initials || 'U';
  }

  // Update dashboard stats
  updateDashboardStats() {
    const stats = this.state.dashboardStats;
    if (!stats) return;

    // Find stat cards and update them
    const statCards = document.querySelectorAll('#dashboard-page .grid > div');
    
    if (statCards[0]) {
      const valueEl = statCards[0].querySelector('.text-3xl');
      if (valueEl) valueEl.textContent = stats.totalProjects || '0';
    }
    
    if (statCards[1]) {
      const valueEl = statCards[1].querySelector('.text-3xl');
      if (valueEl) valueEl.textContent = stats.activeTasks || '0';
    }
    
    if (statCards[2]) {
      const valueEl = statCards[2].querySelector('.text-3xl');
      if (valueEl) valueEl.textContent = stats.teamMembers || '0';
    }
    
    if (statCards[3]) {
      const valueEl = statCards[3].querySelector('.text-3xl');
      if (valueEl) valueEl.textContent = `${stats.completionRate || 0}%`;
    }
  }

  // Update TreeViews with data from API
  updateTreeViews() {
    const treeViewData = this.state.projectGroups.map(group => ({
      id: group.id,
      name: group.name,
      color: group.color || '#3B82F6',
      icon: group.icon || 'folder',
      expanded: group.isExpanded !== false,
      projects: (group.projects || []).map(project => ({
        id: project.id,
        name: project.name,
        status: project.status || 'active',
        favorite: project.isFavorite || false,
        progress: project.progress || 0
      }))
    }));

    // Update global projectsData for TreeView
    if (typeof projectsData !== 'undefined') {
      projectsData.length = 0;
      projectsData.push(...treeViewData);
    }

    // Re-render TreeViews
    if (this.treeView) {
      this.treeView.data = treeViewData;
      this.treeView.render();
    }
    
    if (this.treeViewPage) {
      this.treeViewPage.data = treeViewData;
      this.treeViewPage.render();
    }
  }

  // ==================
  // PROJECT OPERATIONS
  // ==================
  async createProject(groupId, name, description = '', isFavorite = false) {
    try {
      showLoading();
      const result = await api.createProject({
        groupId,
        name,
        description,
        isFavorite,
        status: 'active'
      });
      
      if (result.success) {
        // Reload project groups
        await this.loadProjectGroups();
        showToast('Project created successfully!', 'success');
        return result.data;
      }
    } catch (error) {
      showToast('Failed to create project: ' + error.message, 'error');
    } finally {
      hideLoading();
    }
    return null;
  }

  async loadProjectGroups() {
    try {
      const result = await api.getProjectGroups();
      if (result.success) {
        this.state.projectGroups = result.data;
        this.updateTreeViews();
      }
    } catch (error) {
      console.error('Failed to load project groups:', error);
    }
  }

  async toggleFavorite(projectId) {
    try {
      const result = await api.toggleProjectFavorite(projectId);
      if (result.success) {
        await this.loadProjectGroups();
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  }

  async deleteProject(projectId) {
    if (!confirm('Are you sure you want to delete this project?')) return;
    
    try {
      showLoading();
      const result = await api.deleteProject(projectId);
      if (result.success) {
        await this.loadProjectGroups();
        showToast('Project deleted successfully!', 'success');
      }
    } catch (error) {
      showToast('Failed to delete project: ' + error.message, 'error');
    } finally {
      hideLoading();
    }
  }

  // ==================
  // TASK OPERATIONS
  // ==================
  async loadTasks(projectId = null) {
    try {
      const result = await api.getTasks(projectId ? { projectId } : {});
      if (result.success) {
        this.state.tasks = result.data;
        this.renderTaskList();
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  }

  async loadKanbanTasks(projectId = null) {
    try {
      const result = await api.getTasksKanban(projectId);
      if (result.success) {
        this.renderKanbanBoard(result.data);
      }
    } catch (error) {
      console.error('Failed to load kanban tasks:', error);
    }
  }

  async createTask(data) {
    try {
      showLoading();
      const result = await api.createTask(data);
      if (result.success) {
        showToast('Task created successfully!', 'success');
        await this.loadTasks();
        return result.data;
      }
    } catch (error) {
      showToast('Failed to create task: ' + error.message, 'error');
    } finally {
      hideLoading();
    }
    return null;
  }

  async updateTaskStatus(taskId, status) {
    try {
      const result = await api.updateTaskStatus(taskId, status);
      if (result.success) {
        await this.loadKanbanTasks();
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  }

  renderTaskList() {
    const container = document.getElementById('task-list-container');
    if (!container) return;

    const tasks = this.state.tasks;
    if (!tasks.length) {
      container.innerHTML = `
        <div class="text-center py-8 text-slate-400">
          <p>No tasks found</p>
        </div>
      `;
      return;
    }

    container.innerHTML = tasks.map(task => `
      <div class="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-slate-600" data-task-id="${task.id}">
        <input type="checkbox" class="w-5 h-5 rounded border-slate-600 bg-slate-700 text-primary-500 focus:ring-primary-500 cursor-pointer" ${task.status === 'done' ? 'checked' : ''}>
        <div class="flex-1 min-w-0">
          <h4 class="font-medium text-white truncate">${task.title}</h4>
          <p class="text-sm text-slate-400 truncate">${task.projectName || 'No project'}</p>
        </div>
        <span class="px-2 py-1 text-xs font-medium rounded-full ${this.getPriorityClass(task.priority)}">${task.priority}</span>
        <span class="text-sm text-slate-400">${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}</span>
        ${task.assigneeName ? `
          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-xs font-semibold text-white" title="${task.assigneeName}">
            ${this.getInitials(task.assigneeName)}
          </div>
        ` : ''}
      </div>
    `).join('');
  }

  renderKanbanBoard(data) {
    const columns = ['todo', 'in_progress', 'in_review', 'done'];
    const columnNames = { todo: 'To Do', in_progress: 'In Progress', in_review: 'Review', done: 'Done' };
    const columnColors = { todo: 'slate-400', in_progress: 'info', in_review: 'warning', done: 'success' };

    columns.forEach(status => {
      const container = document.querySelector(`[data-kanban-column="${status}"]`);
      if (!container) return;

      const tasks = data[status] || [];
      const countEl = container.closest('.flex-shrink-0')?.querySelector('.px-2.py-0\\.5');
      if (countEl) countEl.textContent = tasks.length;

      const taskList = container.querySelector('.space-y-3') || container;
      const addButton = taskList.querySelector('button');
      
      taskList.innerHTML = tasks.map(task => `
        <div class="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 hover:border-slate-600 cursor-pointer" draggable="true" data-task-id="${task.id}">
          <div class="flex flex-wrap gap-1.5 mb-2">
            ${task.tags ? task.tags.map(tag => `
              <span class="px-2 py-0.5 bg-primary-500/15 text-primary-400 text-[10px] font-medium rounded-full">${tag}</span>
            `).join('') : ''}
          </div>
          <h4 class="font-medium text-white text-sm mb-1">${task.title}</h4>
          ${task.description ? `<p class="text-xs text-slate-400 mb-3">${task.description.substring(0, 50)}...</p>` : ''}
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3 text-xs text-slate-400">
              <span class="flex items-center gap-1">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
                ${task.commentCount || 0}
              </span>
            </div>
            ${task.assigneeName ? `
              <div class="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-[9px] font-semibold text-white">
                ${this.getInitials(task.assigneeName)}
              </div>
            ` : `<div class="w-2 h-2 rounded-full bg-${this.getPriorityColor(task.priority)}"></div>`}
          </div>
        </div>
      `).join('');

      if (addButton) taskList.appendChild(addButton);
    });
  }

  // ==================
  // TEAM OPERATIONS
  // ==================
  async loadTeamMembers() {
    try {
      const result = await api.getTeamMembers();
      if (result.success) {
        this.state.teamMembers = result.data;
        this.renderTeamMembers();
      }
    } catch (error) {
      console.error('Failed to load team members:', error);
    }
  }

  async inviteMember(email, role, message) {
    try {
      showLoading();
      const result = await api.inviteMember({ email, role, message });
      if (result.success) {
        showToast('Invitation sent successfully!', 'success');
        return true;
      }
    } catch (error) {
      showToast('Failed to send invitation: ' + error.message, 'error');
    } finally {
      hideLoading();
    }
    return false;
  }

  renderTeamMembers() {
    const container = document.getElementById('team-grid');
    if (!container) return;

    const members = this.state.teamMembers;
    container.innerHTML = members.map(member => `
      <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 text-center hover:border-primary-500/50 hover:shadow-lg hover:shadow-primary-500/10 cursor-pointer">
        <div class="relative w-16 h-16 mx-auto mb-4">
          <div class="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-xl font-semibold text-white">
            ${this.getInitials(`${member.firstName} ${member.lastName}`)}
          </div>
          <div class="absolute bottom-0 right-0 w-4 h-4 ${member.isOnline ? 'bg-success' : 'bg-slate-500'} rounded-full border-2 border-slate-800"></div>
        </div>
        <h3 class="font-semibold text-white mb-0.5">${member.firstName} ${member.lastName}</h3>
        <p class="text-sm text-primary-400 mb-0.5">${member.jobTitle || member.role}</p>
        <p class="text-xs text-slate-400 mb-4">${member.email}</p>
        <div class="flex justify-center gap-6 pt-4 border-t border-slate-700/50">
          <div class="text-center">
            <p class="text-lg font-semibold text-white">${member.projectCount || 0}</p>
            <p class="text-xs text-slate-400">Projects</p>
          </div>
          <div class="text-center">
            <p class="text-lg font-semibold text-white">${member.taskCount || 0}</p>
            <p class="text-xs text-slate-400">Tasks</p>
          </div>
        </div>
      </div>
    `).join('');
  }

  // ==================
  // MESSAGES OPERATIONS
  // ==================
  async loadChannels() {
    try {
      const result = await api.getChannels();
      if (result.success) {
        this.state.channels = result.data;
        this.renderChannelList();
      }
    } catch (error) {
      console.error('Failed to load channels:', error);
    }
  }

  async loadChannelMessages(channelId) {
    try {
      this.state.currentChannel = channelId;
      const result = await api.getChannelMessages(channelId);
      if (result.success) {
        this.state.messages = result.data;
        this.renderMessages();
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  }

  async sendMessage(content) {
    if (!this.state.currentChannel || !content.trim()) return;
    
    try {
      const result = await api.sendChannelMessage(this.state.currentChannel, content);
      if (result.success) {
        await this.loadChannelMessages(this.state.currentChannel);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }

  renderChannelList() {
    const container = document.getElementById('channel-list');
    if (!container) return;

    container.innerHTML = this.state.channels.map(channel => `
      <button onclick="app.loadChannelMessages('${channel.id}')" class="w-full flex items-center gap-3 px-3 py-2 rounded-lg ${this.state.currentChannel === channel.id ? 'bg-primary-500/20 text-primary-400' : 'text-slate-300 hover:bg-slate-700/50'}">
        <span class="text-lg">${channel.isPrivate ? '🔒' : '#'}</span>
        <span class="flex-1 text-left truncate">${channel.name}</span>
        ${channel.unreadCount ? `<span class="bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full">${channel.unreadCount}</span>` : ''}
      </button>
    `).join('');
  }

  renderMessages() {
    const container = document.getElementById('messages-container');
    if (!container) return;

    container.innerHTML = this.state.messages.map(msg => `
      <div class="flex gap-3 ${msg.senderId === this.state.currentUser?.id ? 'flex-row-reverse' : ''}">
        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex-shrink-0 flex items-center justify-center text-sm font-semibold text-white">
          ${this.getInitials(msg.senderName)}
        </div>
        <div class="max-w-[70%]">
          <div class="flex items-center gap-2 mb-1 ${msg.senderId === this.state.currentUser?.id ? 'flex-row-reverse' : ''}">
            <span class="font-medium text-white text-sm">${msg.senderName}</span>
            <span class="text-xs text-slate-500">${this.formatTime(msg.createdAt)}</span>
          </div>
          <div class="${msg.senderId === this.state.currentUser?.id ? 'bg-primary-500 text-white' : 'bg-slate-700 text-slate-100'} rounded-2xl px-4 py-2">
            <p class="text-sm">${msg.content}</p>
          </div>
        </div>
      </div>
    `).join('');

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
  }

  // ==================
  // CALENDAR OPERATIONS
  // ==================
  async loadCalendarEvents(startDate, endDate) {
    try {
      const result = await api.getCalendarEvents(startDate, endDate);
      if (result.success) {
        return result.data;
      }
    } catch (error) {
      console.error('Failed to load calendar events:', error);
    }
    return [];
  }

  async createCalendarEvent(data) {
    try {
      showLoading();
      const result = await api.createCalendarEvent(data);
      if (result.success) {
        showToast('Event created successfully!', 'success');
        return result.data;
      }
    } catch (error) {
      showToast('Failed to create event: ' + error.message, 'error');
    } finally {
      hideLoading();
    }
    return null;
  }

  // ==================
  // SETTINGS OPERATIONS
  // ==================
  async loadUserSettings() {
    try {
      const result = await api.getUserSettings();
      if (result.success) {
        this.applySettings(result.data);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  async saveUserSettings(settings) {
    try {
      showLoading();
      const result = await api.updateUserSettings(settings);
      if (result.success) {
        showToast('Settings saved successfully!', 'success');
        return true;
      }
    } catch (error) {
      showToast('Failed to save settings: ' + error.message, 'error');
    } finally {
      hideLoading();
    }
    return false;
  }

  async changePassword(currentPassword, newPassword) {
    try {
      showLoading();
      const result = await api.changePassword(currentPassword, newPassword);
      if (result.success) {
        showToast('Password changed successfully!', 'success');
        return true;
      }
    } catch (error) {
      showToast('Failed to change password: ' + error.message, 'error');
    } finally {
      hideLoading();
    }
    return false;
  }

  applySettings(settings) {
    // Apply email notifications setting
    const emailToggle = document.getElementById('email-notifications');
    if (emailToggle) emailToggle.checked = settings.emailNotifications;

    // Apply push notifications setting
    const pushToggle = document.getElementById('push-notifications');
    if (pushToggle) pushToggle.checked = settings.pushNotifications;

    // Apply theme setting
    if (settings.theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  }

  // ==================
  // UTILITY METHODS
  // ==================
  getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  getPriorityClass(priority) {
    const classes = {
      high: 'bg-danger/15 text-danger',
      medium: 'bg-warning/15 text-warning',
      low: 'bg-success/15 text-success'
    };
    return classes[priority] || classes.medium;
  }

  getPriorityColor(priority) {
    const colors = { high: 'danger', medium: 'warning', low: 'success' };
    return colors[priority] || 'warning';
  }

  formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  }

  // Logout
  async logout() {
    try {
      await api.logout();
      this.state.isAuthenticated = false;
      this.state.currentUser = null;
      window.location.reload();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }
}

// ==================
// UI HELPERS
// ==================
function showLoading() {
  let loader = document.getElementById('global-loader');
  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'global-loader';
    loader.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-[100]';
    loader.innerHTML = `
      <div class="bg-slate-800 rounded-lg p-6 flex items-center gap-3">
        <svg class="animate-spin w-6 h-6 text-primary-500" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-white">Loading...</span>
      </div>
    `;
    document.body.appendChild(loader);
  }
  loader.classList.remove('hidden');
}

function hideLoading() {
  const loader = document.getElementById('global-loader');
  if (loader) loader.classList.add('hidden');
}

function showToast(message, type = 'info') {
  const colors = {
    success: 'bg-success',
    error: 'bg-danger',
    warning: 'bg-warning',
    info: 'bg-primary-500'
  };

  const toast = document.createElement('div');
  toast.className = `fixed bottom-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-[100] animate-slide-up`;
  toast.innerHTML = `
    <div class="flex items-center gap-3">
      <span>${message}</span>
      <button onclick="this.parentElement.parentElement.remove()" class="ml-2 hover:opacity-70">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  `;
  
  document.body.appendChild(toast);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    toast.remove();
  }, 5000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes slide-up {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  .animate-slide-up {
    animation: slide-up 0.3s ease-out;
  }
`;
document.head.appendChild(style);

// Create global app instance
const app = new DigiHubApp();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
