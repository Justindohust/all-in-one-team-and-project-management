# Contributing to DigiHub

Thank you for your interest in contributing to DigiHub! This document provides guidelines and instructions for contributing to the project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Project Structure](#project-structure)
- [Testing](#testing)

## 📜 Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

### Our Standards

- **Be respectful** - Treat everyone with respect and kindness
- **Be collaborative** - Work together and help each other
- **Be inclusive** - Welcome diverse perspectives and experiences
- **Be constructive** - Provide helpful feedback and suggestions

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 16+
- Docker & Docker Compose (recommended)
- Git

### Setup Development Environment

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/your-username/digihub.git
   cd digihub
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies (if needed)
   cd ..
   npm install
   ```

3. **Setup database**
   ```bash
   # Create database
   createdb digihub
   
   # Run migrations
   psql -d digihub -f backend/database/schema.sql
   psql -d digihub -f backend/database/seed.sql
   psql -d digihub -f backend/database/20260101000001-add-modules.sql
   psql -d digihub -f backend/database/20260210000001-add-submodules.sql
   ```

4. **Configure environment**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Start development servers**
   ```bash
   # With Docker
   docker-compose up -d
   
   # Or manually
   cd backend && npm start
   # Serve frontend with your preferred server
   ```

## 🔄 Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates
- `chore/*` - Maintenance tasks

### Creating a Feature

1. **Create a new branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, readable code
   - Follow coding standards
   - Add tests if applicable
   - Update documentation

3. **Test your changes**
   - Run the application locally
   - Test all affected features
   - Ensure no regressions

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Go to GitHub and create a PR
   - Fill out the PR template
   - Link related issues

## 🎨 Coding Standards

### JavaScript

- Use ES6+ features
- Use `const` and `let`, avoid `var`
- Use arrow functions where appropriate
- Use template literals for string interpolation
- Keep functions small and focused
- Use meaningful variable and function names
- Add comments for complex logic

### HTML

- Use semantic HTML5 elements
- Keep markup clean and indented
- Use meaningful class names (follow Tailwind conventions)
- Ensure accessibility (ARIA labels, semantic structure)

### CSS

- Use Tailwind CSS utility classes
- Add custom CSS only when necessary
- Follow mobile-first responsive design
- Keep selectors simple and specific

### SQL

- Use uppercase for SQL keywords
- Use meaningful table and column names
- Add comments for complex queries
- Use prepared statements for security

### File Organization

- Keep related code together
- Use clear folder structure
- Add README.md in key directories
- Keep files focused on single responsibility

## 💬 Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Commit Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, no logic change)
- `refactor` - Code refactoring (no feature change)
- `perf` - Performance improvements
- `test` - Adding or updating tests
- `chore` - Maintenance tasks
- `ci` - CI/CD changes
- `build` - Build system changes

### Examples

```bash
feat(projects): add 4-level hierarchy support

fix(auth): resolve token expiration issue

docs(readme): update installation instructions

chore(deps): update dependencies to latest versions
```

## 🔍 Pull Request Process

### Before Submitting

- [ ] Code follows project coding standards
- [ ] All tests pass (if applicable)
- [ ] Documentation updated (if needed)
- [ ] Self-review completed
- [ ] No console errors or warnings
- [ ] Responsive design tested
- [ ] Branch is up to date with base branch

### PR Template

```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
Describe how you tested your changes

## Screenshots (if applicable)
Add screenshots to help explain your changes

## Related Issues
Closes #(issue number)

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code where necessary
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests (if applicable)
```

### Review Process

1. **Automated Checks** - CI/CD pipeline runs automatically
2. **Code Review** - At least one maintainer reviews the code
3. **Testing** - Changes are tested in a staging environment
4. **Approval** - PR is approved by maintainers
5. **Merge** - Code is merged to target branch

## 📁 Project Structure

### Frontend (`/js`, `/views`, `/css`)

- `js/` - JavaScript modules
  - `api.js` - API client
  - `app.js` - Main application logic
  - `projects.js` - Projects functionality
  - `tree-view.js` - Tree view component
  - etc.

- `views/` - HTML templates
  - Each feature has its own view file
  - `modals.html` - Reusable modal components

- `css/` - Stylesheets
  - `input.css` - Tailwind CSS source

### Backend (`/backend`)

- `routes/` - API endpoints
  - Each resource has its own route file
  - Follow RESTful conventions

- `middleware/` - Express middleware
  - Authentication, validation, error handling

- `database/` - Database scripts
  - Schema, seeds, migrations

- `config/` - Configuration files

### Documentation (`/docs`)

- User guides and API documentation
- Keep documentation up to date with changes

## 🧪 Testing

### Manual Testing Checklist

- [ ] Feature works as expected
- [ ] No console errors
- [ ] Responsive on mobile/tablet/desktop
- [ ] Accessible (keyboard navigation, screen readers)
- [ ] Works in major browsers (Chrome, Firefox, Safari, Edge)
- [ ] No performance regressions

### Database Testing

When making database changes:
1. Test migration scripts on clean database
2. Test rollback procedures
3. Verify data integrity
4. Check foreign key constraints
5. Test with sample data

## 📚 Additional Resources

- [Project README](README.md) - Project overview
- [API Documentation](backend/routes/README.md) - API reference
- [Database Guide](backend/database/README.md) - Database schema
- [Changelog](CHANGELOG.md) - Version history
- [Feature Guides](docs/) - Detailed feature documentation

## 🤝 Getting Help

If you need help or have questions:

- **Documentation** - Check docs/ directory
- **Issues** - Search existing issues or create a new one
- **Discussions** - Start a discussion on GitHub
- **Email** - Contact the development team

## 🎉 Recognition

Contributors are recognized in:
- Project README.md
- Release notes
- Special thanks section

Thank you for contributing to DigiHub! 🚀
