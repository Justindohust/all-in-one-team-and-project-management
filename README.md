# 🚀 DigiHub - Team & Project Management

<p align="center">
  <img src="resources/DigiFact_Logo_Noname_Type1.png" alt="DigiHub Logo" width="120">
</p>

<p align="center">
  <strong>All-in-One Team and Project Management Platform</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#api-documentation">API</a> •
  <a href="#deployment">Deployment</a>
</p>

---

## 📋 Overview

DigiHub is a comprehensive team and project management platform designed to help teams collaborate efficiently. It provides a modern, intuitive interface for managing projects, tasks, team communication, and scheduling.

## ✨ Features

### 📁 Project Management
- **4-Level Project Hierarchy** - Project Groups → Projects → Modules → Submodules → Tasks
- **Advanced Tree View** - Expandable/collapsible hierarchy with drag & drop
- **Table View Mode** - Comprehensive table with 8 columns and sorting capabilities
- **Detail Panel** - Rich side panel with 5 tabs (Overview, Activity, Files, Relations, Watch)
- **Project Groups** - Organize projects into logical groups
- **Project Tracking** - Real-time progress tracking with automatic calculation
- **Favorites** - Quick access to frequently used projects
- **Project Members** - Assign team members to projects

### ✅ Task Management
- **Task Board** - Kanban-style task organization (Todo, In Progress, In Review, Done)
- **Task Hierarchy** - Support for subtasks and parent tasks within submodules
- **Priority Levels** - Urgent, High, Medium, Low priority settings
- **Task Assignments** - Assign tasks to team members
- **Due Dates & Time Tracking** - Estimated and actual hours tracking
- **Progress Indicators** - Visual progress bars for all hierarchy levels
- **Comments & Attachments** - Collaborate on tasks with comments and files

### 📅 Calendar & Events
- **Calendar View** - Visual event and deadline management
- **Event Types** - Meetings, deadlines, milestones, reminders
- **Recurring Events** - Daily, weekly, monthly, yearly recurrence
- **Event Attendees** - Invite team members to events

### 👥 Team Management
- **Team Directory** - View all team members and their roles
- **User Profiles** - Manage profiles with avatars and bio
- **Role-Based Access** - Admin, Manager, Member roles
- **Online Status** - See who's currently online

### 💬 Messaging & Communication
- **Channels** - Public and private communication channels
- **Direct Messages** - One-on-one private conversations
- **File Sharing** - Share files within conversations
- **Thread Replies** - Reply to specific messages

### 📊 Reports & Analytics
- **Dashboard** - Overview of projects, tasks, and team activity
- **Progress Tracking** - Visual progress indicators
- **Statistics** - Key metrics and performance data

## 🛠 Tech Stack

### Frontend
- **HTML5** - Semantic markup
- **Tailwind CSS** - Utility-first CSS framework
- **Vanilla JavaScript** - No framework dependencies
- **Plus Jakarta Sans** - Modern SaaS-friendly font

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **PostgreSQL 16** - Relational database
- **JWT** - JSON Web Token authentication
- **bcryptjs** - Password hashing

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Web server and reverse proxy

## 📁 Project Structure

```
all-in-one-team-and-project-management/
├── 📄 index.html              # Main frontend HTML (shell/layout)
├── 📄 docker-compose.yml      # Docker orchestration
├── 📄 Dockerfile              # Frontend Docker config
├── 📄 nginx.conf              # Nginx configuration
├── � .editorconfig           # Editor configuration
├── 📂 docs/                   # 📚 Documentation
│   ├── README.md              # Documentation index
│   ├── PROJECTS_MODULE.md     # Projects module documentation
│   ├── PROJECTS_MODULE_ENHANCED.md  # Enhanced features guide
│   └── COMMON_ERRORS.md       # Troubleshooting guide
├── 📂 archive/                # 📦 Archived files
│   └── index-backup.html      # Backup files
├── 📂 css/
│   └── input.css              # Tailwind CSS source
├── 📂 js/                     # 🎯 Frontend JavaScript
│   ├── README.md              # Frontend modules guide
│   ├── api.js                 # API client for backend communication
│   ├── app.js                 # Main app controller & state management
│   ├── view-loader.js         # Dynamic view loading handler
│   ├── projects.js            # Projects CRUD & tree view logic
│   ├── projects-table-view.js # Table view renderer & detail panel
│   └── tree-view.js           # Advanced tree view component
├── 📂 views/                  # Modular HTML view components
│   ├── dashboard.html         # Dashboard overview page
│   ├── projects.html          # Projects management page (enhanced)
│   ├── tasks.html             # Task board & management page
│   ├── calendar.html          # Calendar & events page
│   ├── team.html              # Team directory page
│   ├── messages.html          # Messaging & channels page
│   ├── reports.html           # Reports & analytics page
│   ├── settings.html          # Settings & preferences page
│   ├── modals.html            # Reusable modal components
│   └── project-detail-panel.html  # Project detail panel template
├── 📂 resources/              # Static assets (images, icons, etc.)
└── 📂 backend/                # 🚀 Backend Server
    ├── 📄 Dockerfile          # Backend Docker config
    ├── 📄 package.json        # Node.js dependencies
    ├── 📄 server.js           # Express server entry point
    ├── 📂 config/
    │   └── database.js        # Database configuration
    ├── 📂 database/           # 🗄️ Database
    │   ├── README.md          # Database documentation
    │   ├── init.js            # Database initialization script
    │   ├── schema.sql         # Database schema definitions
    │   ├── seed.sql           # Seed data for development
    │   ├── 20260101000001-add-modules.sql       # Migration: Add modules
    │   └── 20260210000001-add-submodules.sql    # Migration: Add submodules
    ├── 📂 middleware/
    │   └── auth.js            # JWT authentication middleware
    └── 📂 routes/             # 🛣️ API Routes
        ├── README.md          # API routes documentation
        ├── auth.js            # Authentication routes
        ├── calendar.js        # Calendar events routes
        ├── messages.js        # Messaging routes
        ├── modules.js         # Modules CRUD routes
        ├── projectGroups.js   # Project groups routes (enhanced)
        ├── projects.js        # Projects routes
        ├── reports.js         # Reports routes
        ├── settings.js        # Settings routes
        ├── submodules.js      # Submodules CRUD routes
        ├── tasks.js           # Tasks routes
        ├── team.js            # Team management routes
        └── users.js           # User management routes
```

