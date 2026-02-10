# JavaScript Files

Frontend JavaScript modules cho DigiHub application.

## Core Files

### Application Core
- **app.js** - Main application initialization và state management
- **api.js** - API client cho backend communication
- **view-loader.js** - Dynamic view loading system

### Components
- **tree-view.js** - Reusable tree view component với drag & drop
- **projects.js** - Projects module logic (legacy + CRUD operations)
- **projects-table-view.js** - Enhanced table view với 4-level hierarchy

## File Structure

```
js/
├── app.js                    # Main app & state management
├── api.js                    # API client
├── view-loader.js            # View loading
├── tree-view.js              # Tree component
├── projects.js               # Projects module
└── projects-table-view.js    # Projects table view
```

## Module Descriptions

### app.js
Main application file that handles:
- Application initialization
- State management
- Navigation
- User authentication state
- Page switching

```javascript
const app = {
  state: {
    currentUser: null,
    projectGroups: [],
    // ... other state
  },
  init() { /* ... */ }
};
```

### api.js
API client wrapper cho fetch requests:
- Authentication methods
- CRUD operations
- Error handling
- Token management

```javascript
const api = new DigiHubAPI();
api.login(email, password);
api.getProjects();
// ... etc
```

### view-loader.js
Dynamic view loading system:
- Load HTML views
- Handle view initialization
- Clean up on view change

### tree-view.js
Reusable tree view component:
- Hierarchical data display
- Expand/collapse
- Drag & drop support
- Context menu
- CRUD operations

### projects.js
Projects module với:
- Tree view integration
- CRUD handlers
- API integration
- Modal management
- Data transformation

### projects-table-view.js
Enhanced table view featuring:
- 4-level hierarchy rendering
- Detail panel với tabs
- Expand/collapse rows
- Row selection
- Status và priority badges

## Usage Examples

### Loading a View
```javascript
loadView('projects'); // Loads views/projects.html
```

### API Calls
```javascript
// Get all projects
const result = await api.getProjects();

// Create new project
const newProject = await api.createProject({
  name: 'My Project',
  description: 'Description'
});
```

### Tree View
```javascript
const treeView = new AdvancedTreeView(container, {
  data: treeData,
  onSelect: (node) => console.log(node),
  allowDrag: true
});
```

## Coding Standards

### Naming Conventions
- Functions: camelCase (`loadProjects`, `handleClick`)
- Classes: PascalCase (`AdvancedTreeView`, `DigiHubAPI`)
- Constants: UPPER_SNAKE_CASE (`API_BASE_URL`)
- Private functions: prefix with underscore (`_privateMethod`)

### Function Organization
```javascript
// 1. Public API functions first
async function publicFunction() {}

// 2. Event handlers
function handleSomething() {}

// 3. Helper functions
function helperFunction() {}

// 4. Export at bottom
window.functionName = functionName;
```

### Error Handling
```javascript
try {
  const result = await api.someMethod();
  if (!result.success) {
    throw new Error(result.message);
  }
  // Handle success
} catch (error) {
  console.error('Error:', error);
  showNotification('Error', error.message, 'error');
}
```

### Async/Await
Prefer async/await over promises:
```javascript
// Good
async function loadData() {
  const data = await api.getData();
  processData(data);
}

// Avoid
function loadData() {
  api.getData().then(data => {
    processData(data);
  });
}
```

## Dependencies

All JS files use vanilla JavaScript (no frameworks).
External dependencies loaded via CDN in index.html.

## Testing

Currently no automated tests.
Manual testing workflow:
1. Open browser dev tools
2. Navigate to feature
3. Test functionality
4. Check console for errors

## Performance

### Optimization Tips
- Debounce expensive operations
- Use event delegation
- Cache DOM queries
- Minimize reflows
- Lazy load data

### Common Patterns
```javascript
// Debouncing
let timeout;
function debounce(fn, delay) {
  clearTimeout(timeout);
  timeout = setTimeout(fn, delay);
}

// Event delegation
container.addEventListener('click', (e) => {
  if (e.target.matches('.button')) {
    handleClick(e);
  }
});

// DOM caching
const element = document.getElementById('my-element');
// Reuse element instead of querying again
```

## Troubleshooting

### Common Issues

**Script not loading**: Check path in index.html
**Function undefined**: Check export at bottom of file
**API errors**: Check network tab and backend logs
**State not updating**: Check app.state modifications

---

**Last Updated**: February 10, 2026
