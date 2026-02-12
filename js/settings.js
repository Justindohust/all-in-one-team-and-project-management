/**
 * Settings Management Module
 * Handles all settings-related functionality including profile, notifications, security, workspace, and integrations
 */

class SettingsManager {
  constructor() {
    this.currentWorkspaceId = '01234567-89ab-cdef-0123-456789abcdef'; // Default workspace ID (DigiHub Team)
    this.currentSettings = null;
    this.workspaceSettings = null;
  }

  /**
   * Initialize settings page
   */
  async initialize() {
    try {
      showLoading();
      
      // Load all settings in parallel
      await Promise.all([
        this.loadUserProfile(),
        this.loadNotificationSettings(),
        this.loadWorkspaceSettings()
      ]);
      
      // Set up event listeners
      this.setupEventListeners();
      
      hideLoading();
    } catch (error) {
      console.error('Failed to initialize settings:', error);
      notificationManager.error('Failed to load settings', {
        title: 'Settings Error',
        duration: 7000
      });
      hideLoading();
    }
  }

  /**
   * Set up event listeners for settings changes
   */
  setupEventListeners() {
    // Notification toggles - auto-save on change
    const notificationToggles = [
      'notif-email',
      'notif-push',
      'notif-reminders',
      'notif-weekly'
    ];

    notificationToggles.forEach(id => {
      const toggle = document.getElementById(id);
      if (toggle) {
        toggle.addEventListener('change', () => this.saveNotificationSettings());
      }
    });
  }

  // ==================
  // PROFILE MANAGEMENT
  // ==================

