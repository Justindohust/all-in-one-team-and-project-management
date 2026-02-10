# Database

PostgreSQL database schema và migrations cho DigiHub.

## Files

### Core Schema
- **schema.sql** - Main database schema với tất cả tables
- **init.js** - Database initialization script
- **seed.sql** - Sample data for development

### Migrations
Migrations được đặt tên theo format: `YYYYMMDDHHMMSS-description.sql`

- **20260101000001-add-modules.sql** - Adds modules support
- **20260210000001-add-submodules.sql** - Adds submodules (4-level hierarchy)

## Running Migrations

### Setup Database
```bash
# Create database
createdb digihub

# Run main schema
psql -U your_username -d digihub -f schema.sql

# Seed data (optional, for development)
psql -U your_username -d digihub -f seed.sql
```

### Run Migrations
```bash
# Run specific migration
psql -U your_username -d digihub -f 20260210000001-add-submodules.sql

# Or use init.js
node init.js
```

## Schema Overview

### Main Tables
```
users                  - User accounts
workspaces             - Workspace/organization
workspace_members      - User-workspace relationships

project_groups         - Project grouping
projects               - Projects
project_members        - Project team members

modules                - Project modules
submodules             - Module sub-components (NEW)
tasks                  - Individual tasks
task_comments          - Task comments
task_attachments       - Task files

calendar_events        - Calendar/events
event_attendees        - Event participants

channels               - Message channels
channel_members        - Channel participants
messages               - Chat messages
```

### Hierarchy Structure
```
Workspace
└── Project Group
    └── Project
        └── Module
            ├── Submodule
            │   └── Task
            └── Task (direct)
```

## Database Configuration

Configuration is stored in `backend/config/database.js`:
```javascript
const db = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'digihub',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD
});
```

## Environment Variables

Create `.env` file in backend directory:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=digihub
DB_USER=your_username
DB_PASSWORD=your_password
```

## Best Practices

### Writing Migrations
1. Always include timestamp in filename
2. Make migrations idempotent (use `IF NOT EXISTS`)
3. Include rollback instructions in comments
4. Test migrations on development database first
5. Keep migrations small and focused

### Naming Conventions
- Tables: lowercase, plural (e.g., `users`, `project_groups`)
- Columns: snake_case (e.g., `first_name`, `created_at`)
- Foreign keys: `<table>_id` (e.g., `user_id`, `project_id`)
- Boolean columns: `is_<property>` or `has_<property>`
- Timestamps: `created_at`, `updated_at`, `deleted_at`

### Indexes
- Always index foreign keys
- Index frequently queried columns
- Consider composite indexes for common query patterns

## Troubleshooting

### Connection Issues
```bash
# Test connection
psql -U your_username -d digihub -c "SELECT version();"

# Check if database exists
psql -U your_username -l | grep digihub
```

### Migration Errors
```bash
# Check current schema
psql -U your_username -d digihub -c "\dt"

# View table structure
psql -U your_username -d digihub -c "\d table_name"
```

### Reset Database (Development Only!)
```bash
# Drop and recreate
dropdb digihub
createdb digihub
psql -U your_username -d digihub -f schema.sql
```

---

**Last Updated**: February 10, 2026
