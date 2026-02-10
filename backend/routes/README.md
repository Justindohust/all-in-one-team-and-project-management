# Backend Routes

Express.js API routes cho DigiHub backend.

## Route Structure

```
routes/
├── auth.js            # Authentication & authorization
├── users.js           # User management
├── projectGroups.js   # Project groups
├── projects.js        # Projects
├── modules.js         # Modules
├── submodules.js      # Submodules
├── tasks.js           # Tasks
├── calendar.js        # Calendar events
├── messages.js        # Messaging system
├── team.js            # Team management
├── reports.js         # Reports & analytics
└── settings.js        # Settings
```

## API Endpoints

### Authentication (`/api/auth`)
```
POST   /login          - User login
POST   /register       - User registration
POST   /logout         - User logout
GET    /me             - Get current user
POST   /refresh        - Refresh token
```

### Users (`/api/users`)
```
GET    /               - List all users
GET    /:id            - Get user by ID
PUT    /:id            - Update user
DELETE /:id            - Delete user
```

### Project Groups (`/api/project-groups`)
```
GET    /               - List all groups (with projects, modules, submodules, tasks)
POST   /               - Create group
GET    /:id            - Get group by ID
PUT    /:id            - Update group
DELETE /:id            - Delete group
```

### Projects (`/api/projects`)
```
GET    /               - List projects (with filters)
POST   /               - Create project
GET    /:id            - Get project by ID
PUT    /:id            - Update project
DELETE /:id            - Delete project
PATCH  /:id/favorite   - Toggle favorite
```

### Modules (`/api/modules`)
```
GET    /project/:projectId  - List modules for project
GET    /:id                 - Get module by ID
POST   /                    - Create module
PUT    /:id                 - Update module
DELETE /:id                 - Delete module
PATCH  /:id/move            - Move to different project
```

### Submodules (`/api/submodules`)
```
GET    /module/:moduleId    - List submodules for module
GET    /:id                 - Get submodule by ID
POST   /                    - Create submodule
PUT    /:id                 - Update submodule
DELETE /:id                 - Delete submodule
PATCH  /:id/move            - Move to different module
PATCH  /:id/progress        - Update progress
```

### Tasks (`/api/tasks`)
```
GET    /               - List tasks (with filters)
GET    /kanban         - Get tasks in Kanban format
GET    /:id            - Get task by ID
POST   /               - Create task
PUT    /:id            - Update task
DELETE /:id            - Delete task
PATCH  /:id/status     - Update status
POST   /:id/comments   - Add comment
```

### Calendar (`/api/calendar`)
```
GET    /events         - List events (with date range)
POST   /events         - Create event
GET    /events/:id     - Get event by ID
PUT    /events/:id     - Update event
DELETE /events/:id     - Delete event
```

### Messages (`/api/messages`)
```
GET    /channels                       - List channels
POST   /channels                       - Create channel
GET    /channels/:id/messages          - Get messages
POST   /channels/:id/messages          - Send message
```

## Middleware

All routes (except auth) use authentication middleware:

```javascript
const auth = require('../middleware/auth');
router.get('/', auth, async (req, res) => {
  // req.user available here
});
```

## Request/Response Format

### Standard Success Response
```json
{
  "success": true,
  "data": { /* result data */ },
  "message": "Optional success message"
}
```

### Standard Error Response
```json
{
  "success": false,
  "message": "Error message"
}
```

## Authentication

### Token-based auth với JWT
```javascript
// Login provides token
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

// Use token in subsequent requests
fetch('/api/projects', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## Error Handling

All routes use centralized error handler in server.js:

```javascript
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});
```

## Route Development Guide

### Creating New Route

1. Create file in `routes/` directory:
```javascript
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

// Define routes
router.get('/', auth, async (req, res, next) => {
  try {
    // Your logic here
    res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

2. Register in `server.js`:
```javascript
app.use('/api/your-route', require('./routes/your-route'));
```

### Best Practices

#### Use async/await
```javascript
router.get('/', auth, async (req, res, next) => {
  try {
    const result = await db.query('SELECT * FROM table');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
});
```

#### Validate input
```javascript
if (!name || !email) {
  return res.status(400).json({
    success: false,
    message: 'Name and email are required'
  });
}
```

#### Use parameterized queries
```javascript
// Good - prevents SQL injection
const result = await db.query(
  'SELECT * FROM users WHERE id = $1',
  [userId]
);

// Bad - vulnerable to SQL injection
const result = await db.query(
  `SELECT * FROM users WHERE id = ${userId}`
);
```

#### Handle not found
```javascript
if (result.rows.length === 0) {
  return res.status(404).json({
    success: false,
    message: 'Resource not found'
  });
}
```

## Testing Routes

### Using curl
```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@digihub.com","password":"admin123"}'

# Get projects with token
curl http://localhost:3001/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Using Postman
1. Import collection
2. Set environment variables
3. Test endpoints
4. Save requests

---

**Last Updated**: February 10, 2026
