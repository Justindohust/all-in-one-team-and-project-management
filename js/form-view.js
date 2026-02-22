// Form View Functionality
let currentFormItem = null;

// Expand to form view
function expandToFormView() {
  if (!currentDetailItem) return;
  
  currentFormItem = currentDetailItem;
  const modal = document.getElementById('form-view-modal');
  const title = document.getElementById('form-view-title');
  const content = document.getElementById('form-view-content');
  
  // Set title
  title.textContent = `${currentFormItem.type} #${currentFormItem.displayId}- ${currentFormItem.name}`;
  
  // Render form content
  renderFormView(content, currentFormItem);
  
  // Show modal
  modal.classList.remove('hidden');
}

// Close form view
function closeFormView() {
  const modal = document.getElementById('form-view-modal');
  modal.classList.add('hidden');
  currentFormItem = null;
}

// Render form view content (similar to Odoo form view)
function renderFormView(container, item) {
  const typeColors = {
    'PROJECT': 'bg-purple-500',
    'MODULE': 'bg-blue-500',
    'SUBMODULE': 'bg-green-500',
    'TASK': 'bg-orange-500'
  };
  
  const typeColor = typeColors[item.type] || 'bg-slate-500';
  
  container.innerHTML = `
    <div class="space-y-6">
      <!-- Header Info -->
      <div class="flex items-start gap-4 pb-6 border-b border-slate-700">
        <div class="w-12 h-12 rounded-lg ${typeColor} flex items-center justify-center text-white font-bold text-lg">
          ${item.type.charAt(0)}
        </div>
        <div class="flex-1">
          <h3 class="text-2xl font-bold text-white mb-1">${item.name}</h3>
          <p class="text-sm text-slate-400">${item.type} #${item.displayId}</p>
        </div>
        <div class="flex gap-2">
          <button onclick="saveFormView()" class="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors">
            Save
          </button>
          <button onclick="closeFormView()" class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors">
            Cancel
          </button>
        </div>
      </div>
      
      <!-- Form Fields -->
      <div class="grid grid-cols-2 gap-6">
        <!-- Left Column -->
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Assignee</label>
            <select class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">- Select Assignee -</option>
              <option value="1" ${item.assignee === 'User 1' ? 'selected' : ''}>User 1</option>
              <option value="2" ${item.assignee === 'User 2' ? 'selected' : ''}>User 2</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Priority *</label>
            <select class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="Low" ${item.priority === 'Low' ? 'selected' : ''}>Low</option>
              <option value="Medium" ${item.priority === 'Medium' ? 'selected' : ''}>Medium</option>
              <option value="High" ${item.priority === 'High' ? 'selected' : ''}>High</option>
              <option value="Urgent" ${item.priority === 'Urgent' ? 'selected' : ''}>Urgent</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Category</label>
            <input type="text" value="${item.category || ''}" class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Enter category">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Version</label>
            <input type="text" value="${item.version || ''}" class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Enter version">
          </div>
        </div>
        
        <!-- Right Column -->
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Date</label>
            <input type="date" value="${item.startDate || ''}" class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Accountable</label>
            <select class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">- Select -</option>
            </select>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">% Complete</label>
              <input type="number" value="${item.progress || 0}" min="0" max="100" class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Work</label>
              <input type="text" value="${item.estimatedHours || ''}" class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="0h">
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Remaining work</label>
              <input type="text" value="" class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="0h">
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Spent time</label>
              <input type="text" value="${item.actualHours || ''}" class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="0h">
            </div>
          </div>
        </div>
      </div>
      
      <!-- Full Width Fields -->
      <div class="space-y-4 pt-4 border-t border-slate-700">
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">Description</label>
          <textarea rows="4" class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" placeholder="Enter description">${item.description || ''}</textarea>
        </div>
      </div>
      
      <!-- Tabs Section -->
      <div class="pt-4 border-t border-slate-700">
        <div class="flex gap-4 border-b border-slate-700 mb-4">
          <button class="px-4 py-2 text-sm font-medium text-primary-400 border-b-2 border-primary-400">ACTIVITY</button>
          <button class="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white">FILES (0)</button>
          <button class="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white">RELATIONS (4)</button>
          <button class="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white">WATCHERS (1)</button>
          <button class="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white">MEETINGS</button>
        </div>
        
        <!-- Activity Feed -->
        <div class="space-y-4">
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-medium">
              U
            </div>
            <div class="flex-1">
              <div class="bg-slate-800 rounded-lg p-3">
                <p class="text-sm text-slate-300">Updated automatically by changing values when child work package #1982</p>
                <div class="mt-2 text-xs text-slate-400 space-y-1">
                  <p>Time was changed from <span class="line-through">17.5h</span> to <span class="text-red-400">20h</span></p>
                  <p>Total remaining work changed from <span class="line-through">15.5h</span> to <span class="text-green-400">17.5h</span></p>
                </div>
              </div>
              <p class="text-xs text-slate-500 mt-1">2 hours ago</p>
            </div>
          </div>
          
          <!-- Add Comment -->
          <div class="flex items-start gap-3 pt-4">
            <div class="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white text-sm font-medium">
              M
            </div>
            <div class="flex-1">
              <textarea rows="3" class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" placeholder="Add a comment, type @ to notify people..."></textarea>
              <button class="mt-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors">
                Comment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Save form view
function saveFormView() {
  // TODO: Implement save functionality
  showNotification('Success', 'Changes saved', 'success');
  closeFormView();
}

// Export functions
window.expandToFormView = expandToFormView;
window.closeFormView = closeFormView;
window.saveFormView = saveFormView;

