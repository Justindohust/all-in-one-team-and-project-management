# Meeting Recording & NotebookLM Integration

## Overview

This feature allows users to:
- Record audio during meetings directly in the browser
- Automatically upload recordings to be processed by Gemini AI
- Generate AI-powered summaries of the meeting
- Download summaries as text files
- Store API credentials securely on a remote VPS

## Architecture

### Security Model

```
Browser → Backend API → VPS (for credentials) → Gemini API
                ↓
         Local Storage (audio, summaries)
```

**Key Security Features:**
- API credentials stored on user's VPS (not in code)
- Session-based credential caching (5-minute expiration)
- Credentials cleared automatically after processing completes
- No sensitive data exposed to frontend

### Files Modified/Created

| File | Description |
|------|-------------|
| `backend/database/20260225000001-add-meeting-recordings.sql` | Database schema for recordings |
| `backend/routes/notebooklm.js` | Backend API routes |
| `backend/server.js` | Added notebooklm routes & static file serving |
| `js/api.js` | Added NotebookLM API methods |
| `js/meetings.js` | Added recording functionality |
| `views/meetings.html` | Added recording UI buttons |

## Database Schema

### New Tables

```sql
-- meeting_recordings: stores audio files and AI summaries
-- meeting_recording_participants: tracks speakers

-- Added to meetings table:
-- - recording_url: path to audio file
-- - summary_url: path to summary text file
-- - recording_status: pending/processing/completed/failed
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/notebooklm/config` | GET | Validate VPS connection |
| `/api/notebooklm/session/start` | POST | Start session, fetch credentials |
| `/api/notebooklm/session/end` | POST | End session, clear credentials |
| `/api/notebooklm/upload` | POST | Upload audio, process with Gemini |
| `/api/notebooklm/recording/:meetingId` | GET | Get recording & summary |
| `/api/notebooklm/status/:meetingId` | GET | Get processing status |

## VPS Configuration

### Required Environment Variables on VPS

Create a config endpoint on your VPS that returns:

```json
{
  "apiKey": "your-gemini-api-key",
  "projectId": "your-gcp-project-id",
  "location": "us-central1"
}
```

### Backend Configuration

In `backend/env.remote` or environment:
```
NOTEBOOKLM_VPS_URL=http://YOUR_VPS_IP:3001/api/notebooklm/config
NOTEBOOKLM_INTERNAL_KEY=your-secret-key
```

## Frontend Usage

### Recording Controls

Located in Meeting Detail Modal:

1. **Start Recording** - Begins browser audio capture
2. **Stop Recording** - Stops capture, uploads to server
3. **View Summary** - Shows AI-generated summary (after processing)

### Flow

1. User opens meeting detail
2. Clicks "Start Recording" → browser requests microphone
3. Meeting proceeds normally
4. User clicks "Stop Recording"
5. Audio uploaded to server
6. Server processes with Gemini AI:
   - Transcribes audio
   - Generates summary
   - Saves summary to file
7. User sees "View Summary" button
8. Click to view/download summary

## Session Management

- Session starts when user initiates recording
- Credentials cached for 5 minutes
- Session ends automatically after processing
- Manual session end via API `/session/end`

## Known Limitations

- Browser must support MediaRecorder API
- Requires microphone permission
- Gemini 2.0 Flash has audio size limits (~20MB recommended)
- Transcription quality depends on audio clarity




---

# Hướng Dẫn Cài Đặt & Sử Dụng

## Bước 1: Chuẩn Bị VPS Để Lưu API Credentials

### 1.1. Tạo API Endpoint trên VPS

Bạn cần một VPS riêng để lưu trữ API key Gemini một cách bảo mật. Tạo file `server-notebooklm.js` trên VPS:

```javascript
// server-notebooklm.js (trên VPS)
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// API endpoint trả về credentials
app.get('/api/notebooklm/config', (req, res) => {
    // Verify internal key
    const internalKey = req.headers['x-internal-key'];
    if (internalKey !== 'digihub-secret-key') {
        return res.status(403).json({ error: 'Invalid key' });
    }

    res.json({
        apiKey: process.env.GEMINI_API_KEY,
        projectId: process.env.GEMINI_PROJECT_ID,
        location: process.env.GEMINI_LOCATION || 'us-central1'
    });
});

const PORT = 3001;
app.listen(PORT, () => console.log(`NotebookLM config server running on port ${PORT}`));
```

### 1.2. Cài đặt dependencies trên VPS

```bash
cd /path/to/vps-folder
npm init -y
npm install express cors
```

### 1.3. Thiết lập Environment Variables trên VPS

Tạo file `.env`:

```bash
# .env trên VPS
GEMINI_API_KEY=AIzaSy....................................
GEMINI_PROJECT_ID=your-project-id
GEMINI_LOCATION=us-central1
```

### 1.4. Chạy server trên VPS

```bash
node server-notebooklm.js
```

Hoặc chạy với PM2 để giữ hoạt động:

```bash
npm install -g pm2
pm2 start server-notebooklm.js
pm2 save
```

---

## Bước 2: Cấu Hình Backend Chính

### 2.1. Thêm Environment Variables

Trên server/backend chính, thêm vào `.env`:

