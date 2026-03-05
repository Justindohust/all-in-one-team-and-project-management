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

    // Recording functionality
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.recordingMeetingId = null;
    this.recordingStartTime = null;
  }

  // Initialize meetings module
  async init() {
    console.log('[Meetings] Initializing...');
    await this.loadMeetings();
    this.setupEventListeners();
    this.initWaveform();
    console.log('[Meetings] Calling attachDropdownListeners from init()...');
    this.attachDropdownListeners();
    console.log('[Meetings] init() complete');
  }

  // Initialize waveform visualizer
  initWaveform() {
    const waveformContainer = document.getElementById('mtg-waveform');
    if (!waveformContainer) return;

    // Create 32 waveform bars
    waveformContainer.innerHTML = '';
    for (let i = 0; i < 32; i++) {
      const bar = document.createElement('div');
      bar.className = 'waveform-bar inactive';
      bar.style.height = `${Math.random() * 30 + 10}px`;
      waveformContainer.appendChild(bar);
    }
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
    const recurrenceLabel = meeting.recurrencePattern ? ` • ${meeting.recurrencePattern}` : '';
    const typeBadgeClass = meeting.isRecurring ? 'bg-yellow-500/20 text-yellow-400' : 'bg-primary-500/20 text-primary-400';

    const statusClass = this.getStatusClass(meeting.status);
    const statusLabel = meeting.status || 'Scheduled';

    return `
      <div class="group bg-slate-800/40 hover:bg-slate-700/30 border border-slate-700/30 hover:border-primary-500/30 rounded-xl p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-primary-500/5" onclick="meetingsManager.openMeetingDetail('${meeting.id}')">
        <div class="flex items-center justify-between mb-2">
          <span class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${statusClass}">
            ${statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1)}
          </span>
          <span class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${typeBadgeClass}">
            ${typeLabel}
          </span>
        </div>
        <h4 class="font-semibold text-white mb-3 group-hover:text-primary-400 transition-colors text-lg">${meeting.title}</h4>
        <div class="flex items-center gap-4 text-sm">
          <span class="text-primary-400">${this.formatDate(date)}</span>
          <span class="text-slate-400">${this.formatTime(date)} - ${this.formatTime(endDate)}</span>
          <span class="text-slate-300">${duration}</span>
          <span class="text-slate-400">${meeting.location || 'Virtual'}</span>
        </div>
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
      document.getElementById('next-meeting-box')?.style.setProperty('display', 'none');
      const noMeeting = document.getElementById('no-next-meeting');
      if (noMeeting) noMeeting.style.display = 'block';
      return;
    }

    const startDate = new Date(upcoming.startTime);
    const nextMeetingBox = document.getElementById('next-meeting-box');
    const noMeeting = document.getElementById('no-next-meeting');

    if (nextMeetingBox) {
      nextMeetingBox.style.display = 'block';
      document.getElementById('next-meeting-title').textContent = upcoming.title;
      document.getElementById('next-meeting-date').textContent = `${this.formatDate(startDate)} at ${this.formatTime(startDate)}`;
      document.getElementById('next-meeting-duration').textContent = this.calculateDuration(upcoming.startTime, upcoming.endTime);
    }
    if (noMeeting) noMeeting.style.display = 'none';
  }

  // Open meeting detail modal
  async openMeetingDetail(meetingId) {
    try {
      const result = await api.getMeeting(meetingId);
      if (result.success) {
        this.currentMeeting = result.data;

        // Check recording status for this meeting
        const recordingStatus = await this.checkRecordingStatus(meetingId);

        this.renderMeetingDetail(this.currentMeeting);

        // Update recording UI based on status
        this.updateRecordingButtons(recordingStatus);

        // Initialize waveform for recording tab
        this.initWaveform();

        // Load saved recordings for this meeting
        await this.loadSavedRecordings(meetingId);

        document.getElementById('meeting-detail-modal')?.classList.remove('hidden');
      }
    } catch (error) {
      console.error('[Meetings] Failed to load meeting detail:', error);
      showToast('Failed to load meeting details', 'error');
    }
  }

  // Format time as MM:SS or HH:MM:SS
  formatDuration(seconds) {
    if (!seconds || seconds < 0) return '00:00';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Update recording buttons based on recording status
  updateRecordingButtons(recordingStatus) {
    const viewSummaryBtn = document.getElementById('meeting-recording-view-summary');
    const recordingInfo = document.getElementById('meeting-recording-info');
    const durationEl = document.getElementById('meeting-recording-duration');

    if (recordingStatus?.hasRecording && recordingStatus?.status === 'completed') {
      // Show "View Summary" button
      if (viewSummaryBtn) viewSummaryBtn.classList.remove('hidden');
      if (recordingInfo) recordingInfo.classList.remove('hidden');

      // Update duration if available
      if (durationEl && recordingStatus?.duration) {
        durationEl.textContent = this.formatDuration(recordingStatus.duration);
      }
    } else {
      // Hide "View Summary" button
      if (viewSummaryBtn) viewSummaryBtn.classList.add('hidden');
      if (recordingInfo) recordingInfo.classList.add('hidden');
    }
  }

  // Close meeting detail modal
  closeMeetingDetailModal() {
    document.getElementById('meeting-detail-modal')?.classList.add('hidden');
    this.currentMeeting = null;
  }

  // Render meeting detail
  renderMeetingDetail(meeting) {
    const startDate = new Date(meeting.startTime);
    const endDate = new Date(meeting.endTime);

    // Title (input)
    const titleInput = document.getElementById('meeting-title-input');
    if (titleInput) titleInput.value = meeting.title || '';

    // Switch meeting type toggle
    this._updateMeetingTypeToggle(meeting.isRecurring);

    // Date & Time
    const dateInput = document.getElementById('meeting-date-input');
    const startTimeInput = document.getElementById('meeting-start-time-input');
    const endTimeInput = document.getElementById('meeting-end-time-input');
    if (dateInput) dateInput.value = startDate.toISOString().split('T')[0];
    if (startTimeInput) startTimeInput.value = startDate.toTimeString().slice(0, 5);
    if (endTimeInput) endTimeInput.value = endDate.toTimeString().slice(0, 5);

    // Location
    const locationInput = document.getElementById('meeting-location-input');
    if (locationInput) locationInput.value = meeting.location || '';

    // Status
    const statusInput = document.getElementById('meeting-status-input');
    if (statusInput) {
      statusInput.value = meeting.status || 'scheduled';
      this._applyStatusColor(statusInput);
      // Add listener
      if (!statusInput._colorListenerAdded) {
        statusInput.addEventListener('change', () => this._applyStatusColor(statusInput));
        statusInput._colorListenerAdded = true;
      }
    }

    // Participants - render as simple list
    this._renderParticipantsList(meeting.participants || []);
  }

  // Update meeting type toggle
  _updateMeetingTypeToggle(isRecurring) {
    const oneTimeBtn = document.getElementById('meeting-type-onetime');
    const recurringBtn = document.getElementById('meeting-type-recurring');

    if (isRecurring) {
      if (oneTimeBtn) {
        oneTimeBtn.classList.remove('bg-primary-500', 'text-white');
        oneTimeBtn.classList.add('text-slate-400', 'hover:text-white');
      }
      if (recurringBtn) {
        recurringBtn.classList.add('bg-primary-500', 'text-white');
        recurringBtn.classList.remove('text-slate-400', 'hover:text-white');
      }
    } else {
      if (oneTimeBtn) {
        oneTimeBtn.classList.add('bg-primary-500', 'text-white');
        oneTimeBtn.classList.remove('text-slate-400', 'hover:text-white');
      }
      if (recurringBtn) {
        recurringBtn.classList.remove('bg-primary-500', 'text-white');
        recurringBtn.classList.add('text-slate-400', 'hover:text-white');
      }
    }
  }

  // Render participants as simple list with response status
  _renderParticipantsList(participants) {
    const container = document.getElementById('meeting-participants-list');
    if (!container) return;

    if (!participants || participants.length === 0) {
      container.innerHTML = '<p class="text-sm text-slate-500 text-center py-4">No participants added yet</p>';
      return;
    }

    const colors = ['bg-indigo-500', 'bg-violet-500', 'bg-sky-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'];

    container.innerHTML = participants.map((p, idx) => {
      const fullName = p.name || 'Unknown';
      const ci = fullName.charCodeAt(0) % colors.length;
      const response = p.response || 'pending';

      const responseClasses = {
        pending: 'bg-slate-600/50 text-slate-400',
        accepted: 'bg-green-500/20 text-green-400',
        declined: 'bg-red-500/20 text-red-400',
        tentative: 'bg-yellow-500/20 text-yellow-400'
      };

      const responseLabels = {
        pending: 'Pending',
        accepted: 'Going',
        declined: 'Declined',
        tentative: 'Tentative'
      };

      return `
        <div class="grid grid-cols-[1fr_200px] gap-2 items-center py-2 border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors" data-participant-id="${p.id}">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full ${colors[ci]} flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
              ${fullName.split(' ').map(n => n[0]).join('').substring(0, 2)}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-white truncate">${fullName}</p>
              ${p.email ? `<p class="text-xs text-slate-500 truncate">${p.email}</p>` : ''}
            </div>
          </div>
          <div class="flex items-center justify-center gap-2">
            <select onchange="updateParticipantResponse('${p.id}', this.value)"
              class="text-xs px-2 py-1.5 rounded-lg border-0 cursor-pointer ${responseClasses[response]} bg-slate-700">
              <option value="pending" ${response === 'pending' ? 'selected' : ''}>Pending</option>
              <option value="accepted" ${response === 'accepted' ? 'selected' : ''}>Going</option>
              <option value="declined" ${response === 'declined' ? 'selected' : ''}>Declined</option>
              <option value="tentative" ${response === 'tentative' ? 'selected' : ''}>Tentative</option>
            </select>
            <button type="button" onclick="removeParticipant('${p.id}')"
              class="p-1 text-slate-500 hover:text-red-400 transition-colors" title="Remove">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // Handle participant checkbox change
  _onParticipantCheckboxChange(checkbox) {
    if (!this.currentMeeting) return;

    this.currentMeeting.participants = this.currentMeeting.participants || [];
    const memberId = checkbox.value;
    const memberName = checkbox.dataset.name;

    if (checkbox.checked) {
      this.currentMeeting.participants.push({ id: memberId, name: memberName });
    } else {
      const idx = this.currentMeeting.participants.findIndex(p => String(p.id) === String(memberId));
      if (idx !== -1) this.currentMeeting.participants.splice(idx, 1);
    }

    // Re-render to update checkmarks
    this._renderParticipantsList(this.currentMeeting.participants);
  }

  // Apply color class to status badge-select
  _applyStatusColor(select) {
    select.classList.remove('status-scheduled', 'status-in_progress', 'status-completed', 'status-cancelled');
    select.classList.add(`status-${select.value}`);
    select.classList.add('meeting-status-badge');

    // Also update the status indicator dot
    const indicator = document.getElementById('meeting-status-indicator');
    if (indicator) {
      indicator.classList.remove('status-scheduled', 'status-in_progress', 'status-completed', 'status-cancelled');
      indicator.classList.add(`status-${select.value}`);
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
    document.getElementById('participants-inline-dropdown')?.classList.add('hidden');
    document.getElementById('notifiees-inline-dropdown')?.classList.add('hidden');
    this.currentMeeting = null;
  }

  // Toggle inline people dropdown (participants / notifiees)
  toggleInlineDropdown(type, event) {
    if (event) event.stopPropagation();
    const dropdownId = type === 'participants' ? 'participants-inline-dropdown' : 'notifiees-inline-dropdown';
    const otherDropdownId = type === 'participants' ? 'notifiees-inline-dropdown' : 'participants-inline-dropdown';

    document.getElementById(otherDropdownId)?.classList.add('hidden');
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;
    dropdown.classList.toggle('hidden');

    // Focus search input when opening
    if (!dropdown.classList.contains('hidden')) {
      dropdown.querySelector('input[type="text"]')?.focus();
    }
  }

  // Filter dropdown checkboxes by search query
  filterInlineDropdown(type, query) {
    const listId = type === 'participants' ? 'participants-list-edit' : 'notifiees-list-edit';
    const list = document.getElementById(listId);
    if (!list) return;
    const q = query.toLowerCase();
    list.querySelectorAll('label').forEach(label => {
      const name = label.querySelector('span')?.textContent?.toLowerCase() || '';
      label.style.display = name.includes(q) ? '' : 'none';
    });
  }

  // Edit participants (legacy — now delegates to inline dropdown)
  editMeetingParticipants() {
    this.toggleInlineDropdown('participants', null);
  }

  // Save participants (called for backward compat; state already updated live via checkboxes)
  async saveParticipants() {
    if (!this.currentMeeting) return;
    try {
      await api.updateMeeting(this.currentMeeting.id, { participants: this.currentMeeting.participants });
      showToast('Participants updated', 'success');
    } catch (error) {
      showToast('Failed to update participants', 'error');
    }
    document.getElementById('participants-inline-dropdown')?.classList.add('hidden');
  }

  // Edit notifiees (legacy — now delegates to inline dropdown)
  editMeetingNotifiees() {
    this.toggleInlineDropdown('notifiees', null);
  }

  // Save notifiees (called for backward compat; state already updated live via checkboxes)
  async saveNotifiees() {
    if (!this.currentMeeting) return;
    try {
      await api.updateMeeting(this.currentMeeting.id, { notifiees: this.currentMeeting.notifiees });
      showToast('Notifiees updated', 'success');
    } catch (error) {
      showToast('Failed to update notifiees', 'error');
    }
    document.getElementById('notifiees-inline-dropdown')?.classList.add('hidden');
  }

  // Open minutes editor (no-op — minutes are now edited inline)
  openMinutesEditor() { /* inline editing — no popup needed */ }

  // Save meeting minutes (no-op — included in saveMeetingDetails)
  async saveMeetingMinutes() { /* inline editing — use Save Changes */ }

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

  // Save meeting details - collect all inline field values
  async saveMeetingDetails() {
    if (!meetingsManager.currentMeeting) return;

    const meeting = meetingsManager.currentMeeting;

    // Title (input)
    const titleInput = document.getElementById('meeting-title-input');
    if (titleInput) meeting.title = titleInput.value.trim() || meeting.title;

    // Meeting type (from toggle)
    const oneTimeBtn = document.getElementById('meeting-type-onetime');
    meeting.isRecurring = oneTimeBtn && !oneTimeBtn.classList.contains('bg-primary-500');

    // Date & Time
    const dateInput = document.getElementById('meeting-date-input');
    const startTimeInput = document.getElementById('meeting-start-time-input');
    const endTimeInput = document.getElementById('meeting-end-time-input');
    if (dateInput?.value && startTimeInput?.value) {
      meeting.startTime = new Date(`${dateInput.value}T${startTimeInput.value}`).toISOString();
    }
    if (dateInput?.value && endTimeInput?.value) {
      meeting.endTime = new Date(`${dateInput.value}T${endTimeInput.value}`).toISOString();
    }

    // Location
    const locationInput = document.getElementById('meeting-location-input');
    if (locationInput) meeting.location = locationInput.value;

    // Status
    const statusInput = document.getElementById('meeting-status-input');
    if (statusInput) meeting.status = statusInput.value;

    // Participants - already updated via checkboxes

    try {
      await api.updateMeeting(meeting.id, meeting);
      showToast('Meeting saved successfully', 'success');
      meetingsManager.closeMeetingDetailModal();
      await meetingsManager.loadMeetings();
    } catch (error) {
      console.error('Failed to save meeting:', error);
      showToast('Failed to save meeting', 'error');
    }
  }

  // Close modals
  closeEditParticipantsModal() {
    document.getElementById('participants-inline-dropdown')?.classList.add('hidden');
  }

  closeEditNotifieesModal() {
    document.getElementById('notifiees-inline-dropdown')?.classList.add('hidden');
  }

  closeMinutesEditorModal() { /* no-op — minutes are now inline */ }

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
      scheduled: 'bg-indigo-500/20 text-indigo-400',
      in_progress: 'bg-yellow-500/20 text-yellow-400',
      completed: 'bg-green-500/20 text-green-400',
      cancelled: 'bg-red-500/20 text-red-400'
    };
    return classes[status] || classes.scheduled;
  }

  // ==================
  // Recording Methods
  // ==================

  // Check if browser supports audio recording
  checkMediaRecorderSupport() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  // Start recording audio for a meeting
  async startRecording(meetingId) {
    if (this.isRecording) {
      showToast('Already recording', 'warning');
      return false;
    }

    if (!this.checkMediaRecorderSupport()) {
      showToast('Your browser does not support audio recording', 'error');
      return false;
    }

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create MediaRecorder
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.audioChunks = [];
      this.recordingMeetingId = meetingId;
      this.recordingStartTime = Date.now();

      // Handle data available event
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      // Handle recording stop
      this.mediaRecorder.onstop = async () => {
        console.log('[Meetings] Recording stopped, processing...');
        await this.processRecording();
      };

      // Start recording
      this.mediaRecorder.start(1000); // Collect data every second
      this.isRecording = true;

      // Start timer
      this.startRecordingTimer();

      // Update UI
      this.updateRecordingUI(true);

      // Start waveform animation
      this.startWaveformAnimation();

      showToast('Recording started', 'success');
      console.log('[Meetings] Recording started for meeting:', meetingId);

      return true;
    } catch (error) {
      console.error('[Meetings] Failed to start recording:', error);
      showToast('Failed to start recording: ' + error.message, 'error');
      return false;
    }
  }

  // Stop recording
  stopRecording() {
    if (!this.isRecording || !this.mediaRecorder) {
      showToast('No active recording', 'warning');
      return false;
    }

    try {
      this.mediaRecorder.stop();

      // Stop all tracks to release microphone
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());

      this.isRecording = false;

      // Stop timer
      this.stopRecordingTimer();

      // Update UI
      this.updateRecordingUI(false);

      // Stop waveform animation
      this.stopWaveformAnimation();

      showToast('Recording stopped, processing...', 'info');
      console.log('[Meetings] Recording stopped');

      return true;
    } catch (error) {
      console.error('[Meetings] Failed to stop recording:', error);
      showToast('Failed to stop recording', 'error');
      return false;
    }
  }

  // Process the recorded audio
  async processRecording() {
    if (this.audioChunks.length === 0) {
      showToast('No audio data recorded', 'error');
      return false;
    }

    try {
      // Create audio blob
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });

      // Convert to base64
      const audioData = await this.blobToBase64(audioBlob);

      // Calculate duration
      const duration = Math.round((Date.now() - this.recordingStartTime) / 1000);

      // Show processing indicator in UI
      this.showProcessingIndicator();

      // Upload to server (audio stored only, no AI processing)
      const meetingTitle = this.currentMeeting?.title || `Meeting ${this.recordingMeetingId}`;
      const result = await api.uploadRecording(
        this.recordingMeetingId,
        audioData,
        duration
      );

      if (result.success) {
        showToast('Recording saved successfully! You can now add meeting notes and generate AI summary.', 'success');

        // Reload meeting to get updated data
        await this.loadMeetings();

        // Load and display saved recordings
        await this.loadSavedRecordings(this.recordingMeetingId);

        // Switch to Summary tab to let user add notes and generate AI summary
        switchMeetingContentTab('summary');

        return true;
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      console.error('[Meetings] Failed to process recording:', error);
      showToast('Failed to process recording: ' + error.message, 'error');
      return false;
    } finally {
      // Reset recording state
      this.audioChunks = [];
      this.recordingMeetingId = null;
      this.recordingStartTime = null;
    }
  }

  // Show processing indicator in UI
  showProcessingIndicator() {
    const container = document.getElementById('saved-recordings-container');
    const list = document.getElementById('saved-recordings-list');

    if (!container || !list) return;

    container.classList.remove('hidden');
    list.innerHTML = `
      <div class="recording-processing">
        <div class="spinner"></div>
        <span>Processing recording... Please wait.</span>
      </div>
    `;
  }

  // Load saved recordings for a meeting
  async loadSavedRecordings(meetingId) {
    try {
      const result = await api.getRecording(meetingId);

      // Hide container if no recording exists (404 is normal)
      if (!result.success && result.message?.includes('No recording found')) {
        const container = document.getElementById('saved-recordings-container');
        if (container) container.classList.add('hidden');
        return;
      }

      this.displaySavedRecordings(result);
    } catch (error) {
      console.error('[Meetings] Failed to load saved recordings:', error);
      // Silently fail - no recording is not an error
    }
  }

  // Display saved recordings in UI
  displaySavedRecordings(recording) {
    const container = document.getElementById('saved-recordings-container');
    const list = document.getElementById('saved-recordings-list');

    if (!container || !list) return;

    if (!recording || !recording.success) {
      container.classList.add('hidden');
      return;
    }

    const data = recording.data;
    const createdDate = new Date(data.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const durationMinutes = Math.floor(data.duration_seconds / 60);
    const durationSeconds = data.duration_seconds % 60;
    const durationStr = `${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`;

    // Status badge
    let statusBadge = '';
    if (data.status === 'processing') {
      statusBadge = `<span class="px-2 py-0.5 text-xs rounded-full bg-yellow-500/20 text-yellow-400">Processing</span>`;
    } else if (data.status === 'completed') {
      statusBadge = `<span class="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400">Ready</span>`;
    } else if (data.status === 'failed') {
      statusBadge = `<span class="px-2 py-0.5 text-xs rounded-full bg-red-500/20 text-red-400">Failed</span>`;
    }

    container.classList.remove('hidden');
    list.innerHTML = `
      <div class="saved-recording-item">
        <div class="saved-recording-info">
          <div class="saved-recording-icon">
            <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
            </svg>
          </div>
          <div class="saved-recording-details">
            <h6 class="font-medium">Meeting Recording</h6>
            <p class="flex items-center gap-2">
              <span>${createdDate}</span>
              <span>•</span>
              <span>${durationStr}</span>
              ${statusBadge}
            </p>
          </div>
        </div>
        <div class="saved-recording-actions">
          ${data.status === 'completed' ? `
            <button onclick="meetingsManager.downloadRecording('${data.id}')" class="saved-recording-btn download" title="Download">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
            </button>
          ` : ''}
          <button onclick="meetingsManager.deleteRecording('${data.id}')" class="saved-recording-btn delete" title="Delete">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  // Download recording
  async downloadRecording(recordingId) {
    try {
      showToast('Preparing download...', 'info');
      // TODO: Implement download functionality
      showToast('Download started', 'success');
    } catch (error) {
      console.error('[Meetings] Failed to download recording:', error);
      showToast('Failed to download recording', 'error');
    }
  }

  // Delete recording
  async deleteRecording(recordingId) {
    if (!confirm('Are you sure you want to delete this recording?')) {
      return;
    }

    try {
      const result = await api.deleteRecording(recordingId);
      if (result.success) {
        showToast('Recording deleted', 'success');

        // Reload recordings
        if (this.currentMeeting) {
          await this.loadSavedRecordings(this.currentMeeting.id);
        }
      } else {
        throw new Error(result.message || 'Delete failed');
      }
    } catch (error) {
      console.error('[Meetings] Failed to delete recording:', error);
      showToast('Failed to delete recording: ' + error.message, 'error');
    }
  }

  // Convert blob to base64
  blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Remove data URL prefix to get just the base64 data
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Recording timer interval
  recordingTimerInterval = null;

  // Format time as MM:SS
  // Start recording timer
  startRecordingTimer() {
    const timerEl = document.getElementById('meeting-recording-timer');
    const timeEl = document.getElementById('meeting-recording-time');
    const pulseEl = document.getElementById('meeting-recording-pulse');

    if (!timerEl || !timeEl) return;

    let elapsedSeconds = 0;

    // Show timer
    timerEl.classList.remove('hidden');
    if (pulseEl) pulseEl.classList.remove('hidden');

    // Update time every second
    this.recordingTimerInterval = setInterval(() => {
      elapsedSeconds++;
      timeEl.textContent = this.formatDuration(elapsedSeconds);
    }, 1000);
  }

  // Stop recording timer
  stopRecordingTimer() {
    if (this.recordingTimerInterval) {
      clearInterval(this.recordingTimerInterval);
      this.recordingTimerInterval = null;
    }

    const timerEl = document.getElementById('meeting-recording-timer');
    const pulseEl = document.getElementById('meeting-recording-pulse');
    const timeEl = document.getElementById('meeting-recording-time');

    if (timerEl) timerEl.classList.add('hidden');
    if (pulseEl) pulseEl.classList.add('hidden');
    if (timeEl) timeEl.textContent = '00:00';
  }

  // Waveform animation
  waveformInterval = null;

  // Start waveform animation
  startWaveformAnimation() {
    const waveformBars = document.querySelectorAll('.waveform-bar');
    if (waveformBars.length === 0) return;

    // Initialize bars
    waveformBars.forEach(bar => {
      bar.classList.remove('inactive');
      bar.classList.add('active');
    });

    // Animate bars with random heights
    this.waveformInterval = setInterval(() => {
      waveformBars.forEach((bar, index) => {
        if (bar.classList.contains('active')) {
          const randomHeight = Math.floor(Math.random() * 40) + 10;
          bar.style.height = `${randomHeight}px`;
        }
      });
    }, 150);
  }

  // Stop waveform animation
  stopWaveformAnimation() {
    if (this.waveformInterval) {
      clearInterval(this.waveformInterval);
      this.waveformInterval = null;
    }

    const waveformBars = document.querySelectorAll('.waveform-bar');
    waveformBars.forEach(bar => {
      bar.classList.add('inactive');
      bar.classList.remove('active');
      bar.style.height = '';
    });
  }

  // Update recording UI
  updateRecordingUI(isRecording) {
    const btn = document.getElementById('mtg-record-btn');
    const btnText = document.getElementById('mtg-record-btn-text');
    const statusText = document.querySelector('.recording-status-text');
    const timerEl = document.getElementById('meeting-recording-timer');

    if (btn) {
      if (isRecording) {
        btn.classList.add('recording');
        btn.innerHTML = `
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
          Stop Recording
        `;
      } else {
        btn.classList.remove('recording');
        btn.innerHTML = `
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/></svg>
          Start Recording
        `;
      }
    }

    if (statusText) {
      if (isRecording) {
        statusText.textContent = 'Recording...';
        statusText.classList.add('text-red-500');
        statusText.classList.remove('text-slate-400');
      } else {
        statusText.textContent = 'Not recording';
        statusText.classList.remove('text-red-500');
        statusText.classList.add('text-slate-400');
      }
    }

    // Volume meter animation
    const volumeBars = document.querySelectorAll('.volume-bar');
    volumeBars.forEach(bar => {
      if (isRecording) {
        bar.classList.remove('inactive');
        bar.classList.add('active');
      } else {
        bar.classList.add('inactive');
        bar.classList.remove('active');
      }
    });
  }

  // Show summary modal
  showSummaryModal(summary) {
    // Create or update summary modal
    let modal = document.getElementById('meeting-summary-modal');

    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'meeting-summary-modal';
      modal.className = 'fixed inset-0 z-50 hidden';
      modal.innerHTML = `
        <div class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onclick="this.parentElement.classList.add('hidden')"></div>
        <div class="fixed inset-0 overflow-y-auto">
          <div class="flex min-h-full items-center justify-center p-4">
            <div class="w-full max-w-2xl bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden" onclick="event.stopPropagation()">
              <div class="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
                <h3 class="text-lg font-semibold text-white">Meeting Summary</h3>
                <button onclick="document.getElementById('meeting-summary-modal').classList.add('hidden')" class="text-slate-400 hover:text-white">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              <div class="px-6 py-4 max-h-[60vh] overflow-y-auto">
                <div id="meeting-summary-content" class="prose prose-invert prose-sm"></div>
              </div>
              <div class="px-6 py-4 border-t border-slate-700 flex justify-end gap-2">
                <button onclick="document.getElementById('meeting-summary-modal').classList.add('hidden')" class="px-4 py-2 text-slate-300 hover:text-white">Close</button>
                <button onclick="meetingsManager.downloadSummary()" class="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg">Download</button>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    // Set summary content
    const contentEl = document.getElementById('meeting-summary-content');
    if (contentEl) {
      // Convert markdown-like text to HTML
      contentEl.innerHTML = this.formatSummaryAsHtml(summary);
    }

    // Store current summary for download
    this.currentSummary = summary;

    // Show modal
    modal.classList.remove('hidden');
  }

  // Format summary as HTML
  formatSummaryAsHtml(summary) {
    if (!summary) return '<p class="text-slate-400">No summary available</p>';

    // Basic formatting - convert markdown-like syntax to HTML
    let html = summary
      // Escape HTML
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Headers
      .replace(/^### (.+)$/gm, '<h4 class="text-white font-semibold mt-4 mb-2">$1</h4>')
      .replace(/^## (.+)$/gm, '<h3 class="text-white font-semibold mt-4 mb-2">$1</h3>')
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Bullet points
      .replace(/^- (.+)$/gm, '<li class="text-slate-300 ml-4">$1</li>')
      // Numbered lists
      .replace(/^\d+\. (.+)$/gm, '<li class="text-slate-300 ml-4">$1</li>')
      // Line breaks
      .replace(/\n\n/g, '</p><p class="text-slate-300 mb-2">')
      .replace(/\n/g, '<br>');

    return `<p class="text-slate-300 mb-2">${html}</p>`;
  }

  // Download summary as text file
  downloadSummary() {
    if (!this.currentSummary) {
      showToast('No summary to download', 'warning');
      return;
    }

    const blob = new Blob([this.currentSummary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting-summary-${this.recordingMeetingId || 'unknown'}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Summary downloaded', 'success');
  }

  // Check recording status for a meeting
  async checkRecordingStatus(meetingId) {
    try {
      const result = await api.getRecordingStatus(meetingId);
      return result.data;
    } catch (error) {
      console.error('[Meetings] Failed to check recording status:', error);
      return { hasRecording: false, status: null };
    }
  }

  // Get recording details for a meeting
  async getRecordingDetails(meetingId) {
    try {
      const result = await api.getRecording(meetingId);
      return result.data;
    } catch (error) {
      console.error('[Meetings] Failed to get recording details:', error);
      return null;
    }
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

function switchMeetingType(type) {
  const oneTimeBtn = document.getElementById('meeting-type-onetime');
  const recurringBtn = document.getElementById('meeting-type-recurring');

  if (type === 'one-time') {
    if (oneTimeBtn) {
      oneTimeBtn.classList.add('bg-primary-500', 'text-white');
      oneTimeBtn.classList.remove('text-slate-400', 'hover:text-white');
    }
    if (recurringBtn) {
      recurringBtn.classList.remove('bg-primary-500', 'text-white');
      recurringBtn.classList.add('text-slate-400', 'hover:text-white');
    }
  } else {
    if (oneTimeBtn) {
      oneTimeBtn.classList.remove('bg-primary-500', 'text-white');
      oneTimeBtn.classList.add('text-slate-400', 'hover:text-white');
    }
    if (recurringBtn) {
      recurringBtn.classList.add('bg-primary-500', 'text-white');
      recurringBtn.classList.remove('text-slate-400', 'hover:text-white');
    }
  }
}

function toggleMeetingParticipantsDropdown() {
  const list = document.getElementById('meeting-participants-list');
  if (list) {
    list.classList.toggle('hidden');
  }
}
window.toggleMeetingParticipantsDropdown = toggleMeetingParticipantsDropdown;

function editMeetingParticipants() {
  meetingsManager.toggleInlineDropdown('participants', null);
}

function saveParticipants() {
  meetingsManager.saveParticipants();
}

function closeEditParticipantsModal() {
  meetingsManager.closeEditParticipantsModal();
}

function editMeetingNotifiees() {
  meetingsManager.toggleInlineDropdown('notifiees', null);
}

function saveNotifiees() {
  meetingsManager.saveNotifiees();
}

function closeEditNotifieesModal() {
  meetingsManager.closeEditNotifieesModal();
}

function openMinutesEditor() { /* inline — no-op */ }

function saveMeetingMinutes() { /* inline — no-op */ }

function saveMeetingDetails() {
  meetingsManager.saveMeetingDetails();
}
window.saveMeetingDetails = saveMeetingDetails;

function closeMinutesEditorModal() { /* no-op */ }

function sendMeetingMinutes() {
  meetingsManager.sendMeetingMinutes();
}

function deleteMeeting() {
  meetingsManager.deleteMeeting();
}
window.deleteMeeting = deleteMeeting;

function closeMeetingDetailModal() {
  meetingsManager.closeMeetingDetailModal();
}
window.closeMeetingDetailModal = closeMeetingDetailModal;

// ==================
// Rich Text Formatting
// ==================

function formatMeetingMinutes(command, value) {
  const minutesEl = document.getElementById('meeting-detail-minutes');
  if (!minutesEl) return;
  minutesEl.focus();
  document.execCommand(command, false, value || null);
}

// ==================
// Inline People Dropdown
// ==================

function toggleMeetingInlineDropdown(type, event) {
  meetingsManager.toggleInlineDropdown(type, event);
}

function filterMeetingDropdown(type, query) {
  meetingsManager.filterInlineDropdown(type, query);
}

// Close inline dropdowns when clicking outside
document.addEventListener('click', function(e) {
  const participantsArea = document.getElementById('meeting-detail-participants');
  const participantsDropdown = document.getElementById('participants-inline-dropdown');
  const notifieesArea = document.getElementById('meeting-detail-notifiees');
  const notifieesDropdown = document.getElementById('notifiees-inline-dropdown');

  if (participantsDropdown && !participantsDropdown.classList.contains('hidden')) {
    if (!participantsDropdown.contains(e.target) && !participantsArea?.contains(e.target)) {
      participantsDropdown.classList.add('hidden');
    }
  }
  if (notifieesDropdown && !notifieesDropdown.classList.contains('hidden')) {
    if (!notifieesDropdown.contains(e.target) && !notifieesArea?.contains(e.target)) {
      notifieesDropdown.classList.add('hidden');
    }
  }
});

// ==================
// Auto-save on field changes (live update currentMeeting state)
// ==================

document.addEventListener('DOMContentLoaded', function() {
  setTimeout(() => {
    const modal = document.getElementById('meeting-detail-modal');
    if (!modal) return;

    // On any input change inside the modal, sync to currentMeeting in memory
    modal.addEventListener('input', () => {
      if (meetingsManager.currentMeeting) updateCurrentMeetingFromFields();
    });
    modal.addEventListener('change', () => {
      if (meetingsManager.currentMeeting) updateCurrentMeetingFromFields();
    });
  }, 800);
});

function updateCurrentMeetingFromFields() {
  if (!meetingsManager.currentMeeting) return;
  const m = meetingsManager.currentMeeting;

  // Title (contenteditable)
  const titleEl = document.getElementById('meeting-title-display');
  if (titleEl) m.title = titleEl.textContent.trim() || m.title;

  // Date & Time
  const dateEl = document.getElementById('meeting-date-input');
  const startEl = document.getElementById('meeting-start-time-input');
  const endEl = document.getElementById('meeting-end-time-input');
  if (dateEl?.value && startEl?.value) {
    m.startTime = new Date(`${dateEl.value}T${startEl.value}`).toISOString();
  }
  if (dateEl?.value && endEl?.value) {
    m.endTime = new Date(`${dateEl.value}T${endEl.value}`).toISOString();
  }

  // Duration overrides end time
  const durEl = document.getElementById('meeting-duration-input');
  if (durEl?.value && m.startTime) {
    const dur = parseInt(durEl.value);
    m.endTime = new Date(new Date(m.startTime).getTime() + dur * 60000).toISOString();
  }

  // Location
  const locEl = document.getElementById('meeting-location-input');
  if (locEl) m.location = locEl.value;

  // Status
  const statEl = document.getElementById('meeting-status-input');
  if (statEl) m.status = statEl.value;

  // Minutes
  const minEl = document.getElementById('meeting-detail-minutes');
  if (minEl) m.minutes = minEl.innerHTML;
}

// ==================
// Recording Functions (Global)
// ==================

function startMeetingRecording() {
  if (!meetingsManager.currentMeeting) {
    showToast('No meeting selected', 'warning');
    return;
  }
  meetingsManager.startRecording(meetingsManager.currentMeeting.id);
}

function stopMeetingRecording() {
  meetingsManager.stopRecording();
}

function showMeetingSummary() {
  // Check if there's a recording for this meeting
  if (!meetingsManager.currentMeeting) {
    showToast('No meeting selected', 'warning');
    return;
  }

  meetingsManager.getRecordingDetails(meetingsManager.currentMeeting.id).then(recording => {
    if (recording?.summary) {
      meetingsManager.showSummaryModal(recording.summary);
    } else {
      showToast('No summary available for this meeting', 'info');
    }
  });
}

function downloadMeetingSummary() {
  meetingsManager.downloadSummary();
}

// ==================
// Global functions for Meeting Detail Modal UI
// ==================

// Switch between content tabs (Details, Participants, Recording, Attachments, Summary)
window.switchMeetingContentTab = function(tabName) {
  // Hide all tab contents
  document.querySelectorAll('.mtg-tab-content').forEach(el => el.classList.remove('active'));
  // Deactivate all tabs
  document.querySelectorAll('.mtg-tab').forEach(el => el.classList.remove('active'));

  // Activate selected tab and content
  const contentEl = document.getElementById(`mtg-content-${tabName}`);
  const tabEl = document.getElementById(`mtg-tab-${tabName}`);
  if (contentEl) contentEl.classList.add('active');
  if (tabEl) tabEl.classList.add('active');
};

// Switch meeting type toggle (One-time / Recurring)
window.switchMeetingType = function(type) {
  document.querySelectorAll('.mtg-type-toggle button').forEach(btn => {
    btn.classList.remove('active', 'bg-primary-500', 'text-white');
    btn.classList.add('text-slate-400');
  });
  const selectedBtn = document.getElementById(`meeting-type-${type}`);
  if (selectedBtn) {
    selectedBtn.classList.add('active', 'bg-primary-500', 'text-white');
    selectedBtn.classList.remove('text-slate-400');
  }
};

// Toggle recording button and visualization
window.toggleRecording = async function() {
  if (!meetingsManager.currentMeeting) {
    showToast('No meeting selected', 'warning');
    return;
  }

  if (meetingsManager.isRecording) {
    // Stop recording
    meetingsManager.stopRecording();
  } else {
    // Start recording
    await meetingsManager.startRecording(meetingsManager.currentMeeting.id);
  }
};

// ==================
// Participant Search & Response Functions
// ==================

// Search and add participant from input
window.addParticipantFromSearch = function() {
  const searchInput = document.getElementById('meeting-participants-search');
  const searchResults = document.getElementById('meeting-participants-search-results');
  if (!searchInput || !searchResults) return;

  const query = searchInput.value.trim().toLowerCase();
  if (!query) return;

  const teamMembers = (window.app && app.state && app.state.teamMembers) || [];
  const matchingMember = teamMembers.find(m => {
    const fullName = `${m.firstName} ${m.lastName}`.toLowerCase();
    return fullName === query || m.email?.toLowerCase() === query;
  });

  if (matchingMember && meetingsManager.currentMeeting) {
    // Add participant with default response status
    meetingsManager.currentMeeting.participants = meetingsManager.currentMeeting.participants || [];
    const exists = meetingsManager.currentMeeting.participants.some(p => String(p.id) === String(matchingMember.id));

    if (!exists) {
      meetingsManager.currentMeeting.participants.push({
        id: matchingMember.id,
        name: `${matchingMember.firstName} ${matchingMember.lastName}`,
        email: matchingMember.email,
        response: 'pending' // pending, accepted, declined, tentative
      });
      meetingsManager._renderParticipantsList(meetingsManager.currentMeeting.participants);
      searchInput.value = '';
      searchResults.classList.add('hidden');
      searchResults.innerHTML = '';
      showToast(`Added ${matchingMember.firstName} ${matchingMember.lastName}`, 'success');
    } else {
      showToast('Participant already added', 'warning');
    }
  } else if (!matchingMember) {
    // Show search results
    const filtered = teamMembers.filter(m => {
      const fullName = `${m.firstName} ${m.lastName}`.toLowerCase();
      return fullName.includes(query) || m.email?.toLowerCase().includes(query);
    });

    if (filtered.length > 0) {
      searchResults.innerHTML = filtered.slice(0, 5).map(member => {
        const fullName = `${member.firstName} ${member.lastName}`;
        return `
          <button type="button"
            onclick="addParticipantById('${member.id}')"
            class="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700/50 cursor-pointer transition-colors text-left">
            <div class="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-semibold">
              ${member.firstName[0]}${member.lastName[0]}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-white truncate">${fullName}</p>
              <p class="text-xs text-slate-500 truncate">${member.email || ''}</p>
            </div>
          </button>
        `;
      }).join('');
      searchResults.classList.remove('hidden');
    } else {
      searchResults.innerHTML = '<p class="text-sm text-slate-500 p-2">No members found</p>';
      searchResults.classList.remove('hidden');
    }
  }
};

// Add participant by ID
window.addParticipantById = function(memberId) {
  const teamMembers = (window.app && app.state && app.state.teamMembers) || [];
  const member = teamMembers.find(m => String(m.id) === String(memberId));

  if (member && meetingsManager.currentMeeting) {
    meetingsManager.currentMeeting.participants = meetingsManager.currentMeeting.participants || [];
    const exists = meetingsManager.currentMeeting.participants.some(p => String(p.id) === String(memberId));

    if (!exists) {
      meetingsManager.currentMeeting.participants.push({
        id: member.id,
        name: `${member.firstName} ${member.lastName}`,
        email: member.email,
        response: 'pending'
      });
      meetingsManager._renderParticipantsList(meetingsManager.currentMeeting.participants);
      showToast(`Added ${member.firstName} ${member.lastName}`, 'success');
    }
  }

  // Clear search
  const searchInput = document.getElementById('meeting-participants-search');
  const searchResults = document.getElementById('meeting-participants-search-results');
  if (searchInput) searchInput.value = '';
  if (searchResults) {
    searchResults.classList.add('hidden');
    searchResults.innerHTML = '';
  }
};

// Clear participant search
window.clearParticipantSearch = function() {
  const searchInput = document.getElementById('meeting-participants-search');
  const searchResults = document.getElementById('meeting-participants-search-results');
  if (searchInput) searchInput.value = '';
  if (searchResults) {
    searchResults.classList.add('hidden');
    searchResults.innerHTML = '';
  }
};

// Update participant response status
window.updateParticipantResponse = function(participantId, response) {
  if (!meetingsManager.currentMeeting || !meetingsManager.currentMeeting.participants) return;

  const participant = meetingsManager.currentMeeting.participants.find(p => String(p.id) === String(participantId));
  if (participant) {
    participant.response = response;
    meetingsManager._renderParticipantsList(meetingsManager.currentMeeting.participants);
  }
};

// Remove participant
window.removeParticipant = function(participantId) {
  if (!meetingsManager.currentMeeting || !meetingsManager.currentMeeting.participants) return;

  const idx = meetingsManager.currentMeeting.participants.findIndex(p => String(p.id) === String(participantId));
  if (idx !== -1) {
    const removed = meetingsManager.currentMeeting.participants.splice(idx, 1)[0];
    meetingsManager._renderParticipantsList(meetingsManager.currentMeeting.participants);
    showToast(`Removed ${removed.name}`, 'success');
  }
};

// Render participants list with response status
window.meetingsManager?._renderParticipantsList;

// Generate AI Summary - Opens browser with meeting notes
window.generateAISummary = async function() {
  const summaryEditor = document.getElementById('meeting-summary-editor');
  const conclusionsEditor = document.getElementById('meeting-conclusions-editor');
  const outputSection = document.getElementById('mtg-ai-summary-output');
  const outputContent = document.getElementById('mtg-ai-summary-content');
  const buttonSection = document.getElementById('mtg-ai-summary-section');

  if (!summaryEditor) {
    showToast('Summary editor not found', 'error');
    return;
  }

  // Get text content from editors
  const summaryText = summaryEditor.innerText || summaryEditor.textContent || '';
  const conclusionsText = conclusionsEditor?.innerText || conclusionsEditor?.textContent || '';

  // Combine text for AI processing
  let combinedText = summaryText;
  if (conclusionsText) {
    combinedText += '\n\n=== CONCLUSIONS & ACTION ITEMS ===\n' + conclusionsText;
  }

  if (combinedText.trim().length < 20) {
    showToast('Please add meeting notes first before generating summary', 'warning');
    return;
  }

  // Show instruction dialog
  const instructions = `Follow these steps:

1. A new browser tab will open with Google AI Studio
2. Your meeting notes are already copied to clipboard
3. Press Ctrl+V to paste the notes
4. Ask AI to summarize: "Please summarize these meeting notes with: Key Topics, Decisions, Action Items"
5. Copy the AI response
6. Come back here and paste the summary

Click OK to open Google AI Studio.`;

  if (!confirm(instructions)) {
    return;
  }

  try {
    // Copy notes to clipboard
    await navigator.clipboard.writeText(combinedText);
    showToast('Meeting notes copied! Opening AI Studio...', 'info');

    // Open Google AI Studio in new tab
    window.open('https://aistudio.google.com/app/chats', '_blank');

    // Show output section with instructions
    outputSection.classList.remove('hidden');
    outputContent.innerHTML = `
      <div class="text-yellow-400 mb-4">
        <p class="font-medium mb-2">📋 Follow these steps:</p>
        <ol class="list-decimal list-inside space-y-1 text-slate-300">
          <li>Paste your notes in AI Studio (Ctrl+V)</li>
          <li>Ask: "Summarize with Key Topics, Decisions, Action Items"</li>
          <li>Copy the AI response</li>
          <li>Paste it here in the summary editor</li>
        </ol>
      </div>
      <div class="mt-4">
        <button onclick="showToast('Notes copied!', 'success')" class="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm">
          📋 Copy Notes Again
        </button>
      </div>
    `;

  } catch (error) {
    console.error('[Meetings] AI Summary error:', error);
    showToast('Failed to copy notes: ' + error.message, 'error');
  }
};

// Save AI Summary manually
window.saveAISummary = async function() {
  const outputContent = document.getElementById('mtg-ai-summary-content');
  const summaryText = outputContent.innerText;

  if (!summaryText || summaryText.length < 20) {
    showToast('No summary to save', 'warning');
    return;
  }

  const meetingId = meetingsManager.currentMeeting?.id;
  if (!meetingId) {
    showToast('No meeting selected', 'error');
    return;
  }

  try {
    const result = await api.saveSummary(meetingId, summaryText);

    if (result.success) {
      showToast('Summary saved successfully!', 'success');
      // Also save to editor
      const summaryEditor = document.getElementById('meeting-summary-editor');
      if (summaryEditor) {
        summaryEditor.innerText = summaryText;
      }
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('[Meetings] Save summary error:', error);
    showToast('Failed to save summary', 'error');
  }
};

// Copy AI Summary to clipboard
window.copyAISummary = function() {
  const outputContent = document.getElementById('mtg-ai-summary-content');
  if (!outputContent) return;

  const text = outputContent.innerText;
  navigator.clipboard.writeText(text).then(() => {
    showToast('Summary copied to clipboard', 'success');
  }).catch(err => {
    showToast('Failed to copy', 'error');
  });
};