  /**
   * Load user profile data
   */
  async loadUserProfile() {
    try {
      const currentUser = app.getCurrentUser();
      if (!currentUser) return;

      // Populate profile fields
      const firstnameInput = document.getElementById('profile-firstname');
      const lastnameInput = document.getElementById('profile-lastname');
      const emailInput = document.getElementById('profile-email');
      const roleInput = document.getElementById('profile-role');
      const bioInput = document.getElementById('profile-bio');
      const avatarDiv = document.getElementById('profile-avatar');

      if (firstnameInput) firstnameInput.value = currentUser.firstName || '';
      if (lastnameInput) lastnameInput.value = currentUser.lastName || '';
      if (emailInput) emailInput.value = currentUser.email || '';
      if (roleInput) roleInput.value = currentUser.role || '';
      if (bioInput) bioInput.value = currentUser.bio || '';

      // Set avatar initials
      if (avatarDiv) {
        const fullName = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim();
        const initials = app.getInitials(fullName || currentUser.email);
        avatarDiv.textContent = initials;
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      throw error;
    }
  }

  /**
   * Save profile changes
   */
  async saveProfile() {
    try {
      showLoading();

      const firstname = document.getElementById('profile-firstname')?.value.trim();
      const lastname = document.getElementById('profile-lastname')?.value.trim();
      const email = document.getElementById('profile-email')?.value.trim();
      const bio = document.getElementById('profile-bio')?.value.trim();

      // Validate inputs
      if (!firstname || !lastname) {
        notificationManager.warning('First name and last name are required', {
          title: 'Validation Error'
        });
        hideLoading();
        return;
      }

      if (!email || !this.isValidEmail(email)) {
        notificationManager.warning('Please enter a valid email address', {
          title: 'Invalid Email'
        });
        hideLoading();
        return;
      }

      const currentUser = app.getCurrentUser();
      if (!currentUser) {
        notificationManager.error('User not found', {
          title: 'Authentication Error'
        });
        hideLoading();
        return;
      }

      // Update user via API (backend expects camelCase)
      const result = await api.updateUser(currentUser.id, {
        firstName: firstname,
        lastName: lastname,
        email,
        bio
      });

      if (result.success) {
        // Update current user in app state (API returns camelCase)
        app.state.currentUser = { ...currentUser, ...result.data };
        
        // Update avatar
        const avatarDiv = document.getElementById('profile-avatar');
        if (avatarDiv) {
          const fullName = `${firstname} ${lastname}`;
          avatarDiv.textContent = app.getInitials(fullName);
        }

        // Update user dropdown in header
        this.updateHeaderUserInfo();

        notificationManager.success('Your profile has been updated successfully', {
          title: '✓ Profile Updated',
          duration: 4000
        });
      }

      hideLoading();
    } catch (error) {
      console.error('Failed to save profile:', error);
      notificationManager.error(`Failed to save profile: ${error.message}`, {
        title: 'Profile Update Failed',
        duration: 7000
      });
      hideLoading();
    }
  }

  /**
   * Update user info in header
   */
  updateHeaderUserInfo() {
    const currentUser = app.getCurrentUser();
    if (!currentUser) return;

    const userNameElement = document.getElementById('user-name');
    const userEmailElement = document.getElementById('user-email');
    const userAvatarElements = document.querySelectorAll('.user-avatar-initials');

    const fullName = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim();
    const initials = app.getInitials(fullName || currentUser.email);

    if (userNameElement) userNameElement.textContent = fullName || currentUser.email;
    if (userEmailElement) userEmailElement.textContent = currentUser.email;

    // Update all avatar elements
    const userAvatar = document.getElementById('user-avatar');
    if (userAvatar) userAvatar.textContent = initials;
    
    userAvatarElements.forEach(el => {
      el.textContent = initials;
    });
  }

  /**
   * Validate email format
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // ==================
  // NOTIFICATION SETTINGS
  // ==================

  /**
   * Load notification settings
   */
  async loadNotificationSettings() {
    try {
      const result = await api.getUserSettings();
      
      if (result.success) {
        this.currentSettings = result.data;

        // Update toggles
        const emailToggle = document.getElementById('notif-email');
        const pushToggle = document.getElementById('notif-push');
        const remindersToggle = document.getElementById('notif-reminders');
        const weeklyToggle = document.getElementById('notif-weekly');

        if (emailToggle) emailToggle.checked = result.data.emailNotifications ?? true;
        if (pushToggle) pushToggle.checked = result.data.pushNotifications ?? true;
        if (remindersToggle) remindersToggle.checked = result.data.taskReminders ?? true;
        if (weeklyToggle) weeklyToggle.checked = result.data.weeklySummary ?? false;
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
      throw error;
    }
  }

  /**
   * Save notification settings
   */
  async saveNotificationSettings() {
    try {
      const emailToggle = document.getElementById('notif-email');
      const pushToggle = document.getElementById('notif-push');
      const remindersToggle = document.getElementById('notif-reminders');
      const weeklyToggle = document.getElementById('notif-weekly');

      const settings = {
        emailNotifications: emailToggle?.checked ?? true,
        pushNotifications: pushToggle?.checked ?? true,
        taskReminders: remindersToggle?.checked ?? true,
        weeklySummary: weeklyToggle?.checked ?? false
      };

      const result = await api.updateUserSettings(settings);

      if (result.success) {
        this.currentSettings = { ...this.currentSettings, ...settings };
        notificationManager.success('Notification preferences updated', {
          title: '✓ Saved',
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      notificationManager.error('Failed to save notification settings', {
        title: 'Save Failed'
      });
    }
  }

  // ==================
  // SECURITY SETTINGS
  // ==================

  /**
   * Update password
   */
  async updatePassword() {
    try {
      showLoading();

      const currentPasswordInput = document.getElementById('current-password');
      const newPasswordInput = document.getElementById('new-password');
      const confirmPasswordInput = document.getElementById('confirm-password');

      const currentPassword = currentPasswordInput?.value;
      const newPassword = newPasswordInput?.value;
      const confirmPassword = confirmPasswordInput?.value;

      // Validate inputs
      if (!currentPassword) {
        notificationManager.warning('Please enter your current password', {
          title: 'Current Password Required'
        });
        hideLoading();
        return;
      }

      if (!newPassword || newPassword.length < 6) {
        notificationManager.warning('New password must be at least 6 characters', {
          title: 'Password Too Short'
        });
        hideLoading();
        return;
      }

      if (newPassword !== confirmPassword) {
        notificationManager.warning('Passwords do not match', {
          title: 'Password Mismatch'
        });
        hideLoading();
        return;
      }

      if (currentPassword === newPassword) {
        notificationManager.warning('New password must be different from current password', {
          title: 'Same Password'
        });
        hideLoading();
        return;
      }

      // Call API to change password
      const result = await api.changePassword(currentPassword, newPassword);

      if (result.success) {
        notificationManager.success('Your password has been changed successfully', {
          title: '🔒 Password Updated',
          duration: 5000
        });
        
        // Clear input fields
        if (currentPasswordInput) currentPasswordInput.value = '';
        if (newPasswordInput) newPasswordInput.value = '';
        if (confirmPasswordInput) confirmPasswordInput.value = '';
      } else {
        // Show specific error message from backend
        notificationManager.error(result.message || 'Failed to update password', {
          title: 'Password Update Failed',
          duration: 7000
        });
      }

      hideLoading();
    } catch (error) {
      console.error('Failed to update password:', error);
      
      // Check if it's a backend error with message
      let errorMessage = 'Failed to update password';
      if (error.message) {
        errorMessage = error.message;
      }
      
      notificationManager.error(errorMessage, {
        title: 'Password Update Failed',
        duration: 7000
      });
      hideLoading();
    }
  }

  // ==================
  // WORKSPACE SETTINGS
  // ==================

  /**
   * Load workspace settings
   */
  async loadWorkspaceSettings() {
    try {
      const result = await api.getWorkspaceSettings(this.currentWorkspaceId);
      
      if (result.success) {
        this.workspaceSettings = result.data;

        const nameInput = document.getElementById('workspace-name');
        const timezoneSelect = document.getElementById('workspace-timezone');
        const languageSelect = document.getElementById('workspace-language');

        if (nameInput) nameInput.value = result.data.name || '';
        if (timezoneSelect) timezoneSelect.value = result.data.timezone || 'UTC+7';
        if (languageSelect) languageSelect.value = result.data.language || 'en';
      }
    } catch (error) {
      console.error('Failed to load workspace settings:', error);
      // Don't throw error, as workspace settings are optional
    }
  }

  /**
   * Save workspace settings
   */
  async saveWorkspaceSettings() {
    try {
      showLoading();

      const nameInput = document.getElementById('workspace-name');
      const timezoneSelect = document.getElementById('workspace-timezone');
      const languageSelect = document.getElementById('workspace-language');

      const name = nameInput?.value.trim();
      const timezone = timezoneSelect?.value;
      const language = languageSelect?.value;

      if (!name) {
        notificationManager.warning('Workspace name is required', {
          title: 'Validation Error'
        });
        hideLoading();
        return;
      }

      const settings = {
        name,
        timezone,
        language
      };

      const result = await api.updateWorkspaceSettings(this.currentWorkspaceId, settings);

      if (result.success) {
        this.workspaceSettings = { ...this.workspaceSettings, ...settings };
        notificationManager.success('Workspace settings updated', {
          title: '✓ Workspace Updated',
          duration: 4000
        });
        
        // Update user settings timezone
        await api.updateUserSettings({ timezone, language });
      }

      hideLoading();
    } catch (error) {
      console.error('Failed to save workspace settings:', error);
      notificationManager.error(error.message || 'Failed to save workspace settings', {
        title: 'Update Failed',
        duration: 7000
      });
      hideLoading();
    }
  }

  // ==================
  // INTEGRATIONS
  // ==================

  /**
   * Connect integration
   */
  async connectIntegration(integrationName) {
    try {
      showLoading();
      
      // Simulate integration connection
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      notificationManager.success(`${integrationName} has been connected to your workspace`, {
        title: `✓ ${integrationName} Connected`,
        duration: 4000
      });
      hideLoading();
      
      // Refresh integrations display
      this.refreshIntegrationsUI(integrationName);
    } catch (error) {
      console.error(`Failed to connect ${integrationName}:`, error);
      notificationManager.error(`Unable to connect ${integrationName}. Please try again.`, {
        title: 'Connection Failed',
        duration: 6000
      });
      hideLoading();
    }
  }

  /**
   * Disconnect integration
   */
  async disconnectIntegration(integrationName) {
    try {
      showLoading();
      
      // Simulate integration disconnection
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      notificationManager.info(`${integrationName} has been disconnected`, {
        title: `${integrationName} Disconnected`,
        duration: 4000
      });
      hideLoading();
      
      // Refresh integrations display
      this.refreshIntegrationsUI(integrationName, false);
    } catch (error) {
      console.error(`Failed to disconnect ${integrationName}:`, error);
      notificationManager.error(`Failed to disconnect ${integrationName}`, {
        title: 'Disconnection Failed'
      });
      hideLoading();
    }
  }

  /**
   * Refresh integrations UI
   */
  refreshIntegrationsUI(integrationName, connected = true) {
    // Find the integration button and update its state
    const integrationButtons = document.querySelectorAll('#settings-integrations button');
    
    integrationButtons.forEach(button => {
      if (button.textContent.includes('Connect') || button.textContent.includes('Disconnect')) {
        const parentDiv = button.closest('.flex');
        if (parentDiv && parentDiv.textContent.includes(integrationName)) {
          if (connected) {
            button.outerHTML = '<span class="px-3 py-1 bg-success/20 text-success text-sm font-medium rounded-lg">Connected</span>';
          } else {
            button.outerHTML = '<button onclick="settingsManager.connectIntegration(\'' + integrationName + '\')" class="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg">Connect</button>';
          }
        }
      }
    });
  }

  // ==================
  // UTILITY METHODS
  // ==================

  /**
   * Export user data
   */
  async exportUserData() {
    try {
      showLoading();
      
      const currentUser = app.getCurrentUser();
      const settings = this.currentSettings;
      const workspaceSettings = this.workspaceSettings;

      const exportData = {
        user: currentUser,
        settings: settings,
        workspace: workspaceSettings,
        exportedAt: new Date().toISOString()
      };

      // Create download link
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `user-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      notificationManager.success('Your data has been exported successfully', {
        title: '✓ Export Complete',
        duration: 5000
      });
      hideLoading();
    } catch (error) {
      console.error('Failed to export user data:', error);
      notificationManager.error('Failed to export user data', {
        title: 'Export Failed'
      });
      hideLoading();
    }
  }
}

// Create global instance
const settingsManager = new SettingsManager();

// Global functions for HTML onclick handlers
function saveProfile() {
  settingsManager.saveProfile();
}

function updatePassword() {
  settingsManager.updatePassword();
}

function saveWorkspaceSettings() {
  settingsManager.saveWorkspaceSettings();
}

function connectIntegration(name) {
  settingsManager.connectIntegration(name);
}

function disconnectIntegration(name) {
  settingsManager.disconnectIntegration(name);
}

function exportUserData() {
  settingsManager.exportUserData();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SettingsManager, settingsManager };
}