```bash
# NotebookLM Configuration
NOTEBOOKLM_VPS_URL=http://103.179.191.109:3001/api/notebooklm/config
NOTEBOOKLM_INTERNAL_KEY=digihub-secret-key

# Fallback (nếu cần test local)
GEMINI_API_KEY=AIzaSy....................................
GEMINI_PROJECT_ID=your-project-id
GEMINI_LOCATION=us-central1
```

### 2.2. Chạy Database Migration

```bash
cd backend
psql -U postgres -d digihub -f database/20260225000001-add-meeting-recordings.sql
```

Hoặc chạy qua script init:

```bash
cd backend
node database/init.js
```

### 2.3. Khởi động Backend

```bash
cd backend
npm start
# hoặc
node server.js
```

---

## Bước 3: Sử Dụng Tính Năng Recording

### 3.1. Giao diện người dùng

1. Mở ứng dụng DigiHub
2. Vào mục **Meetings**
3. Mở chi tiết một cuộc họp
4. Sẽ thấy 3 nút:
   - **Start Recording** - Bắt đầu ghi âm
   - **Stop Recording** - Dừng và upload
   - **View Summary** - Xem tóm tắt AI

### 3.2. Quy trình ghi âm

```
1. Click "Start Recording"
   → Browser xin quyền microphone
   → Bắt đầu ghi âm

2. Cuộc họp diễn ra bình thường
   → Audio được lưu trong browser

3. Click "Stop Recording"
   → Audio được convert sang base64
   → Upload lên server

4. Server xử lý:
   a. Lưu file audio vào /backend/uploads/recordings/
   b. Gọi Gemini API để transcript
   c. Gọi Gemini API để tạo summary
   d. Lưu summary vào file text

5. Hiển thị nút "View Summary"
   → User click để xem nội dung
```

### 3.3. Xem Recording đã có

- Vào meeting detail
- Nếu đã có recording → hiển thị nút "View Summary"
- Audio file: `/uploads/recordings/meeting_xxx.webm`
- Summary file: `/uploads/summaries/meeting_xxx.txt`

---

## Bước 4: Kiểm Tra & Debug

### 4.1. Kiểm tra kết nối VPS

```bash
curl http://103.179.191.109:3001/api/notebooklm/config \
  -H "X-Internal-Key: digihub-secret-key"
```

Response đúng:
```json
{
  "apiKey": "AIzaSy...",
  "projectId": "...",
  "location": "us-central1"
}
```

### 4.2. Kiểm tra API từ Backend chính

```bash
curl http://localhost:3000/api/notebooklm/config
```

### 4.3. Test upload recording

```bash
# Tạo file audio test (ả sử cógi file test.webm)
curl -X POST http://localhost:3000/api/notebooklm/upload \
  -H "Content-Type: application/json" \
  -d '{
    "meetingId": "YOUR-MEETING-ID",
    "audioData": "BASE64-AUDIO-DATA",
    "duration": 60
  }'
```

### 4.4. Xem logs

```bash
# Backend logs
tail -f backend/logs/app.log

# VPS logs
tail -f /var/log/pm2/logs/server-notebooklm.log
```

---

## Bước 5: Xử Lý Sự Cố Thường Gặp

### Lỗi: "NotebookLM credentials not available"

**Nguyên nhân:** Không kết nối được VPS hoặc API key không đúng

**Cách fix:**
1. Kiểm tra VPS có đang chạy không: `pm2 list`
2. Kiểm tra firewall: `ufw allow 3001`
3. Kiểm tra logs VPS: `pm2 logs server-notebooklm`
4. Verify API key trên VPS: `echo $GEMINI_API_KEY`

### Lỗi: "Failed to transcribe audio"

**Nguyên nhân:** Audio quá lớn hoặc format không đúng

**Cách fix:**
1. Giới hạn độ dài recording ~20 phút
2. Đảm bảo format là `audio/webm`
3. Kiểm tra quota Gemini API

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

## Bước 6: Cấu Trúc Thư Mục Sau Khi Cài Đặt

```
digiHub/
├── backend/
│   ├── uploads/
│   │   └── recordings/
│   │       ├── meeting_uuid_123.webm
│   │       └── meeting_uuid_456.webm
│   ├── routes/
│   │   └── notebooklm.js
│   └── server.js
├── js/
│   ├── api.js          # đã thêm NotebookLM methods
│   └── meetings.js     # đã thêm recording logic
├── views/
│   └── meetings.html   # đã thêm recording buttons
└── docs/
    └── MEETING_RECORDING_NOTEBOOKLM.md

VPS:
├── server-notebooklm.js
├── .env (GEMINI_API_KEY=...)
└── package.json
```

---

## Tóm Tắt Checklist

- [ ] **VPS:** Cài đặt server-notebooklm.js và chạy
- [ ] **VPS:** Đặt GEMINI_API_KEY trong .env
- [ ] **Backend:** Thêm NOTEBOOKLM_VPS_URL vào .env
- [ ] **Database:** Chạy migration 20260225000001-add-meeting-recordings.sql
- [ ] **Backend:** Khởi động lại server
- [ ] **Browser:** Test recording với HTTPS

---

## Lưu Ý Quan Trọng

1. **HTTPS bắt buộc:** Browser chỉ cho phép ghi âm qua HTTPS
2. **Microphone permission:** User phải cho phép microphone
3. **Giới hạn audio:** Khuyến nghị dưới 20MB (~20 phút)
4. **Bảo mật:** Không bao giờ commit API key vào code
5. **VPS firewall:** Mở port 3001 cho phép kết nối từ backend