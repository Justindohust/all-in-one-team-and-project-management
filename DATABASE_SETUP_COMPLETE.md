# 🚀 DigiHub - Database Configuration System

Hoàn tất! Hệ thống đã được cấu hình để hỗ trợ cả Local Docker DB và Remote VPS DB.

## ✅ Đã tạo các file:

### 1. Configuration Files
- ✅ `backend/.env.example` - Template (an toàn để commit)
- ✅ `backend/.env.local` - Cấu hình Local Docker (GIT IGNORED)
- ✅ `backend/.env.remote` - Cấu hình Remote VPS (GIT IGNORED)

### 2. Utility Scripts  
- ✅ `backend/scripts/switch-db.js` - Chuyển đổi giữa local/remote
- ✅ `backend/scripts/init-remote-db.js` - Khởi tạo DB trên VPS
- ✅ `backend/scripts/db-status.js` - Kiểm tra trạng thái DB

### 3. Documentation
- ✅ `README_DATABASE.md` - Hướng dẫn chi tiết

### 4. Security
- ✅ Updated `.gitignore` - Bảo vệ thông tin nhạy cảm

## 🎯 Cách sử dụng:

### Bước 1: Chuyển sang Remote VPS Database
```bash
cd backend
npm run db:switch remote
```

### Bước 2: Khởi tạo Database trên VPS (lần đầu tiên)
```bash
npm run db:init:remote
```

### Bước 3: Kiểm tra kết nối
```bash
npm run db:status
```

### Bước 4: Chạy server với Remote DB
```bash
npm run dev
```

## 🔄 Chuyển đổi giữa Local và Remote:

```bash
# Dùng Local Docker DB
npm run db:switch local
docker-compose up -d
npm run dev

# Dùng Remote VPS DB  
npm run db:switch remote
npm run dev
```

## 🔒 Bảo mật:

✅ File `.env`, `.env.local`, `.env.remote` đã được thêm vào `.gitignore`
✅ Mật khẩu của bạn KHÔNG bao giờ được commit lên GitHub
✅ Chỉ file `.env.example` (template) được commit

## ⚠️ LƯU Ý QUAN TRỌNG:

### Trước khi chạy lần đầu trên VPS, cần cấu hình PostgreSQL:

```bash
# SSH vào VPS
ssh root@103.179.191.109

# Chỉnh sửa postgresql.conf
sudo nano /etc/postgresql/*/main/postgresql.conf
# Tìm và thay đổi:
listen_addresses = '*'

# Chỉnh sửa pg_hba.conf  
sudo nano /etc/postgresql/*/main/pg_hba.conf
# Thêm dòng:
host    all    all    0.0.0.0/0    md5

# Restart PostgreSQL
sudo systemctl restart postgresql

# Mở firewall
sudo ufw allow 5432/tcp
```

Sau đó từ máy local:
```bash
npm run db:switch remote
npm run db:init:remote
```

## 📊 NPM Scripts mới:

| Command | Mô tả |
|---------|-------|
| `npm run db:switch local` | Chuyển sang Local Docker DB |
| `npm run db:switch remote` | Chuyển sang Remote VPS DB |
| `npm run db:init:remote` | Khởi tạo database trên VPS |
| `npm run db:status` | Kiểm tra trạng thái database hiện tại |

## 🎉 Hoàn tất!

Hệ thống của bạn giờ đã sẵn sàng làm việc với cả:
- 🐳 Local Docker PostgreSQL
- ☁️ Remote VPS PostgreSQL (103.179.191.109)

Xem chi tiết trong file `README_DATABASE.md`
