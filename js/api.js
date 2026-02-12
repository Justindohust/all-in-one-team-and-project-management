/**
 * DigiHub API Service
 * Handles all API communication with the backend
 */

const API_BASE_URL = '/api';

class DigiHubAPI {
  constructor() {
    this.token = localStorage.getItem('digihub_token');
    this.currentUser = JSON.parse(localStorage.getItem('digihub_user') || 'null');
  }

  // Helper method for API calls
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle 401 Unauthorized - token expired or invalid
        if (response.status === 401) {
          // Only show notification and redirect if user was logged in (had a token)
          // Don't show on login failures (no token yet)
          const hadToken = this.token !== null;
          
          if (hadToken) {
            console.error('🔒 Token invalid or expired!');
            this.clearAuth();
            
            // Show notification
            this.showTokenExpiredNotification();
            
            // Redirect to login after a short delay
            setTimeout(() => {
              window.location.href = '/';
            }, 2000);
          } else {
            // Login failure - just clear auth without notification
            this.clearAuth();
          }
        }
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }
  
  // Clear authentication data
  clearAuth() {
    this.token = null;
    this.currentUser = null;
    localStorage.removeItem('digihub_token');
    localStorage.removeItem('digihub_user');
  }
  
  // Show token expired notification
  showTokenExpiredNotification() {
    // Remove existing notification if any
    const existing = document.getElementById('token-expired-notification');
    if (existing) existing.remove();
    
    // Create notification
    const notification = document.createElement('div');
    notification.id = 'token-expired-notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(239, 68, 68, 0.4);
      z-index: 10000;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      font-weight: 500;
      animation: slideIn 0.3s ease-out;
    `;
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <svg style="width: 20px; height: 20px; flex-shrink: 0;" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/>
        </svg>
        <div>
          <div style="font-weight: 600; margin-bottom: 2px;">Session Expired</div>
          <div style="font-size: 12px; opacity: 0.9;">Redirecting to login...</div>
        </div>
      </div>
    `;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(notification);
  }

  // ==================
  // AUTH
  // ==================
  async login(email, password) {
    const result = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    if (result.success) {
      this.token = result.data.token;
      this.currentUser = result.data.user;
      localStorage.setItem('digihub_token', this.token);
      localStorage.setItem('digihub_user', JSON.stringify(this.currentUser));
    }
    
    return result;
  }

  async register(data) {
    const result = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    
    if (result.success) {
      this.token = result.data.token;
      this.currentUser = result.data.user;
      localStorage.setItem('digihub_token', this.token);
      localStorage.setItem('digihub_user', JSON.stringify(this.currentUser));
    }
    
    return result;
  }

  async logout() {
    await this.request('/auth/logout', { method: 'POST' });
    this.token = null;
    this.currentUser = null;
    localStorage.removeItem('digihub_token');
    localStorage.removeItem('digihub_user');
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  isLoggedIn() {
    return !!this.token;
  }

  // ==================
  // USERS
  // ==================
  async getUsers() {
    return this.request('/users');
  }

  async getUser(id) {
    return this.request(`/users/${id}`);
  }

  async updateUser(id, data) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // ==================
  // PROJECT GROUPS
  // ==================
  async getProjectGroups() {
    return this.request('/project-groups');
  }

  async createProjectGroup(data) {
    return this.request('/project-groups', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateProjectGroup(id, data) {
    return this.request(`/project-groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteProjectGroup(id) {
    return this.request(`/project-groups/${id}`, {
      method: 'DELETE'
    });
  }

  // ==================
  // PROJECTS
  // ==================
  async getProjects(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/projects?${params}`);
  }

  async getProject(id) {
    return this.request(`/projects/${id}`);
  }

  async createProject(data) {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        createdBy: this.currentUser?.id
      })
    });
  }

  async updateProject(id, data) {
    return this.request(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async toggleProjectFavorite(id) {
    return this.request(`/projects/${id}/favorite`, {
      method: 'PATCH'
    });
  }

  async deleteProject(id) {
    return this.request(`/projects/${id}`, {
      method: 'DELETE'
    });
  }

  // ==================
  // MODULES
  // ==================
  async getModules(projectId) {
    return this.request(`/modules/project/${projectId}`);
  }

  async getModule(id) {
    return this.request(`/modules/${id}`);
  }

  async createModule(data) {
    return this.request('/modules', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        created_by: this.currentUser?.id
      })
    });
  }

  async updateModule(id, data) {
    return this.request(`/modules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteModule(id) {
    return this.request(`/modules/${id}`, {
      method: 'DELETE'
    });
  }

  async moveModule(id, projectId) {
    return this.request(`/modules/${id}/move`, {
      method: 'PATCH',
      body: JSON.stringify({ project_id: projectId })
    });
  }

  // ==================
  // SUBMODULES
  // ==================
  async getSubmodules(moduleId) {
    return this.request(`/submodules/module/${moduleId}`);
  }

  async getSubmodule(id) {
    return this.request(`/submodules/${id}`);
  }

  async createSubmodule(data) {
    return this.request('/submodules', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        created_by: this.currentUser?.id
      })
    });
  }

  async updateSubmodule(id, data) {
    return this.request(`/submodules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteSubmodule(id) {
    return this.request(`/submodules/${id}`, {
      method: 'DELETE'
    });
  }

  async moveSubmodule(id, moduleId) {
    return this.request(`/submodules/${id}/move`, {
      method: 'PATCH',
      body: JSON.stringify({ module_id: moduleId })
    });
  }

  // ==================
  // TASKS
  // ==================
  async getTasks(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/tasks?${params}`);
  }

  async getTasksKanban(projectId = null) {
    const params = projectId ? `?projectId=${projectId}` : '';
    return this.request(`/tasks/kanban${params}`);
  }

  async getTask(id) {
    return this.request(`/tasks/${id}`);
  }

  async createTask(data) {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        createdBy: this.currentUser?.id
      })
    });
  }

  async updateTask(id, data) {
    return this.request(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async updateTaskStatus(id, status) {
    return this.request(`/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  async addTaskComment(taskId, content) {
    return this.request(`/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify({
        content,
        userId: this.currentUser?.id
      })
    });
  }

  async deleteTask(id) {
    return this.request(`/tasks/${id}`, {
      method: 'DELETE'
    });
  }

  // ==================
  // CALENDAR
  // ==================
  async getCalendarEvents(startDate, endDate) {
    const params = new URLSearchParams({ startDate, endDate });
    return this.request(`/calendar/events?${params}`);
  }

  async createCalendarEvent(data) {
    return this.request('/calendar/events', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        createdBy: this.currentUser?.id
      })
    });
  }

  async updateCalendarEvent(id, data) {
    return this.request(`/calendar/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteCalendarEvent(id) {
    return this.request(`/calendar/events/${id}`, {
      method: 'DELETE'
    });
  }

  // ==================
  // MESSAGES
  // ==================
  async getChannels() {
    return this.request('/messages/channels');
  }

  async getChannelMessages(channelId, limit = 50) {
    return this.request(`/messages/channels/${channelId}/messages?limit=${limit}`);
  }

  async sendChannelMessage(channelId, content, messageType = 'text') {
    return this.request(`/messages/channels/${channelId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        content,
        messageType,
        senderId: this.currentUser?.id
      })
    });
  }

  async createChannel(data) {
    return this.request('/messages/channels', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        createdBy: this.currentUser?.id
      })
    });
  }

  async getDirectMessages(withUserId) {
    return this.request(`/messages/direct/${this.currentUser?.id}?withUserId=${withUserId}`);
  }

  async sendDirectMessage(receiverId, content) {
    return this.request('/messages/direct', {
      method: 'POST',
      body: JSON.stringify({
        senderId: this.currentUser?.id,
        receiverId,
        content
      })
    });
  }

  // ==================
  // TEAM
  // ==================
  async getTeamMembers(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/team/members?${params}`);
  }

  async getTeamStats() {
    return this.request('/team/stats');
  }

  async inviteMember(data) {
    return this.request('/team/invite', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        invitedBy: this.currentUser?.id
      })
    });
  }

  async getPendingInvitations() {
    return this.request('/team/invitations');
  }

  async cancelInvitation(id) {
    return this.request(`/team/invitations/${id}`, {
      method: 'DELETE'
    });
  }

  async updateMemberRole(userId, role) {
    return this.request(`/team/members/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role })
    });
  }

  async removeMember(userId) {
    return this.request(`/team/members/${userId}`, {
      method: 'DELETE'
    });
  }

  // ==================
  // REPORTS
  // ==================
  async getDashboardStats(period = '7d') {
    return this.request(`/reports/dashboard?period=${period}`);
  }

  async getActivityLog(limit = 20) {
    return this.request(`/reports/activity?limit=${limit}`);
  }

  async getTasksByStatus() {
    return this.request('/reports/tasks-by-status');
  }

  async getTasksByPriority() {
    return this.request('/reports/tasks-by-priority');
  }

  // ==================
  // SETTINGS
  // ==================
  async getUserSettings() {
    if (!this.currentUser?.id) return null;
    return this.request(`/settings/${this.currentUser.id}`);
  }

  async updateUserSettings(settings) {
    return this.request(`/settings/${this.currentUser.id}`, {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  }

  async changePassword(currentPassword, newPassword) {
    return this.request(`/settings/${this.currentUser.id}/change-password`, {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  }

  async getWorkspaceSettings(workspaceId = 'w1234567-89ab-cdef-0123-456789abcdef') {
    return this.request(`/settings/workspace/${workspaceId}`);
  }

  async updateWorkspaceSettings(workspaceId, settings) {
    return this.request(`/settings/workspace/${workspaceId}`, {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  }

  // ==================
  // ACTIVITIES & COMMENTS
  // ==================
  async getActivities(entityType, entityId, page = 1, limit = 50) {
    return this.request(`/activities/${entityType}/${entityId}?page=${page}&limit=${limit}`);
  }

  async getCommentReplies(commentId) {
    return this.request(`/activities/comments/${commentId}/replies`);
  }

  async createComment(entityType, entityId, content, parentId = null) {
    return this.request('/activities/comments', {
      method: 'POST',
      body: JSON.stringify({ entityType, entityId, content, parentId })
    });
  }

  async updateComment(commentId, content) {
    return this.request(`/activities/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify({ content })
    });
  }

  async deleteComment(commentId) {
    return this.request(`/activities/comments/${commentId}`, {
      method: 'DELETE'
    });
  }
}

// Create global API instance
const api = new DigiHubAPI();
