# Documentation

Thư mục này chứa tất cả documentation cho DigiHub project.

## Danh sách Documents

### Core Documentation
- [README.md](../README.md) - Main project README (ở root)
- [CHANGELOG.md](../CHANGELOG.md) - Version history và change log
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Contributing guidelines
- [LICENSE](../LICENSE) - MIT License
- [COMMON_ERRORS.md](./COMMON_ERRORS.md) - Troubleshooting guide và common errors

### Module Documentation
- [PROJECTS_MODULE.md](./PROJECTS_MODULE.md) - Original projects module documentation
- [PROJECTS_MODULE_ENHANCED.md](./PROJECTS_MODULE_ENHANCED.md) - Enhanced projects module với 4-level hierarchy

### Technical Documentation
- [Backend Routes](../backend/routes/README.md) - API endpoints và usage guide
- [Frontend Modules](../js/README.md) - JavaScript modules overview
- [Database Guide](../backend/database/README.md) - Schema, migrations, migrations guide

### Configuration Files
- [.editorconfig](../.editorconfig) - Editor configuration cho consistent formatting
- [.prettierrc](../.prettierrc) - Prettier configuration
- [.gitignore](../.gitignore) - Git ignore rules

## Structure

```
docs/
├── README.md                          # Documentation index (this file)
├── COMMON_ERRORS.md                   # Troubleshooting guide
├── PROJECTS_MODULE.md                 # Projects module v1 documentation
└── PROJECTS_MODULE_ENHANCED.md        # Projects module v2 (4-level hierarchy)

Root level docs:
├── README.md                          # Main project overview
├── CHANGELOG.md                       # Version history
├── CONTRIBUTING.md                    # Contribution guidelines
└── LICENSE                            # MIT License

Technical docs:
├── backend/routes/README.md           # API routes documentation
├── backend/database/README.md         # Database & migrations guide
└── js/README.md                       # Frontend JavaScript modules
```

## Quick Links

### For Developers
- **Getting Started**: [Main README](../README.md#getting-started)
- **API Reference**: [Backend Routes](../backend/routes/README.md)
- **Database Setup**: [Database Guide](../backend/database/README.md)
- **Contributing**: [Contributing Guidelines](../CONTRIBUTING.md)

### For Users
- **Features Overview**: [Main README](../README.md#features)
- **Projects Guide**: [Enhanced Projects Module](./PROJECTS_MODULE_ENHANCED.md)
- **Troubleshooting**: [Common Errors](./COMMON_ERRORS.md)

### Recent Updates
- **Latest Changes**: [CHANGELOG](../CHANGELOG.md)
- **File Organization**: Completed 2026-02-10
  - Created `docs/` directory for all documentation
  - Created `archive/` directory for backup files
  - Added comprehensive README files in subdirectories
  - Standardized migration file naming convention
  - Added code quality tools (.editorconfig, .prettierrc)

## Guidelines

### Writing Documentation
1. Use clear, concise language
2. Include code examples where applicable
3. Keep documentation up-to-date with code changes
4. Use proper Markdown formatting

### Naming Conventions
- Use kebab-case for file names: `my-document.md`
- Use UPPERCASE for important docs: `README.md`, `CHANGELOG.md`
- Include version or date if applicable: `api-v2.md`

### Organization
- Keep related docs together
- Use subdirectories for large documentation sets
- Link between related documents
- Maintain a table of contents in this README

## Contributing

When adding new documentation:
1. Create the file in appropriate location
2. Update this README with a link
3. Follow the naming conventions
4. Ensure proper formatting
5. Review for accuracy

---

**Last Updated**: February 10, 2026