## 🚀 Getting Started

### Prerequisites

- **Docker** & **Docker Compose** (recommended)
- Or manually:
  - Node.js 20+
  - PostgreSQL 16+

### Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/digihub.git
   cd digihub
   ```

2. **Start all services**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Health Check: http://localhost:3001/api/health

### Manual Setup

1. **Setup Database**
   ```bash
   # Create PostgreSQL database
   createdb digihub
   
   # Run schema
   psql -d digihub -f backend/database/schema.sql
   
   # Seed data (optional)
   psql -d digihub -f backend/database/seed.sql
   
   # Run migrations (in order)
   psql -d digihub -f backend/database/20260101000001-add-modules.sql
   psql -d digihub -f backend/database/20260210000001-add-submodules.sql
   ```

2. **Setup Backend**
   ```bash
   cd backend
   
   # Install dependencies
   npm install
   
   # Create .env file
   cp .env.example .env
   # Edit .env with your database credentials
   
   # Start server
   npm start
   ```

3. **Serve Frontend**
   ```bash
   # Serve index.html with any static server
   npx serve .
   # Or use nginx, apache, etc.
   ```

### Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=digihub
DB_USER=digihub_user
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Server
PORT=3001
NODE_ENV=development
```

## 📡 API Documentation

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/logout` | Logout user |
| GET | `/api/auth/me` | Get current user |

### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | Get all projects |
| GET | `/api/projects/:id` | Get project by ID |
| POST | `/api/projects` | Create new project |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |

### Project Groups

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/project-groups` | Get all project groups with full hierarchy |
| POST | `/api/project-groups` | Create project group |
| PUT | `/api/project-groups/:id` | Update project group |
| DELETE | `/api/project-groups/:id` | Delete project group |

### Modules

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/modules/project/:projectId` | Get all modules for a project |
| GET | `/api/modules/:id` | Get module by ID |
| POST | `/api/modules` | Create new module |
| PUT | `/api/modules/:id` | Update module |
| DELETE | `/api/modules/:id` | Delete module |
| PATCH | `/api/modules/:id/move` | Move module to another project |
| PATCH | `/api/modules/:id/progress` | Update module progress |

### Submodules

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/submodules/module/:moduleId` | Get all submodules for a module |
| GET | `/api/submodules/:id` | Get submodule by ID |
| POST | `/api/submodules` | Create new submodule |
| PUT | `/api/submodules/:id` | Update submodule |
| DELETE | `/api/submodules/:id` | Delete submodule |
| PATCH | `/api/submodules/:id/move` | Move submodule to another module |
| PATCH | `/api/submodules/:id/progress` | Update submodule progress |

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | Get all tasks |
| GET | `/api/tasks/:id` | Get task by ID |
| POST | `/api/tasks` | Create new task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |

### Calendar

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/calendar` | Get calendar events |
| POST | `/api/calendar` | Create event |
| PUT | `/api/calendar/:id` | Update event |
| DELETE | `/api/calendar/:id` | Delete event |

### Messages

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages/channels` | Get all channels |
| GET | `/api/messages/:channelId` | Get channel messages |
| POST | `/api/messages` | Send message |

### Team

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/team` | Get team members |
| GET | `/api/team/:id` | Get member details |

### Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/dashboard` | Get dashboard stats |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | API health status |

## 🐳 Docker Services

| Service | Port | Description |
|---------|------|-------------|
| `frontend` | 3000 | Nginx serving static files |
| `backend` | 3001 | Node.js API server |
| `postgres` | 5432 | PostgreSQL database |

### Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild and start
docker-compose up -d --build

# Reset database (remove volumes)
docker-compose down -v
docker-compose up -d
```

## 🔐 Default Credentials

After seeding the database, you can login with:

| Email | Password | Role |
|-------|----------|------|
| john@digihub.io | password123 | Admin |

## 📚 Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[Documentation Index](docs/README.md)** - Overview of all documentation
- **[Projects Module Guide](docs/PROJECTS_MODULE.md)** - Original projects documentation
- **[Enhanced Features Guide](docs/PROJECTS_MODULE_ENHANCED.md)** - 4-level hierarchy & advanced features
- **[Common Errors](docs/COMMON_ERRORS.md)** - Troubleshooting guide

Additional technical documentation:

- **[Backend Routes](backend/routes/README.md)** - API endpoints reference
- **[Frontend Modules](js/README.md)** - JavaScript modules overview
- **[Database Guide](backend/database/README.md)** - Schema, migrations, and best practices

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on:
- Development workflow
- Coding standards
- Commit message format
- Pull request process

Quick steps:
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

See [CHANGELOG.md](CHANGELOG.md) for version history.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

If you have any questions or need help, please:
- Open an issue on GitHub
- Contact the development team

---

<p align="center">
  Made with ❤️ by DigiHub Team
</p>
