# DigiHub - Projects Module Enhancement

## ✨ New Features

### Advanced TreeView with Full CRUD Operations

The Projects module now supports a complete hierarchical structure with drag & drop functionality:

- **Project Groups** → **Projects** → **Modules** → **Tasks**
- Full CRUD operations at every level
- Drag & drop to reorganize and move items
- Context menu for quick actions
- Real-time database persistence

## 🗂️ Hierarchy Structure

```
📁 Project Group
  └─ 📂 Project
      └─ 📦 Module
          └─ ✅ Task
```

## 🚀 Usage

### Creating Items

1. **New Group**: Click "New Group" button at the top
2. **New Project/Module/Task**: Right-click on parent item → "Add Child"
3. Fill in the form with:
   - Name (required)
   - Description
   - Status (active, pending, completed, archived)
   - Priority (low, medium, high, urgent)
   - Start Date & Due Date
   - Assignees

### Editing Items

- **Option 1**: Right-click → "Edit"
- **Option 2**: Left-click context menu icon (three dots)

### Moving Items

Simply drag any item and drop it onto a valid parent:
- Projects can be moved between Groups
- Modules can be moved between Projects  
- Tasks can be moved between Modules

### Deleting Items

Right-click → "Delete" → Confirm

⚠️ **Warning**: Deleting an item will also delete all its children!

## 🛠️ Database Changes

### New Tables

#### `modules` Table
```sql
CREATE TABLE modules (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20),
    priority VARCHAR(10),
    start_date DATE,
    due_date DATE,
    progress INT,
    sort_order INT,
    created_by UUID,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

#### Updated `tasks` Table
Added `module_id` column to link tasks to modules:
```sql
ALTER TABLE tasks ADD COLUMN module_id UUID REFERENCES modules(id);
```

### Running Migration

If you have an existing database, run the migration:

```bash
# Connect to postgres container
docker exec -it digihub-postgres psql -U digihub_user -d digihub

# Run migration
\i /docker-entrypoint-initdb.d/migration-add-modules.sql
```

Or manually:
```bash
docker exec -i digihub-postgres psql -U digihub_user -d digihub < backend/database/migration-add-modules.sql
```

## 📡 API Endpoints

### Modules

- `GET /api/modules/project/:projectId` - Get all modules for a project
- `GET /api/modules/:id` - Get module details with tasks
- `POST /api/modules` - Create new module
- `PUT /api/modules/:id` - Update module
- `PATCH /api/modules/:id/move` - Move module to different project
- `DELETE /api/modules/:id` - Delete module

### Updated Task Endpoints

- `POST /api/tasks` now accepts `moduleId` parameter
- `PUT /api/tasks/:id` can update `moduleId` to move tasks

## 🎨 UI Components

### Files Added

- `js/tree-view.js` - Advanced TreeView component with drag & drop
- `js/projects.js` - Projects management logic and API calls
- `backend/routes/modules.js` - Modules API routes
- `backend/database/migration-add-modules.sql` - Database migration

### Files Modified

- `views/projects.html` - Updated UI for tree view
- `views/modals.html` - Added universal tree node modal and delete confirmation
- `index.html` - Integrated new JavaScript files
- `backend/server.js` - Added modules routes
- `backend/routes/projects.js` - Include modules in project response
- `backend/routes/tasks.js` - Support module_id in task creation
- `backend/database/schema.sql` - Added modules table

## 🔧 Technical Details

### TreeView Features

- **Multi-level nesting**: Unlimited hierarchy depth
- **Expand/Collapse**: Click arrow icon to toggle children
- **Selection**: Click item to select and highlight
- **Context Menu**: Right-click or click menu button for actions
- **Drag & Drop**: 
  - Drag any item to reorder or move
  - Visual feedback during drag
  - Validation to prevent invalid moves
- **Icons**: Different icons for each item type
- **Status Badges**: Visual status indicators
- **Item Count**: Show number of children

### Data Flow

1. **Frontend** (`js/projects.js`)
   - Transform API data to tree structure
   - Handle user interactions
   - Call API endpoints

2. **Backend** (`backend/routes/*.js`)
   - Validate requests
   - Perform database operations
   - Return updated data

3. **Database** (PostgreSQL)
   - Store hierarchical relationships
   - Enforce referential integrity
   - Cascade deletions

## 🧪 Testing

### Manual Testing Steps

1. **Create Hierarchy**:
   - Create a Project Group
   - Add a Project to it
   - Add Modules to the Project
   - Add Tasks to Modules

2. **Test CRUD**:
   - Edit each item type
   - Verify changes persist after refresh
   - Delete items and verify cascade

3. **Test Drag & Drop**:
   - Move a Project between Groups
   - Move a Module between Projects
   - Move a Task between Modules
   - Try invalid moves (should be rejected)

4. **Test UI**:
   - Expand/Collapse all
   - Context menu on all item types
   - Form validation

## 📝 Notes

- All operations now persist to PostgreSQL database
- Authentication is required for all API endpoints
- Drag & drop validates move types automatically
- Deleting items cascades to all children
- Migration script creates default modules for existing projects

## 🐛 Troubleshooting

### Database Issues

If modules table doesn't exist:
```bash
docker-compose down
docker volume rm all-in-one-team-and-project-management_postgres_data
docker-compose up -d --build
```

### API Authentication Errors

Make sure you're logged in. Token is stored in localStorage:
```javascript
localStorage.getItem('token')
```

### UI Not Updating

1. Hard refresh: `Ctrl+Shift+R` or `Cmd+Shift+R`
2. Clear cache
3. Check browser console for errors

## 🎯 Future Enhancements

- [ ] Bulk operations (multi-select)
- [ ] Advanced filtering and search
- [ ] Gantt chart view
- [ ] Timeline view
- [ ] Progress tracking
- [ ] Dependencies between items
- [ ] Templates for quick project setup
- [ ] Import/Export functionality
