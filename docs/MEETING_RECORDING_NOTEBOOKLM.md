# Meeting Recording & AI Summary

## Overview

This feature allows users to:
- Record audio during meetings directly in the browser
- Automatically upload recordings to the backend
- Generate AI-powered summaries using free Google AI API
- Download summaries as text files

## Architecture

```
Browser → Backend API → Google AI Studio (Free API)
                ↓
         Local Storage (audio, summaries)
```

**Note:** This implementation uses Google AI Studio which offers **free API access** without requiring a credit card.

### Files Modified/Created

| File | Description |
|------|-------------|
| `backend/database/20260225000001-add-meeting-recordings.sql` | Database schema for recordings |
| `backend/routes/notebooklm.js` | Backend API routes |
| `backend/server.js` | Added notebooklm routes & static file serving |
| `js/api.js` | Added NotebookLM API methods |
| `js/meetings.js` | Added recording functionality |
| `views/meetings.html` | Added recording UI buttons |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/notebooklm/config` | GET | Check API configuration |
| `/api/notebooklm/summarize` | POST | Generate AI summary from text |
| `/api/notebooklm/upload` | POST | Upload audio (storage only) |
| `/api/notebooklm/recording/:meetingId` | GET | Get recording & summary |
| `/api/notebooklm/status/:meetingId` | GET | Get processing status |

---

# Hướng Dẫn Cài Đặt & Sử Dụng

## Bước 1: Lấy Google AI API Key (Miễn Phí)

### 1.1. Đăng nhập Google AI Studio

1. Truy cập: **https://aistudio.google.com/app/apikey**
2. Đăng nhập bằng tài khoản Google
3. Click **"Create API Key"**
4. Copy API key được tạo

### 1.2. Lưu API Key vào Backend

Tạo file `.env` trong thư mục `backend/`:

```bash
# .env trong backend/
GOOGLE_AI_API_KEY=AIzaSy....................................
```

**Lưu ý:** API key này miễn phí, có giới hạn usage nhưng đủ để test và sử dụng cá nhân.

---

## Bước 2: Cấu Hình Database

### 2.1. Chạy Database Migration

```bash
cd backend
psql -U postgres -d digihub -f database/20260225000001-add-meeting-recordings.sql
```

Hoặc chạy qua script init:

```bash
cd backend
node database/init.js
```

---

## Bước 3: Cấu Hình Backend

### 3.1. Cập nhật Environment Variables

Thêm vào file `backend/.env`:

```bash
# Google AI Configuration (Free)
GOOGLE_AI_API_KEY=AIzaSy....................................

# Optional: Fallback nếu dùng VPS
# NOTEBOOKLM_VPS_URL=http://YOUR_VPS_IP:3001/api/notebooklm/config
# NOTEBOOKLM_INTERNAL_KEY=your-secret-key
```

### 3.2. Khởi động Backend

```bash
cd backend
npm start
# hoặc
node server.js
```

---

## Bước 4: Sử Dụng Tính Năng Recording

### 4.1. Giao diện người dùng

1. Mở ứng dụng DigiHub
2. Vào mục **Meetings**
3. Mở chi tiết một cuộc họp
4. Sẽ thấy các nút recording trong tab **Recording**

### 4.2. Quy trình ghi âm và tạo AI Summary

```
1. Ghi âm cuộc họp:
   a. Click "Start Recording"
      → Browser xin quyền microphone
      → Bắt đầu ghi âm

   b. Cuộc họp diễn ra bình thường
      → Audio được lưu trong browser

   c. Click "Stop Recording"
      → Audio được convert sang base64
      → Upload lên server và lưu vào thư mục recordings/

2. Tạo AI Summary:
   a. Sau khi ghi âm, hệ thống sẽ chuyển sang tab Summary
   b. Người dùng viết ghi chú/nội dung cuộc họp vào ô text
   c. Click nút "Generate AI Summary"
   d. AI sẽ tạo summary từ nội dung người dùng nhập

3. Xem kết quả:
   → AI Summary hiển thị bên dưới
   → Có thể copy nội dung
```

---

## Bước 5: Kiểm Tra & Debug

### 5.1. Kiểm tra API Key

```bash
# Test trực tiếp Google AI API
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

### 5.2. Kiểm tra Backend

```bash
curl http://localhost:3001/api/notebooklm/config
```

### 5.3. Xem logs

```bash
# Backend logs
tail -f backend/logs/app.log
```

---

## Bước 6: Xử Lý Sự Cố Thường Gặp

### Lỗi: "API key not valid"

**Nguyên nhân:** Google AI API key không đúng hoặc hết hạn

**Cách fix:**
1. Vào https://aistudio.google.com/app/apikey
2. Tạo API key mới
3. Cập nhật vào file .env
4. Restart backend

### Lỗi: "Quota exceeded"

**Nguyên nhân:** Đã hết quota miễn phí

**Cách fix:**
1. Chờ đến ngày hôm sau (quota reset)
2. Hoặc đăng ký Google Cloud với billing để tăng quota

### Lỗi: "MediaRecorder is not defined"

**Nguyên nhân:** Browser không hỗ trợ MediaRecorder

**Cách fix:**
- Sử dụng Chrome/Edge/Firefox phiên bản mới
- Đảm bảo HTTPS (required cho microphone)

### Lỗi: Database "relation does not exist"

**Nguyên nhân:** Chưa chạy migration

**Cách fix:**
```bash
psql -U postgres -d digihub -f database/20260225000001-add-meeting-recordings.sql
```

---

## Tóm Tắt Checklist

- [ ] **Google AI:** Lấy API key từ https://aistudio.google.com/app/apikey
- [ ] **Backend:** Thêm GOOGLE_AI_API_KEY vào .env
- [ ] **Database:** Chạy migration 20260225000001-add-meeting-recordings.sql
- [ ] **Backend:** Khởi động lại server
- [ ] **Browser:** Test recording với HTTPS

---

## Lưu Ý Quan Trọng

1. **HTTPS bắt buộc:** Browser chỉ cho phép ghi âm qua HTTPS
2. **Microphone permission:** User phải cho phép microphone
3. **Giới hạn audio:** Khuyến nghị dưới 20MB (~20 phút)
4. **Miễn phí:** Google AI Studio free tier đủ cho sử dụng cá nhân
5. **Backup:** Nếu cần bảo mật hơn, có thể dùng VPS như documentation cũ