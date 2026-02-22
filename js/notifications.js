// Notifications Functionality
let notifications = [];

// Initialize notifications
function initNotifications() {
  loadNotifications();
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    const notifBtn = document.getElementById('notifications-btn');
    const dropdown = document.getElementById('notifications-dropdown');
    if (!notifBtn.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.add('hidden');
    }
  });
  
  // Poll for new notifications every 30 seconds
  setInterval(loadNotifications, 30000);
}

// Load notifications from API
async function loadNotifications() {
  try {
    // Use the activities endpoint from the first project as a workaround
    // In production, you should have a dedicated notifications endpoint
    const response = await fetch(`${API_BASE_URL}/projects`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    if (response.ok) {
      const data = await response.json();
      // For now, show empty notifications until proper endpoint is created
      notifications = [];
      updateNotificationBadge();
      renderNotifications();
    }
  }catch (error) {
    console.error('Failed to load notifications:', error);
    notifications = [];
    updateNotificationBadge();
  }
}

// Update notification badge
function updateNotificationBadge() {
  const badge = document.getElementById('notifications-badge');
  const unreadCount = notifications.filter(n => !n.read).length;
  
  if (unreadCount > 0) {
    badge.classList.remove('hidden');
  }else {
    badge.classList.add('hidden');
  }
}

// Toggle notifications dropdown
function toggleNotifications() {
  const dropdown = document.getElementById('notifications-dropdown');
  dropdown.classList.toggle('hidden');
  
  if (!dropdown.classList.contains('hidden')) {
    renderNotifications();
  }
}

// Render notifications list
function renderNotifications() {
  const container = document.getElementById('notifications-list');
  
  if (notifications.length === 0) {
    container.innerHTML = `
      <div class="px-4 py-8 text-center text-slate-400">
        <svg class="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
        </svg>
        <p class="text-sm">No notifications</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = notifications.map(notif => renderNotificationItem(notif)).join('');
}

// Render a single notification item
function renderNotificationItem(notif) {
  const isUnread = !notif.read;
  const bgClass = isUnread ? 'bg-slate-700/30' : '';
  
  const actionIcons = {
    'created': '➕',
    'updated': '✏️',
    'deleted': '🗑️',
    'commented': '💬',
    'assigned': '👤',
    'completed': '✅'
  };
  
  const icon = actionIcons[notif.action] || '📝';
  const timeAgo = getTimeAgo(notif.created_at);
  
  return `
    <div class="px-4 py-3 hover:bg-slate-700/50 cursor-pointer transition-colors ${bgClass}" onclick="handleNotificationClick('${notif.id}')">
      <div class="flex items-start gap-3">
        <span class="text-xl">${icon}</span>
        <div class="flex-1 min-w-0">
          <p class="text-sm text-white">
            <span class="font-medium">${notif.user_name || 'Someone'}</span>
            ${getActionText(notif.action)}
            <span class="font-medium">${notif.entity_type}</span>
          </p>
          ${notif.details ? `<p class="text-xs text-slate-400 mt-1">${notif.details}</p>` : ''}
          <p class="text-xs text-slate-500 mt-1">${timeAgo}</p>
        </div>
        ${isUnread ? '<span class="w-2 h-2 bg-primary-500 rounded-full mt-1"></span>' : ''}
      </div>
    </div>
  `;
}

// Get action text
function getActionText(action) {
  const actionTexts = {
    'created': 'created',
    'updated': 'updated',
    'deleted': 'deleted',
    'commented': 'commented on',
    'assigned': 'assigned',
    'completed': 'completed'
  };
  return actionTexts[action] || 'modified';
}

// Get time ago text
function getTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

// Handle notification click
function handleNotificationClick(notifId) {
  const notif = notifications.find(n => n.id == notifId);
  if (!notif) return;
  
  // Mark as read
  markNotificationAsRead(notifId);
  
  // Navigate to the item
  if (notif.entity_id) {
    navigateTo('projects');
    setTimeout(() => {
      if (window.showItemDetail) {
        window.showItemDetail(notif.entity_id);
      }
    }, 300);
  }
  
  // Close dropdown
  document.getElementById('notifications-dropdown').classList.add('hidden');
}

// Mark notification as read
async function markNotificationAsRead(notifId) {
  const notif = notifications.find(n => n.id == notifId);
  if (notif) {
    notif.read = true;
    updateNotificationBadge();
    renderNotifications();
  }
}

// Mark all as read
function markAllAsRead() {
  notifications.forEach(n => n.read = true);
  updateNotificationBadge();
  renderNotifications();
}

// Export functions
window.initNotifications = initNotifications;
window.toggleNotifications = toggleNotifications;
window.markAllAsRead = markAllAsRead;

