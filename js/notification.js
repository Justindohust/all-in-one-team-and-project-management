/**
 * Advanced Notification System for DigiHub
 * Features: Multiple notifications, auto-dismiss, progress bar, icons, sound, pause on hover
 */

class NotificationManager {
  constructor() {
    this.notifications = [];
    this.maxNotifications = 5;
    this.defaultDuration = 5000; // 5 seconds
    this.container = null;
    this.soundEnabled = true;
    this.init();
  }

  /**
   * Initialize notification container
   */
  init() {
    // Create notification container if not exists
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'notification-container';
      this.container.className = 'fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-md';
      document.body.appendChild(this.container);
    }

    // Add notification styles
    this.addStyles();
  }

  /**
   * Show notification
   * @param {string} message - Notification message
   * @param {string} type - Notification type: success, error, warning, info
   * @param {object} options - Additional options (duration, title, action, sound)
   */
  show(message, type = 'info', options = {}) {
    const {
      duration = this.defaultDuration,
      title = null,
      action = null,
      sound = this.soundEnabled,
      persistent = false
    } = options;

    // Remove oldest notification if limit reached
    if (this.notifications.length >= this.maxNotifications) {
      this.dismiss(this.notifications[0].id);
    }

    const notification = {
      id: this.generateId(),
      message,
      type,
      title,
      action,
      duration,
      persistent,
      createdAt: Date.now()
    };

    this.notifications.push(notification);
    this.render(notification);

    // Play sound
    if (sound && type === 'success') {
      this.playSound(type);
    }

    // Auto dismiss if not persistent
    if (!persistent && duration > 0) {
      notification.timeout = setTimeout(() => {
        this.dismiss(notification.id);
      }, duration);
    }

    return notification.id;
  }

  /**
   * Show success notification
   */
  success(message, options = {}) {
    return this.show(message, 'success', options);
  }

  /**
   * Show error notification
   */
  error(message, options = {}) {
    return this.show(message, 'error', { ...options, duration: options.duration || 7000 });
  }

  /**
   * Show warning notification
   */
  warning(message, options = {}) {
    return this.show(message, 'warning', options);
  }

  /**
   * Show info notification
   */
  info(message, options = {}) {
    return this.show(message, 'info', options);
  }

  /**
   * Render notification
   */
  render(notification) {
    const element = document.createElement('div');
    element.id = `notification-${notification.id}`;
    element.className = `notification notification-${notification.type} transform transition-all duration-300 ease-out`;
    element.setAttribute('data-id', notification.id);

    const config = this.getTypeConfig(notification.type);

    element.innerHTML = `
      <div class="flex items-start gap-3 p-4 rounded-xl shadow-2xl backdrop-blur-sm border ${config.bgClass} ${config.borderClass} ${config.textClass}">
        <!-- Icon -->
        <div class="flex-shrink-0">
          <div class="${config.iconBgClass} ${config.iconTextClass} rounded-lg p-2">
            ${config.icon}
          </div>
        </div>
        
        <!-- Content -->
        <div class="flex-1 min-w-0">
          ${notification.title ? `<h4 class="font-semibold text-white mb-1">${notification.title}</h4>` : ''}
          <p class="text-sm ${config.messageClass}">${notification.message}</p>
          ${notification.action ? `
            <button onclick="notificationManager.handleAction('${notification.id}')" class="mt-2 text-sm font-medium ${config.actionClass} hover:underline">
              ${notification.action.text}
            </button>
          ` : ''}
        </div>

        <!-- Close button -->
        <button onclick="notificationManager.dismiss('${notification.id}')" class="flex-shrink-0 ${config.closeClass} hover:opacity-70 transition-opacity">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      ${!notification.persistent && notification.duration > 0 ? `
        <div class="progress-bar ${config.progressClass}"></div>
      ` : ''}
    `;

    // Add to container with animation
    element.style.opacity = '0';
    element.style.transform = 'translateX(100%)';
    this.container.appendChild(element);

    // Trigger animation
    setTimeout(() => {
      element.style.opacity = '1';
      element.style.transform = 'translateX(0)';
    }, 10);

    // Start progress bar animation
    if (!notification.persistent && notification.duration > 0) {
      const progressBar = element.querySelector('.progress-bar');
      if (progressBar) {
        progressBar.style.animationDuration = `${notification.duration}ms`;
      }
    }

    // Pause on hover
    element.addEventListener('mouseenter', () => {
      if (notification.timeout) {
        clearTimeout(notification.timeout);
      }
      const progressBar = element.querySelector('.progress-bar');
      if (progressBar) {
        progressBar.style.animationPlayState = 'paused';
      }
    });

    // Resume on mouse leave
    element.addEventListener('mouseleave', () => {
      if (!notification.persistent && notification.duration > 0) {
        const elapsed = Date.now() - notification.createdAt;
        const remaining = notification.duration - elapsed;
        if (remaining > 0) {
          notification.timeout = setTimeout(() => {
            this.dismiss(notification.id);
          }, remaining);
        }
      }
      const progressBar = element.querySelector('.progress-bar');
      if (progressBar) {
        progressBar.style.animationPlayState = 'running';
      }
    });
  }

  /**
   * Dismiss notification
   */
  dismiss(id) {
    const element = document.getElementById(`notification-${id}`);
    if (element) {
      // Animate out
      element.style.opacity = '0';
      element.style.transform = 'translateX(100%)';
      
      setTimeout(() => {
        element.remove();
      }, 300);
    }

    // Remove from array
    const index = this.notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      if (this.notifications[index].timeout) {
        clearTimeout(this.notifications[index].timeout);
      }
      this.notifications.splice(index, 1);
    }
  }

  /**
   * Dismiss all notifications
   */
  dismissAll() {
    this.notifications.forEach(notification => {
      this.dismiss(notification.id);
    });
  }

  /**
   * Handle action button click
   */
  handleAction(id) {
    const notification = this.notifications.find(n => n.id === id);
    if (notification && notification.action && notification.action.callback) {
      notification.action.callback();
    }
    this.dismiss(id);
  }

  /**
   * Get type configuration
   */
  getTypeConfig(type) {
    const configs = {
      success: {
        bgClass: 'bg-green-900/90',
        borderClass: 'border-green-600/50',
        textClass: 'text-green-50',
        iconBgClass: 'bg-green-600/20',
        iconTextClass: 'text-green-400',
        messageClass: 'text-green-100',
        closeClass: 'text-green-300',
        actionClass: 'text-green-400',
        progressClass: 'bg-green-500',
        icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
        </svg>`
      },
      error: {
        bgClass: 'bg-red-900/90',
        borderClass: 'border-red-600/50',
        textClass: 'text-red-50',
        iconBgClass: 'bg-red-600/20',
        iconTextClass: 'text-red-400',
        messageClass: 'text-red-100',
        closeClass: 'text-red-300',
        actionClass: 'text-red-400',
        progressClass: 'bg-red-500',
        icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>`
      },
      warning: {
        bgClass: 'bg-yellow-900/90',
        borderClass: 'border-yellow-600/50',
        textClass: 'text-yellow-50',
        iconBgClass: 'bg-yellow-600/20',
        iconTextClass: 'text-yellow-400',
        messageClass: 'text-yellow-100',
        closeClass: 'text-yellow-300',
        actionClass: 'text-yellow-400',
        progressClass: 'bg-yellow-500',
        icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>`
      },
      info: {
        bgClass: 'bg-blue-900/90',
        borderClass: 'border-blue-600/50',
        textClass: 'text-blue-50',
        iconBgClass: 'bg-blue-600/20',
        iconTextClass: 'text-blue-400',
        messageClass: 'text-blue-100',
        closeClass: 'text-blue-300',
        actionClass: 'text-blue-400',
        progressClass: 'bg-blue-500',
        icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>`
      }
    };

    return configs[type] || configs.info;
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Play notification sound
   */
  playSound(type) {
    // Create simple beep using Web Audio API
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      if (type === 'success') {
        oscillator.frequency.value = 800;
        gainNode.gain.value = 0.1;
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
      }
    } catch (error) {
      console.warn('Unable to play notification sound:', error);
    }
  }

  /**
   * Add custom styles
   */
  addStyles() {
    if (document.getElementById('notification-styles')) return;

    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
      #notification-container {
        pointer-events: none;
      }

      #notification-container .notification {
        pointer-events: auto;
      }

      .notification {
        min-width: 300px;
        max-width: 500px;
      }

      .progress-bar {
        height: 3px;
        width: 100%;
        border-radius: 0 0 0.75rem 0.75rem;
        animation: progress-shrink linear forwards;
        transform-origin: left;
      }

      @keyframes progress-shrink {
        from {
          transform: scaleX(1);
        }
        to {
          transform: scaleX(0);
        }
      }

      /* Smooth transitions */
      .notification {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      /* Responsive adjustments */
      @media (max-width: 640px) {
        #notification-container {
          left: 1rem;
          right: 1rem;
          top: 1rem;
        }

        .notification {
          min-width: 100%;
          max-width: 100%;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Toggle sound
   */
  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    return this.soundEnabled;
  }
}

// Create global instance
const notificationManager = new NotificationManager();

// Backward compatibility - keep showToast function
function showToast(message, type = 'info', options = {}) {
  return notificationManager.show(message, type, options);
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NotificationManager, notificationManager, showToast };
}
