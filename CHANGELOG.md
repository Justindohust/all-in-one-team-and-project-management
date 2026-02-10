# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **4-Level Project Hierarchy** - Complete support for Project Groups → Projects → Modules → Submodules → Tasks
- **Enhanced Projects Module UI**
  - Advanced tree view with expand/collapse functionality
  - Table view mode with 8 columns (Name, Status, Progress, Start Date, End Date, Members, Priority, Actions)
  - Detail panel with 5 tabs (Overview, Activity, Files, Relations, Watch)
  - Drag & drop support for moving items between hierarchy levels
- **Table View Features**
  - Real-time search and filtering
  - Column sorting
  - Responsive layout
  - Visual progress indicators
  - Status badges and priority indicators
- **Detail Panel Tabs**
  - Overview: Basic information and quick stats
  - Activity: Activity log and comment system
  - Files: File management and attachments
  - Relations: Related items and dependencies
  - Watch: Watchers and notifications
- **Backend Enhancements**
  - New `/api/modules` endpoints for module CRUD operations
  - New `/api/submodules` endpoints for submodule CRUD operations
  - Enhanced `/api/project-groups` endpoint with full hierarchy support
  - Support for moving items between hierarchy levels
  - Automatic progress calculation based on child items
- **Database Structure**
  - New `modules` table with UUID primary keys
  - New `submodules` table with UUID primary keys
  - Foreign key relationships for data integrity
  - Migration scripts with timestamp-based naming convention
- **Documentation**
  - Comprehensive documentation in `docs/` directory
  - API routes documentation in `backend/routes/README.md`
  - Frontend modules guide in `js/README.md`
  - Database guide with migration instructions in `backend/database/README.md`
  - Enhanced features guide in `docs/PROJECTS_MODULE_ENHANCED.md`
- **Code Quality**
  - `.editorconfig` for consistent code formatting
  - Organized file structure with `docs/` and `archive/` directories
  - Standardized migration file naming (YYYYMMDDHHMMSS-description.sql)

### Changed
- **Projects Tab Redesign** - Complete UI/UX overhaul with dual view modes (Tree/Table)
- **API Structure** - Enhanced project groups endpoint to return full nested hierarchy
- **File Organization** - Moved documentation files to `docs/` directory
- **Database Migrations** - Renamed to timestamp-based format for better ordering

### Fixed
- Tree view icon support for all hierarchy levels
- Progress calculation accuracy for nested structures
- Modal handling for all CRUD operations

## [0.1.0] - 2026-01-01

### Added
- Initial project setup
- Basic authentication system with JWT
- Dashboard with overview cards
- Task management with Kanban board
- Calendar with event management
- Team directory
- Messaging system
- Reports and analytics
- Settings page
- Docker containerization
- PostgreSQL database with schema

### Frontend
- Vanilla JavaScript SPA architecture
- Tailwind CSS for styling
- Dynamic view loading system
- API client with authentication

### Backend
- Express.js REST API
- PostgreSQL database
- JWT authentication middleware
- CRUD routes for all resources

### DevOps
- Docker Compose setup
- Nginx reverse proxy
- Development and production configurations

---

## Version History Summary

### Current Version Features
This application is a comprehensive team and project management platform with:
- ✅ 4-level project hierarchy (Groups → Projects → Modules → Submodules → Tasks)
- ✅ Dual view modes (Tree view & Table view)
- ✅ Real-time collaboration features
- ✅ Task management with Kanban board
- ✅ Calendar and event scheduling
- ✅ Team messaging and channels
- ✅ Reports and analytics
- ✅ Role-based access control
- ✅ File attachments and sharing

### Technology Stack
- **Frontend**: HTML5, Tailwind CSS, Vanilla JavaScript
- **Backend**: Node.js 18+, Express.js 4.x
- **Database**: PostgreSQL 16+
- **DevOps**: Docker, Docker Compose, Nginx

---

## Notes

### Migration Guide
When updating from older versions:

1. **Database Migrations**: Run all migration files in order
   ```bash
   psql -d digihub -f backend/database/20260101000001-add-modules.sql
   psql -d digihub -f backend/database/20260210000001-add-submodules.sql
   ```

2. **Frontend Updates**: Clear browser cache to load new JavaScript modules

3. **Backend Updates**: Restart backend service after pulling changes
   ```bash
   docker-compose restart backend
   ```

### Breaking Changes
- None in current release

### Deprecations
- None in current release

---

**For detailed API documentation, see [backend/routes/README.md](backend/routes/README.md)**

**For feature guides, see [docs/](docs/) directory**
