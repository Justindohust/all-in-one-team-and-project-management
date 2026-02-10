# Database Configuration Guide

Hệ thống hỗ trợ cả **Local Docker Database** và **Remote VPS Database** với khả năng chuyển đổi linh hoạt.

## 🎯 Quick Start

### 1. Cấu hình lần đầu

```bash
cd backend

# Copy template và chỉnh sửa nếu cần
# File .env.local và .env.remote đã được tạo sẵn
```

### 2. Chuyển đổi giữa Local và Remote

```bash
# Chuyển sang Local Docker DB
npm run db:switch local

# Chuyển sang Remote VPS DB
npm run db:switch remote
```

### 3. Khởi tạo Database

#### Local (Docker)
```bash
# Đảm bảo Docker đang chạy
docker-compose up -d postgres

# Khởi tạo database (tự động khi container start lần đầu)
# Hoặc chạy lại:
npm run db:init
```

#### Remote (VPS)
```bash
# Chuyển sang remote
npm run db:switch remote

# Khởi tạo database trên VPS
npm run db:init:remote
```

### 4. Kiểm tra trạng thái

```bash
npm run db:status
```

## 📁 File Structure

```
backend/
├── .env                  # Active config (Git ignored)
├── .env.example          # Template
├── .env.local           # Local Docker config (Git ignored)
├── .env.remote          # Remote VPS config (Git ignored)
├── config/
│   └── database.js      # Database connection pool
├── database/
│   ├── schema.sql       # Database schema
│   ├── seed.sql         # Seed data
│   └── *.sql           # Migration files
└── scripts/
    ├── switch-db.js     # Switch between local/remote
    ├── init-remote-db.js # Initialize remote DB
    └── db-status.js     # Check DB status
```

## 🔧 Configuration Details

### Local Docker Database
- **Host:** localhost
- **Port:** 5432
- **Database:** digihub
- **User:** digihub_user
- **Password:** digihub_secret_2026

### Remote VPS Database
- **Host:** 103.179.191.109
- **Port:** 5432
- **Database:** digihub
- **User:** postgres
- **Password:** (See .env.remote)

## 🚀 Common Tasks

### Start Development (Local)
```bash
npm run db:switch local
docker-compose up -d
npm run dev
```

### Deploy to Production (Remote)
```bash
npm run db:switch remote
npm run db:init:remote  # First time only
npm start
```

### Check Current Database
```bash
npm run db:status
```

### Backup Database
```bash
# Local
docker exec digihub-postgres pg_dump -U digihub_user digihub > backup.sql

# Remote
pg_dump -h 103.179.191.109 -U postgres digihub > backup.sql
```

### Restore Database
```bash
# Local
docker exec -i digihub-postgres psql -U digihub_user digihub < backup.sql

# Remote
psql -h 103.179.191.109 -U postgres digihub < backup.sql
```

## 🔒 Security Notes

1. **NEVER commit .env files** - They are in .gitignore
2. File `.env.example` là template an toàn để commit
3. File `.env.local` và `.env.remote` chứa mật khẩu thật - KHÔNG commit
4. Thay đổi `JWT_SECRET` trong production
5. Sử dụng mật khẩu mạnh cho remote database

## 🐛 Troubleshooting

### Cannot connect to local database
```bash
# Check if Docker is running
docker ps

# Restart containers
docker-compose down
docker-compose up -d

# Check logs
docker-compose logs postgres
```

### Cannot connect to remote database
1. Kiểm tra VPS có cho phép kết nối từ xa không
2. Kiểm tra firewall có mở port 5432
3. Kiểm tra `postgresql.conf`:
   ```
   listen_addresses = '*'
   ```
4. Kiểm tra `pg_hba.conf`:
   ```
   host    all    all    0.0.0.0/0    md5
   ```

### Database exists but no tables
```bash
# Re-run initialization
npm run db:init:remote
```

## 📝 NPM Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run db:switch local` | Switch to local Docker DB |
| `npm run db:switch remote` | Switch to remote VPS DB |
| `npm run db:init:remote` | Initialize remote database |
| `npm run db:status` | Check current database status |
| `npm run db:init` | Initialize local database |
| `npm run dev` | Start development server |
| `npm start` | Start production server |

## 🌐 Remote VPS Setup (First Time)

Trên VPS, đảm bảo PostgreSQL được cấu hình đúng:

```bash
# 1. Install PostgreSQL (nếu chưa có)
sudo apt update
sudo apt install postgresql postgresql-contrib

# 2. Configure PostgreSQL to accept remote connections
sudo nano /etc/postgresql/*/main/postgresql.conf
# Uncomment and change:
# listen_addresses = '*'

sudo nano /etc/postgresql/*/main/pg_hba.conf
# Add:
# host    all    all    0.0.0.0/0    md5

# 3. Restart PostgreSQL
sudo systemctl restart postgresql

# 4. Configure firewall
sudo ufw allow 5432/tcp
```

Sau đó từ local machine:
```bash
npm run db:switch remote
npm run db:init:remote
```
