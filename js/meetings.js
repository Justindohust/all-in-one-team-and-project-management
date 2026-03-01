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
    const durationMinutes = Math.round((endDate - startDate) / 60000);

    // Title (contenteditable)
    const titleDisplay = document.getElementById('meeting-title-display');
    if (titleDisplay) titleDisplay.textContent = meeting.title;

    // Subtitle
    const subtitleEl = document.getElementById('meeting-detail-subtitle');
    if (subtitleEl) {
      const subtitleText = meeting.isRecurring
        ? `Recurring • ${meeting.recurrencePattern || 'Weekly'}`
        : 'One-time';
      subtitleEl.querySelector('span').textContent = subtitleText;
    }

    // Date & Time
    const dateInput = document.getElementById('meeting-date-input');
    const startTimeInput = document.getElementById('meeting-start-time-input');
    const endTimeInput = document.getElementById('meeting-end-time-input');
    if (dateInput) dateInput.value = startDate.toISOString().split('T')[0];
    if (startTimeInput) startTimeInput.value = startDate.toTimeString().slice(0, 5);
    if (endTimeInput) endTimeInput.value = endDate.toTimeString().slice(0, 5);

    // Duration — pick nearest option, or add it dynamically
    const durationInput = document.getElementById('meeting-duration-input');
    if (durationInput) {
      // Try to select exact match; if not found, add a custom option
      const existing = Array.from(durationInput.options).find(o => parseInt(o.value) === durationMinutes);
      if (!existing) {
        const opt = new Option(`${durationMinutes} min`, durationMinutes, true, true);
        opt.className = 'bg-slate-800';
        durationInput.add(opt, 0);
      }
      durationInput.value = durationMinutes;
    }

    // Location
    const locationInput = document.getElementById('meeting-location-input');
    if (locationInput) locationInput.value = meeting.location || '';

    // Status
    const statusInput = document.getElementById('meeting-status-input');
    if (statusInput) {
      statusInput.value = meeting.status || 'scheduled';
      this._applyStatusColor(statusInput);
    }

    // Participants chips + inline dropdown
    this._renderPeopleField('participants', meeting.participants || []);

    // Notifiees chips + inline dropdown
    this._renderPeopleField('notifiees', meeting.notifiees || []);

    // Meeting minutes (contenteditable)
    const minutesEl = document.getElementById('meeting-detail-minutes');
    if (minutesEl) {
      minutesEl.innerHTML = meeting.minutes || '';
    }

    // Attach status-color update on change
    if (statusInput && !statusInput._colorListenerAdded) {
      statusInput.addEventListener('change', () => this._applyStatusColor(statusInput));
      statusInput._colorListenerAdded = true;
    }
  }

  // Build chip HTML for a single person
  _chipHtml(type, person) {
    const colors = [
      'from-indigo-400 to-indigo-600','from-violet-400 to-violet-600',
      'from-sky-400 to-sky-600','from-emerald-400 to-emerald-600',
      'from-amber-400 to-amber-600','from-rose-400 to-rose-600'
    ];
    const colorIdx = person.name.charCodeAt(0) % colors.length;
    return `
      <div class="people-chip" data-id="${person.id}" data-type="${type}">
        <div class="chip-avatar bg-gradient-to-br ${colors[colorIdx]}">
          ${this.getInitials(person.name)}
        </div>
        <span>${person.name}</span>
        <button type="button" class="chip-remove"
                onclick="event.stopPropagation(); meetingsManager._removePerson('${type}', '${person.id}')" title="Remove">
          <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>`;
  }

  // Remove a person directly when clicking ×
  _removePerson(type, memberId) {
    if (!this.currentMeeting) return;
    const arr = type === 'participants'
      ? (this.currentMeeting.participants = this.currentMeeting.participants || [])
      : (this.currentMeeting.notifiees = this.currentMeeting.notifiees || []);
    const idx = arr.findIndex(p => String(p.id) === String(memberId));
    if (idx !== -1) arr.splice(idx, 1);
    // Uncheck the corresponding checkbox in dropdown
    const cb = document.querySelector(
      `#${type === 'participants' ? 'participants' : 'notifiees'}-list-edit input[value="${memberId}"]`
    );
    if (cb) cb.checked = false;
    this._renderChipsOnly(type, arr);
  }

  // Re-render only the chip area (not the dropdown list)
  _renderChipsOnly(type, people) {
    const chipContainer = document.getElementById(
      type === 'participants' ? 'meeting-detail-participants' : 'meeting-detail-notifiees'
    );
    if (!chipContainer) return;
    const addLabel = type === 'participants' ? 'Add participant' : 'Add recipient';
    const chipsHtml = people.map(p => this._chipHtml(type, p)).join('');
    const addBtn = `<button type="button" class="people-add-btn"
      onclick="event.stopPropagation(); toggleMeetingInlineDropdown('${type}', event)">
      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
      ${addLabel}
    </button>`;
    chipContainer.innerHTML = chipsHtml + addBtn;
  }

  // Render chips + checkbox list for participants / notifiees
  _renderPeopleField(type, people) {
    const chipContainer = document.getElementById(
      type === 'participants' ? 'meeting-detail-participants' : 'meeting-detail-notifiees'
    );
    const listContainer = document.getElementById(
      type === 'participants' ? 'participants-list-edit' : 'notifiees-list-edit'
    );
    if (!chipContainer || !listContainer) return;

    const teamMembers = (window.app && app.state && app.state.teamMembers) || [];

    // Render chips + persistent Add button
    const addLabel = type === 'participants' ? 'Add participant' : 'Add recipient';
    const chipsHtml = people.map(p => this._chipHtml(type, p)).join('');
    const addBtn = `<button type="button" class="people-add-btn"
      onclick="event.stopPropagation(); toggleMeetingInlineDropdown('${type}', event)">
      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
      ${addLabel}
    </button>`;
    chipContainer.innerHTML = chipsHtml + addBtn;

    // Render checkbox list
    if (teamMembers.length === 0) {
      listContainer.innerHTML = '<p class="text-xs text-slate-500 p-3">No team members available</p>';
      return;
    }
    const selectedIds = new Set(people.map(p => String(p.id)));
    listContainer.innerHTML = teamMembers.map(member => {
      const fullName = `${member.firstName} ${member.lastName}`;
      const checked = selectedIds.has(String(member.id));
      const colors = ['from-indigo-400 to-indigo-600','from-violet-400 to-violet-600',
        'from-sky-400 to-sky-600','from-emerald-400 to-emerald-600',
        'from-amber-400 to-amber-600','from-rose-400 to-rose-600'];
      const ci = fullName.charCodeAt(0) % colors.length;
      return `
        <label class="mtg-member-row ${checked ? 'selected' : ''}">
          <div class="mtg-member-avatar bg-gradient-to-br ${colors[ci]}">
            ${this.getInitials(fullName)}
            ${checked ? '<div class="mtg-member-check"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg></div>' : ''}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-white truncate">${fullName}</p>
            ${member.email ? `<p class="text-xs text-slate-500 truncate">${member.email}</p>` : ''}
          </div>
          <input type="checkbox" value="${member.id}" data-name="${fullName}" data-type="${type}"
            ${checked ? 'checked' : ''}
            onchange="meetingsManager._onPeopleCheckboxChange('${type}', this)"
            class="mtg-checkbox">
        </label>
      `;
    }).join('');
  }

  // Handle checkbox change in inline people dropdown
  _onPeopleCheckboxChange(type, checkbox) {
    if (!this.currentMeeting) return;
    const memberId = checkbox.value;
    const memberName = checkbox.dataset.name;
    const arr = type === 'participants'
      ? (this.currentMeeting.participants = this.currentMeeting.participants || [])
      : (this.currentMeeting.notifiees = this.currentMeeting.notifiees || []);

    if (checkbox.checked) {
      if (!arr.some(p => String(p.id) === String(memberId))) {
        arr.push({ id: memberId, name: memberName });
      }
    } else {
      const idx = arr.findIndex(p => String(p.id) === String(memberId));
      if (idx !== -1) arr.splice(idx, 1);
    }
    // Update checked indicator badge on the avatar
    const label = checkbox.closest('label');
    if (label) {
      const existing = label.querySelector('.mtg-member-check');
      if (checkbox.checked && !existing) {
        label.querySelector('.mtg-member-avatar')?.insertAdjacentHTML('beforeend',
          '<div class="mtg-member-check"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg></div>'
        );
        label.classList.add('selected');
      } else if (!checkbox.checked && existing) {
        existing.remove();
        label.classList.remove('selected');
      }
    }
    this._renderChipsOnly(type, arr);
  }

  // Apply color class to status badge-select
  _applyStatusColor(select) {
    select.classList.remove('status-scheduled', 'status-in_progress', 'status-completed', 'status-cancelled');
    select.classList.add(`status-${select.value}`);
    select.classList.add('meeting-status-badge');
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

    // Title (contenteditable)
    const titleEl = document.getElementById('meeting-title-display');
    if (titleEl) meeting.title = titleEl.textContent.trim() || meeting.title;

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

    // Duration overrides end time
    const durationInput = document.getElementById('meeting-duration-input');
    if (durationInput?.value && meeting.startTime) {
      const durationMinutes = parseInt(durationInput.value);
      meeting.endTime = new Date(new Date(meeting.startTime).getTime() + durationMinutes * 60000).toISOString();
    }

    // Location
    const locationInput = document.getElementById('meeting-location-input');
    if (locationInput) meeting.location = locationInput.value;

    // Status
    const statusInput = document.getElementById('meeting-status-input');
    if (statusInput) meeting.status = statusInput.value;

    // Meeting minutes (contenteditable rich text)
    const minutesEl = document.getElementById('meeting-detail-minutes');
    if (minutesEl) {
      const rawHtml = minutesEl.innerHTML.trim();
      meeting.minutes = (rawHtml === '' || !rawHtml) ? '' : rawHtml;
    }

    // Participants & notifiees are already kept up-to-date via checkbox listeners

    try {
      await api.updateMeeting(meeting.id, meeting);
      showToast('Meeting updated successfully', 'success');
      await meetingsManager.loadMeetings();
      meetingsManager.closeMeetingDetailModal();
    } catch (error) {
      showToast('Failed to update meeting', 'error');
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

