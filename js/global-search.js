// Global Search Functionality
let searchTimeout = null;
let allSearchableItems = [];

// Initialize global search
function initGlobalSearch() {
  // Load all searchable items from projects data
  loadSearchableItems();
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    const searchContainer = document.querySelector('#global-search').closest('.relative');
    const dropdown = document.getElementById('search-dropdown');
    if (!searchContainer.contains(e.target)) {
      dropdown.classList.add('hidden');
    }
  });
}

// Load all searchable items
async function loadSearchableItems() {
  try {
    // Get all projects, modules, submodules, tasks
    const response = await fetch(`${API_BASE_URL}/projects`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      allSearchableItems = data.data || [];
    }
  } catch (error) {
    console.error('Failed to load searchable items:', error);
  }
}

// Handle global search input
function handleGlobalSearch(query) {
  clearTimeout(searchTimeout);
  
  if (!query || query.trim().length < 2) {
    document.getElementById('search-dropdown').classList.add('hidden');
    return;
  }
  
  searchTimeout = setTimeout(() => {
    performSearch(query.trim());
  }, 300);
}

// Perform search and display results
function performSearch(query) {
  const dropdown = document.getElementById('search-dropdown');
  const resultsContainer = document.getElementById('search-results');
  
  const lowerQuery = query.toLowerCase();
  
  // Search in items
  const exactMatches = [];
  const similarMatches = [];
  
  allSearchableItems.forEach(item => {
    const name = (item.name || '').toLowerCase();
    const description = (item.description || '').toLowerCase();
    const displayId = (item.displayId || '').toString().toLowerCase();
    
    if (name.includes(lowerQuery) || displayId.includes(lowerQuery)) {
      if (name.startsWith(lowerQuery)) {
        exactMatches.push(item);
      }else {
        similarMatches.push(item);
      }
    } else if (description.includes(lowerQuery)) {
      similarMatches.push(item);
    }
  });
  
  // Render results
  if (exactMatches.length === 0 && similarMatches.length === 0) {
    resultsContainer.innerHTML = `
      <div class="px-4 py-8 text-center text-slate-400">
        <svg class="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <p class="text-sm">No results found</p>
      </div>
    `;
  }else {
    let html = '';
    
    if (exactMatches.length > 0) {
      html += '<div class="px-3 py-2 text-xs font-semibold text-slate-400 uppercase">Exact Matches</div>';
      html += exactMatches.map(item => renderSearchItem(item, query)).join('');
    }
    
    if (similarMatches.length > 0) {
      if (exactMatches.length > 0) {
        html += '<div class="border-t border-slate-700 my-2"></div>';
      }
      html += '<div class="px-3 py-2 text-xs font-semibold text-slate-400 uppercase">Similar Results</div>';
      html += similarMatches.slice(0, 10).map(item => renderSearchItem(item, query)).join('');
    }
    
    resultsContainer.innerHTML = html;
  }
  
  dropdown.classList.remove('hidden');
}

// Render a search result item
function renderSearchItem(item, query) {
  const typeColors = {
    'PROJECT': 'bg-purple-500',
    'MODULE': 'bg-blue-500',
    'SUBMODULE': 'bg-green-500',
    'TASK': 'bg-orange-500'
  };
  
  const typeColor = typeColors[item.type] || 'bg-slate-500';
  const highlightedName = highlightText(item.name, query);
  
  return `
    <div class="px-3 py-2 hover:bg-slate-700/50 cursor-pointer transition-colors" onclick="selectSearchItem('${item.displayId}')">
      <div class="flex items-center gap-3">
        <span class="w-2 h-2 rounded-full ${typeColor}"></span>
        <div class="flex-1 min-w-0">
          <p class="text-sm text-white font-medium truncate">${highlightedName}</p>
          <p class="text-xs text-slate-400">${item.type} #${item.displayId}</p>
        </div>
      </div>
    </div>
  `;
}

// Highlight matching text
function highlightText(text, query) {
  if (!query) return text;
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark class="bg-primary-500/30 text-primary-300">$1</mark>');
}

// Select a search item
function selectSearchItem(displayId) {
  // Navigate to projects page if not already there
  if (window.location.hash !== '#projects') {
    navigateTo('projects');
  }
  
  // Wait for page to load, then select the item
  setTimeout(() => {
    const item = allSearchableItems.find(i => i.displayId == displayId);
    if (item && window.handleTreeNodeSelect) {
      window.handleTreeNodeSelect(item);
    }
  }, 300);
  
  // Close dropdown
  document.getElementById('search-dropdown').classList.add('hidden');
  document.getElementById('global-search').value = '';
}

// Show search dropdown
function showSearchDropdown() {
  const input = document.getElementById('global-search');
  if (input.value.trim().length >= 2) {
    performSearch(input.value.trim());
  }
}

// Export functions
window.initGlobalSearch = initGlobalSearch;
window.handleGlobalSearch = handleGlobalSearch;
window.selectSearchItem = selectSearchItem;
window.showSearchDropdown = showSearchDropdown;

