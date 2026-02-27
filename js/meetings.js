/**
 * Meetings Module - DigiHub
 * Handles meeting management functionality
 */

class MeetingsManager {
  constructor() {
    this.meetings = [];
    this.currentMeeting = null;
    this.currentTab = 'upcoming';
    this.editingMinutes = false;
  }

  // Initialize meetings module
  async init() {
    console.log('[Meetings] Initializing...');
    await this.loadMeetings();
    this.setupEventListeners();
    console.log('[Meetings] Calling attachDropdownListeners from init()...');
    this.attachDropdownListeners();
    console.log('[Meetings] init() complete');
  }

  // Attach dropdown button listeners (called every time view is rendered)
  attachDropdownListeners() {
    console.log('[Meetings] attachDropdownListeners running...');

    // Meeting dropdown buttons
    const oneTimeBtn = document.getElementById('btn-one-time-meeting');
    const recurringBtn = document.getElementById('btn-recurring-meeting');
    const dropdownBtn = document.getElementById('meeting-dropdown-btn');
    const dropdown = document.getElementById('meeting-dropdown');

    console.log('[Meetings] Button elements found:', {
      oneTimeBtn: !!oneTimeBtn,
      recurringBtn: !!recurringBtn,
      dropdownBtn: !!dropdownBtn,
      dropdown: !!dropdown
    });

    if (oneTimeBtn) {
      // Remove existing listeners by cloning
      const newBtn = oneTimeBtn.cloneNode(true);
      oneTimeBtn.parentNode.replaceChild(newBtn, oneTimeBtn);

      newBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('[Meetings] One-time button clicked - opening modal');
        closeMeetingDropdown();
        this.openOneTimeMeetingModal();
      });
      console.log('[Meetings] One-time button listener attached');
    }else {
      console.warn('[Meetings] One-time button NOT FOUND');
    }

    if (recurringBtn) {
      // Remove existing listeners by cloning
      const newBtn = recurringBtn.cloneNode(true);
      recurringBtn.parentNode.replaceChild(newBtn, recurringBtn);

      newBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('[Meetings] Recurring button clicked - opening modal');
        closeMeetingDropdown();
        this.openRecurringMeetingModal();
      });
      console.log('[Meetings] Recurring button listener attached');
    } else {
      console.warn('[Meetings] Recurring button NOT FOUND');
    }

    if (dropdownBtn) {
      dropdownBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleMeetingDropdown();
      });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (dropdown && !dropdown.contains(e.target) && !dropdownBtn?.contains(e.target)) {
        dropdown.classList.add('hidden');
      }
    });
  }

  // Open one-time meeting modal
  openOneTimeMeetingModal() {
    console.log('[Meetings] openOneTimeMeetingModal called');
    closeMeetingDropdown();
    window.openMeetingModal && window.openMeetingModal('one-time');
  }

  // Open recurring meeting modal
  openRecurringMeetingModal() {
    console.log('[Meetings] openRecurringMeetingModal called');
    closeMeetingDropdown();
    window.openMeetingModal && window.openMeetingModal('recurring');
  }

  // Setup event listeners
  setupEventListeners() {
    // Filter change listeners
    const searchInput = document.getElementById('meeting-search');
    const dateFilter = document.getElementById('meeting-date-filter');
    const organizerFilter = document.getElementById('meeting-organizer-filter');
    const statusFilter = document.getElementById('meeting-status-filter');

    if (searchInput) {
      searchInput.addEventListener('input', () => this.filterMeetings());
    }
    if (dateFilter) {
      dateFilter.addEventListener('change', () => this.filterMeetings());
    }
    if (organizerFilter) {
      organizerFilter.addEventListener('change', () => this.filterMeetings());
    }
    if (statusFilter) {
      statusFilter.addEventListener('change', () => this.filterMeetings());
    }
  }

  // Load meetings from API
  async loadMeetings() {
    try {
      const result = await api.getMeetings();
      if (result.success) {
        this.meetings = result.data;
        this.renderMeetings();
        this.updateStats();
      }
    } catch (error) {
      console.error('[Meetings] Failed to load meetings:', error);
    }
  }

  // Render meetings list
  renderMeetings() {
    const container = document.getElementById('meetings-list');
    if (!container) return;

    const filteredMeetings = this.getFilteredMeetings();
    
    if (filteredMeetings.length === 0) {
      container.innerHTML = `
        <div id="meetings-empty" class="py-16 text-center">
          <svg class="w-16 h-16 mx-auto text-slate-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <p class="text-white font-medium mb-1">No meetings to display</p>
          <p class="text-sm text-slate-400">There are no meetings that meet the active filter criteria.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filteredMeetings.map(meeting => this.renderMeetingItem(meeting)).join('');
  }

  // Render single meeting item
  renderMeetingItem(meeting) {
    const date = new Date(meeting.startTime);
    const endDate = new Date(meeting.endTime);
    const duration = this.calculateDuration(meeting.startTime, meeting.endTime);
    
    const typeLabel = meeting.isRecurring ? 'Recurring' : 'One-time';
    const recurrenceLabel = meeting.recurrencePattern ? `• ${meeting.recurrencePattern}` : '';
    
    const statusClass = this.getStatusClass(meeting.status);
    const statusLabel = meeting.status || 'Scheduled';

    return `
      <div class="grid grid-cols-4 gap-4 py-4 items-center hover:bg-slate-700/20 cursor-pointer border-b border-slate-700/30 last:border-0" onclick="meetingsManager.openMeetingDetail('${meeting.id}')">
        <div>
          <h4 class="font-medium text-white">${meeting.title}</h4>
          <p class="text-xs text-slate-400">${typeLabel} ${recurrenceLabel}</p>
        </div>
        <div>
          <p class="text-white">${this.formatDate(date)}</p>
          <p class="text-xs text-slate-400">${this.formatTime(date)} - ${this.formatTime(endDate)}</p>
        </div>
        <div class="text-slate-300">${duration}</div>
        <div class="text-slate-300">${meeting.location || 'Virtual'}</div>
      </div>
    `;
  }

  // Get filtered meetings
  getFilteredMeetings() {
    const search = document.getElementById('meeting-search')?.value?.toLowerCase() || '';
    const dateFilter = document.getElementById('meeting-date-filter')?.value || 'all';
    const organizer = document.getElementById('meeting-organizer-filter')?.value || '';
    const status = document.getElementById('meeting-status-filter')?.value || '';

    let filtered = [...this.meetings];

    // Filter by tab
    const now = new Date();
    if (this.currentTab === 'upcoming') {
      filtered = filtered.filter(m => new Date(m.startTime) >= now);
    } else if (this.currentTab === 'past') {
      filtered = filtered.filter(m => new Date(m.endTime) < now);
    }

    // Filter by search
    if (search) {
      filtered = filtered.filter(m => 
        m.title.toLowerCase().includes(search) ||
        (m.description && m.description.toLowerCase().includes(search))
      );
    }

    // Filter by date range
    if (dateFilter !== 'all') {
      filtered = filtered.filter(m => this.isInDateRange(m.startTime, dateFilter));
    }

    // Filter by organizer
    if (organizer) {
      filtered = filtered.filter(m => m.organizerId === organizer);
    }

    // Filter by status
    if (status) {
      filtered = filtered.filter(m => m.status === status);
    }

    // Sort by start time
    filtered.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    return filtered;
  }

  // Check if date is in range
  isInDateRange(dateStr, range) {
    const date = new Date(dateStr);
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (range) {
      case 'today':
        return date.toDateString() === now.toDateString();
      case 'week':
        const weekEnd = new Date(startOfDay);
        weekEnd.setDate(weekEnd.getDate() + 7);
        return date >= startOfDay && date < weekEnd;
      case 'month':
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      default:
        return true;
    }
  }

  // Filter meetings (called when filter changes)
  filterMeetings() {
    this.renderMeetings();
  }

  // Update stats
  updateStats() {
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Count this week
    const thisWeek = this.meetings.filter(m => {
      const start = new Date(m.startTime);
      return start >= now && start <= weekEnd;
    }).length;

    // Calculate hours this month
    let hoursThisMonth = 0;
    this.meetings.forEach(m => {
      const start = new Date(m.startTime);
      const end = new Date(m.endTime);
      if (start.getMonth() === now.getMonth() && start.getFullYear() === now.getFullYear()) {
        hoursThisMonth += (end - start) / (1000 * 60 * 60);
      }
    });

    // Update UI
    const weekCount = document.getElementById('meeting-count-week');
    const hoursCount = document.getElementById('meeting-hours-month');
    if (weekCount) weekCount.textContent = thisWeek;
    if (hoursCount) hoursCount.textContent = hoursThisMonth.toFixed(1);

    // Update next meeting widget
    this.updateNextMeetingWidget();
  }

  // Update next meeting widget
  updateNextMeetingWidget() {
    const container = document.getElementById('next-meeting-widget');
    if (!container) return;

    const now = new Date();
    const upcoming = this.meetings
      .filter(m => new Date(m.startTime) >= now)
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))[0];

    if (!upcoming) {
      container.innerHTML = `
        <div class="text-center py-4">
          <p class="text-sm text-slate-400">No upcoming meetings</p>
        </div>
      `;
      return;
    }

    const startDate = new Date(upcoming.startTime);
    container.innerHTML = `
      <div class="p-3 bg-primary-500/10 border border-primary-500/30 rounded-lg">
        <h4 class="font-medium text-white mb-1">${upcoming.title}</h4>
        <p class="text-sm text-slate-400">${this.formatDate(startDate)} at ${this.formatTime(startDate)}</p>
        <p class="text-xs text-slate-500 mt-1">${this.calculateDuration(upcoming.startTime, upcoming.endTime)}</p>
      </div>
    `;
  }

  // Open meeting detail modal
  async openMeetingDetail(meetingId) {
    try {
      const result = await api.getMeeting(meetingId);
      if (result.success) {
        this.currentMeeting = result.data;
        this.renderMeetingDetail(this.currentMeeting);
        document.getElementById('meeting-detail-modal')?.classList.remove('hidden');
      }
    } catch (error) {
      console.error('[Meetings] Failed to load meeting detail:', error);
      showToast('Failed to load meeting details', 'error');
    }
  }

  // Render meeting detail
  renderMeetingDetail(meeting) {
    const startDate = new Date(meeting.startTime);
    const endDate = new Date(meeting.endTime);
    
    // Update header
    document.getElementById('meeting-detail-title').textContent = meeting.title;
    const subtitle = meeting.isRecurring ? `Recurring • ${meeting.recurrencePattern || 'Weekly'}` : 'One-time';
    document.getElementById('meeting-detail-subtitle').textContent = subtitle;

    // Update info
    document.getElementById('meeting-detail-datetime').textContent = 
      `${this.formatDate(startDate)} at ${this.formatTime(startDate)} - ${this.formatTime(endDate)}`;
    document.getElementById('meeting-detail-duration').textContent = 
      this.calculateDuration(meeting.startTime, meeting.endTime);
    document.getElementById('meeting-detail-location').textContent = 
      meeting.location || 'Virtual';
    
    const statusEl = document.getElementById('meeting-detail-status');
    statusEl.textContent = meeting.status || 'Scheduled';
    statusEl.className = `px-2 py-1 text-xs font-medium rounded-full ${this.getStatusClass(meeting.status)}`;

    // Render participants
    const participantsContainer = document.getElementById('meeting-detail-participants');
    if (meeting.participants && meeting.participants.length > 0) {
      participantsContainer.innerHTML = meeting.participants.map(p => `
        <div class="flex items-center gap-2 px-3 py-1.5 bg-slate-900/50 rounded-full">
          <div class="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-xs font-semibold text-white">
            ${this.getInitials(p.name)}
          </div>
          <span class="text-sm text-white">${p.name}</span>
        </div>
      `).join('');
    } else {
      participantsContainer.innerHTML = '<p class="text-sm text-slate-400">No participants</p>';
    }

    // Render notifiees
    const notifieesContainer = document.getElementById('meeting-detail-notifiees');
    if (meeting.notifiees && meeting.notifiees.length > 0) {
      notifieesContainer.innerHTML = meeting.notifiees.map(n => `
        <div class="flex items-center gap-2 px-3 py-1.5 bg-slate-900/50 rounded-full">
          <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
          <span class="text-sm text-white">${n.name}</span>
        </div>
      `).join('');
    } else {
      notifieesContainer.innerHTML = '<p class="text-sm text-slate-400">No one to notify</p>';
    }

    // Render minutes
    const minutesContainer = document.getElementById('meeting-detail-minutes');
    if (meeting.minutes) {
      minutesContainer.innerHTML = `<p class="text-sm text-white whitespace-pre-wrap">${meeting.minutes}</p>`;
      minutesContainer.onclick = () => this.openMinutesEditor();
    }else {
      minutesContainer.innerHTML = `<p class="text-sm text-slate-400 italic">No meeting minutes yet. Click to add...</p>`;
      minutesContainer.onclick = () => this.openMinutesEditor();
    }
  }

  // Open one-time meeting modal
  openOneTimeMeetingModal() {
    closeMeetingDropdown();
    window.openMeetingModal && window.openMeetingModal('one-time');
  }

  // Open recurring meeting modal
  openRecurringMeetingModal() {
    closeMeetingDropdown();
    window.openMeetingModal && window.openMeetingModal('recurring');
  }

  // Open meeting detail modal
  closeMeetingDetailModal() {
    document.getElementById('meeting-detail-modal')?.classList.add('hidden');
    this.currentMeeting = null;
  }

  // Edit participants
  editMeetingParticipants() {
    const container = document.getElementById('participants-list-edit');
    if (!container || !this.currentMeeting) return;

    const selected = this.currentMeeting.participants || [];
    
    // Get all team members
    const teamMembers = app.state.teamMembers || [];
    
    container.innerHTML = teamMembers.map(member => {
      const isSelected = selected.some(p => p.id === member.id);
      return `
        <label class="flex items-center gap-3 p-2 hover:bg-slate-700/50 rounded-lg cursor-pointer">
          <input type="checkbox" value="${member.id}" ${isSelected ? 'checked' : ''} 
            class="w-4 h-4 rounded border-slate-600 bg-slate-900 text-primary-500 focus:ring-primary-500">
          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-xs font-semibold text-white">
            ${this.getInitials(`${member.firstName} ${member.lastName}`)}
          </div>
          <span class="text-white">${member.firstName} ${member.lastName}</span>
        </label>
      `;
    }).join('');

    document.getElementById('edit-participants-modal')?.classList.remove('hidden');
  }

  // Save participants
  async saveParticipants() {
    if (!this.currentMeeting) return;

    const checkboxes = document.querySelectorAll('#participants-list-edit input[type="checkbox"]:checked');
    const participantIds = Array.from(checkboxes).map(cb => cb.value);
    
    const teamMembers = app.state.teamMembers || [];
    const participants = participantIds.map(id => {
      const member = teamMembers.find(m => m.id === id);
      return { id, name: member ? `${member.firstName} ${member.lastName}` : id };
    });

    this.currentMeeting.participants = participants;
    
    try {
      await api.updateMeeting(this.currentMeeting.id, { participants });
      this.renderMeetingDetail(this.currentMeeting);
      showToast('Participants updated successfully', 'success');
    } catch (error) {
      showToast('Failed to update participants', 'error');
    }

    this.closeEditParticipantsModal();
  }

  // Edit notifiees
  editMeetingNotifiees() {
    const container = document.getElementById('notifiees-list-edit');
    if (!container || !this.currentMeeting) return;

    const selected = this.currentMeeting.notifiees || [];
    
    const teamMembers = app.state.teamMembers || [];
    
    container.innerHTML = teamMembers.map(member => {
      const isSelected = selected.some(n => n.id === member.id);
      return `
        <label class="flex items-center gap-3 p-2 hover:bg-slate-700/50 rounded-lg cursor-pointer">
          <input type="checkbox" value="${member.id}" ${isSelected ? 'checked' : ''} 
            class="w-4 h-4 rounded border-slate-600 bg-slate-900 text-primary-500 focus:ring-primary-500">
          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-xs font-semibold text-white">
            ${this.getInitials(`${member.firstName} ${member.lastName}`)}
          </svg>
          <span class="text-white">${member.firstName} ${member.lastName}</span>
        </label>
      `;
    }).join('');

    document.getElementById('edit-notifiees-modal')?.classList.remove('hidden');
  }

  // Save notifiees
  async saveNotifiees() {
    if (!this.currentMeeting) return;

    const checkboxes = document.querySelectorAll('#notifiees-list-edit input[type="checkbox"]:checked');
    const notifieeIds = Array.from(checkboxes).map(cb => cb.value);
    
    const teamMembers = app.state.teamMembers || [];
    const notifiees = notifieeIds.map(id => {
      const member = teamMembers.find(m => m.id === id);
      return { id, name: member ? `${member.firstName} ${member.lastName}` : id };
    });

    this.currentMeeting.notifiees = notifiees;
    
    try {
      await api.updateMeeting(this.currentMeeting.id, { notifiees });
      this.renderMeetingDetail(this.currentMeeting);
      showToast('Notifiees updated successfully', 'success');
    } catch (error) {
      showToast('Failed to update notifiees', 'error');
    }

    this.closeEditNotifieesModal();
  }

  // Open minutes editor
  openMinutesEditor() {
    const editor = document.getElementById('meeting-minutes-editor');
    if (editor && this.currentMeeting) {
      editor.value = this.currentMeeting.minutes || '';
    }
    document.getElementById('minutes-editor-modal')?.classList.remove('hidden');
  }

  // Save meeting minutes
  async saveMeetingMinutes() {
    if (!this.currentMeeting) return;

    const editor = document.getElementById('meeting-minutes-editor');
    const minutes = editor?.value || '';
    
    this.currentMeeting.minutes = minutes;
    
    try {
      await api.updateMeeting(this.currentMeeting.id, { minutes });
      this.renderMeetingDetail(this.currentMeeting);
      showToast('Meeting minutes saved', 'success');
    } catch (error) {
      showToast('Failed to save meeting minutes', 'error');
    }

    this.closeMinutesEditorModal();
  }

  // Send meeting minutes
  async sendMeetingMinutes() {
    if (!this.currentMeeting || !this.currentMeeting.minutes) {
      showToast('No meeting minutes to send', 'warning');
      return;
    }

    try {
      await api.sendMeetingMinutes(this.currentMeeting.id);
      showToast('Meeting minutes sent successfully', 'success');
    } catch (error) {
      showToast('Failed to send meeting minutes', 'error');
    }
  }

  // Delete meeting
  async deleteMeeting() {
    if (!this.currentMeeting) return;
    
    if (!confirm('Are you sure you want to delete this meeting?')) return;

    try {
      await api.deleteMeeting(this.currentMeeting.id);
      showToast('Meeting deleted successfully', 'success');
      this.closeMeetingDetailModal();
      await this.loadMeetings();
    } catch (error) {
      showToast('Failed to delete meeting', 'error');
    }
  }

  // Save meeting details
  async saveMeetingDetails() {
    if (!this.currentMeeting) return;

    try {
      await api.updateMeeting(this.currentMeeting.id, this.currentMeeting);
      showToast('Meeting updated successfully', 'success');
      await this.loadMeetings();
    } catch (error) {
      showToast('Failed to update meeting', 'error');
    }

    this.closeMeetingDetailModal();
  }

  // Close modals
  closeEditParticipantsModal() {
    document.getElementById('edit-participants-modal')?.classList.add('hidden');
  }

  closeEditNotifieesModal() {
    document.getElementById('edit-notifiees-modal')?.classList.add('hidden');
  }

  closeMinutesEditorModal() {
    document.getElementById('minutes-editor-modal')?.classList.add('hidden');
  }

  // Helper methods
  calculateDuration(startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end - start;
    const diffMins = Math.round(diffMs / (1000 * 60));
    
    if (diffMins < 60) return `${diffMins} min`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  formatDate(date) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  }

  formatTime(date) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  getStatusClass(status) {
    const classes = {
      scheduled: 'bg-primary-500/20 text-primary-400',
      completed: 'bg-success/20 text-success',
      cancelled: 'bg-danger/20 text-danger'
    };
    return classes[status] || classes.scheduled;
  }
}

// Create global instance
const meetingsManager = new MeetingsManager();

// Global functions for onclick handlers
function toggleMeetingDropdown() {
  const dropdown = document.getElementById('meeting-dropdown');
  dropdown?.classList.toggle('hidden');
}

function closeMeetingDropdown() {
  const dropdown = document.getElementById('meeting-dropdown');
  dropdown?.classList.add('hidden');
}

// Global click handlers for dropdown buttons - using onclick directly in HTML
function handleOpenOneTimeMeeting(event) {
  event.preventDefault();
  event.stopPropagation();
  console.log('[Meetings] handleOpenOneTimeMeeting called');
  closeMeetingDropdown();
  window.openOneTimeMeetingModal();
}

function handleOpenRecurringMeeting(event) {
  event.preventDefault();
  event.stopPropagation();
  console.log('[Meetings] handleOpenRecurringMeeting called');
  closeMeetingDropdown();
  window.openRecurringMeetingModal();
}

function switchMeetingTab(tab) {
  // Update tab UI
  document.querySelectorAll('[id^="meeting-tab-"]').forEach(btn => {
    btn.classList.remove('bg-slate-700', 'text-white');
    btn.classList.add('text-slate-400');
    const indicator = btn.querySelector('span');
    if (indicator) indicator.remove();
  });

  const activeTab = document.getElementById(`meeting-tab-${tab}`);
  if (activeTab) {
    activeTab.classList.remove('text-slate-400');
    activeTab.classList.add('bg-slate-700', 'text-white');
    if (tab !== 'filters') {
      activeTab.innerHTML = tab.charAt(0).toUpperCase() + tab.slice(1);
    }
  }

  // Show/hide filters panel
  const filtersPanel = document.getElementById('meeting-filters-panel');
  if (filtersPanel) {
    filtersPanel.classList.toggle('hidden', tab !== 'filters');
  }

  // Update current tab and re-render
  meetingsManager.currentTab = tab;
  meetingsManager.renderMeetings();
}

// Initialize on view load
window.addEventListener('viewLoaded', (e) => {
  if (e.detail.viewName === 'meetings') {
    console.log('[Meetings] View loaded, initializing...');
    meetingsManager.init();
  }
});

// Export
window.meetingsManager = meetingsManager;

// ==================
// Modal Functions
// ==================

// Open meeting modal
window.openMeetingModal = function(type) {
  if (type === 'one-time') {
    openOneTimeMeetingModal();
  } else if (type === 'recurring') {
    openRecurringMeetingModal();
  }
};

// One-time meeting modal
window.openOneTimeMeetingModal = function() {
  console.log('[Meetings] Opening one-time meeting modal...');
  const modal = document.getElementById('one-time-meeting-modal');
  console.log('[Meetings] Modal element:', modal);
  if (modal) {
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('one-time-meeting-date');
    const timeInput = document.getElementById('one-time-meeting-time');
    if (dateInput) dateInput.value = today;
    if (timeInput) timeInput.value = '09:00';
    modal.classList.remove('hidden');
    console.log('[Meetings] Modal should be visible now');
  } else {
    console.error('[Meetings] Modal not found!');
  }
};

function closeOneTimeMeetingModal() {
  document.getElementById('one-time-meeting-modal')?.classList.add('hidden');
}
window.closeOneTimeMeetingModal = closeOneTimeMeetingModal;

async function createOneTimeMeeting(event) {
  event.preventDefault();

  const title = document.getElementById('one-time-meeting-title').value;
  const date = document.getElementById('one-time-meeting-date').value;
  const time = document.getElementById('one-time-meeting-time').value;
  const durationHours = parseFloat(document.getElementById('one-time-meeting-duration').value);
  const location = document.getElementById('one-time-meeting-location').value;
  const description = document.getElementById('one-time-meeting-description').value;

  const startTime = new Date(`${date}T${time}`);
  const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);

  try {
    const result = await api.createMeeting({
      title,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      location,
      description,
      isRecurring: false,
      status: 'scheduled'
    });

    if (result.success) {
      showToast('Meeting created successfully', 'success');
      closeOneTimeMeetingModal();
      document.getElementById('one-time-meeting-form').reset();
      meetingsManager.loadMeetings();
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    showToast('Failed to create meeting: ' + error.message, 'error');
  }
}

// Recurring meeting modal
window.openRecurringMeetingModal = function() {
  console.log('[Meetings] Opening recurring meeting modal...');
  const modal = document.getElementById('recurring-meeting-modal');
  console.log('[Meetings] Modal element:', modal);
  if (modal) {
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('recurring-meeting-start-date');
    const timeInput = document.getElementById('recurring-meeting-time');
    if (dateInput) dateInput.value = today;
    if (timeInput) timeInput.value = '09:00';
    modal.classList.remove('hidden');
    console.log('[Meetings] Modal should be visible now');
  } else {
    console.error('[Meetings] Recurring modal not found!');
  }
};

function closeRecurringMeetingModal() {
  document.getElementById('recurring-meeting-modal')?.classList.add('hidden');
}
window.closeRecurringMeetingModal = closeRecurringMeetingModal;

async function createRecurringMeeting(event) {
  event.preventDefault();

  const title = document.getElementById('recurring-meeting-title').value;
  const pattern = document.getElementById('recurring-meeting-pattern').value;
  const time = document.getElementById('recurring-meeting-time').value;
  const durationHours = parseFloat(document.getElementById('recurring-meeting-duration').value);
  const location = document.getElementById('recurring-meeting-location').value;
  const startDate = document.getElementById('recurring-meeting-start-date').value;
  const endDate = document.getElementById('recurring-meeting-end-date').value;
  const description = document.getElementById('recurring-meeting-description').value;

  const startTime = new Date(`${startDate}T${time}`);
  const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);

  try {
    const result = await api.createMeeting({
      title,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      location,
      description,
      isRecurring: true,
      recurrencePattern: pattern,
      recurrenceEndDate: endDate || null,
      status: 'scheduled'
    });

    if (result.success) {
      showToast('Recurring meeting created successfully', 'success');
      closeRecurringMeetingModal();
      document.getElementById('recurring-meeting-form').reset();
      meetingsManager.loadMeetings();
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    showToast('Failed to create recurring meeting: ' + error.message, 'error');
  }
}

// Meeting detail modal functions
function closeMeetingDetailModal() {
  meetingsManager.closeMeetingDetailModal();
}

function editMeetingParticipants() {
  meetingsManager.editMeetingParticipants();
}

function saveParticipants() {
  meetingsManager.saveParticipants();
}

function closeEditParticipantsModal() {
  meetingsManager.closeEditParticipantsModal();
}

function editMeetingNotifiees() {
  meetingsManager.editMeetingNotifiees();
}

function saveNotifiees() {
  meetingsManager.saveNotifiees();
}

function closeEditNotifieesModal() {
  meetingsManager.closeEditNotifieesModal();
}

function openMinutesEditor() {
  meetingsManager.openMinutesEditor();
}

function saveMeetingMinutes() {
  meetingsManager.saveMeetingMinutes();
}

function closeMinutesEditorModal() {
  meetingsManager.closeMinutesEditorModal();
}

function sendMeetingMinutes() {
  meetingsManager.sendMeetingMinutes();
}

function deleteMeeting() {
  meetingsManager.deleteMeeting();
}

