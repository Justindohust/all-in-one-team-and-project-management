# Meeting Recording & AI Summary

## Overview

This feature allows users to:
- Record audio during meetings directly in the browser
- Automatically upload recordings to the backend
- Generate AI-powered summaries using **browser automation** (no API key required)
- Copy meeting notes to clipboard and use free AI chat tools

## Architecture

```
Browser → Meeting Notes → Clipboard → AI Chat (Google AI Studio) → Copy Result → DigiHub
```

**Note:** This implementation uses **browser automation** - your meeting notes are copied to clipboard, you paste them into a free AI chat, and copy the result back. No API key required!

### Files Modified/Created

| File | Description |
|------|-------------|
| `backend/routes/notebooklm.js` | Backend API routes |
| `backend/scripts/meeting_summary_helper.js` | Browser automation helper |
| `js/api.js` | Added API methods |
| `js/meetings.js` | Added recording & AI summary functionality |
| `views/meetings.html` | Recording UI & AI summary button |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/notebooklm/config` | GET | Check configuration |
| `/api/notebooklm/summarize` | POST | Opens browser with notes |
| `/api/notebooklm/save-summary` | POST | Save user-generated summary |
| `/api/notebooklm/upload` | POST | Upload audio (storage only) |
| `/api/notebooklm/recording/:meetingId` | GET | Get recording & summary |
| `/api/notebooklm/status/:meetingId` | GET | Get processing status |

---

# Hướng Dẫn Sử Dụng

## Không Cần API Key!

Với cách tiếp cận này, bạn **không cần bất kỳ API key nào**. Tất cả đều miễn phí!

## Bước 1: Ghi Âm Cuộc Họp

1. Mở ứng dụng DigiHub
2. Vào mục **Meetings**
3. Mở chi tiết một cuộc họp
4. Chuyển sang tab **Recording**
5. Click **"Start Recording"** để bắt đầu ghi âm
6. Sau khi họp xong, click **"Stop Recording"**
7. Audio được lưu lên server

## Bước 2: Tạo AI Summary

Sau khi ghi âm (hoặc không cần ghi âm, chỉ cần viết ghi chú):

1. Chuyển sang tab **Summary**
2. Viết nội dung cuộc họp vào ô **Meeting Summary**
3. Viết kết luận và action items vào ô **Conclusions & Action Items**
4. Click nút **"Generate AI Summary"**

### Quy Trình Tạo Summary:

```
1. Click "Generate AI Summary"
   → Meeting notes được copy vào clipboard
   → Trình duyệt mở Google AI Studio

2. Trong Google AI Studio:
   → Paste ghi chú (Ctrl+V)
   → Hỏi AI: "Summarize with Key Topics, Decisions, Action Items"
   → Copy kết quả AI

3. Quay lại DigiHub:
   → Paste kết quả vào ô Summary
   → Click "Save" để lưu
```

## Các AI Chat Miễn Phí Có Thể Dùng:

| Trang Web | URL | Lưu ý |
|-----------|-----|-------|
| Google AI Studio | https://aistudio.google.com/app/chats | Cần đăng nhập Google |
| HuggingFace Chat | https://huggingface.co/chat | Miễn phí, không cần login |
| Poe | https://poe.com | Miễn phí với limit |

---

## Tóm Tắt Checklist

- [ ] **Ghi âm:** Sử dụng tab Recording để ghi âm cuộc họp
- [ ] **Viết notes:** Viết ghi chú vào tab Summary
- [ ] **Tạo summary:** Click "Generate AI Summary"
- [ ] **Sử dụng AI:** Paste vào AI chat, copy kết quả
- [ ] **Lưu:** Paste kết quả vào DigiHub và lưu

---

## Lưu Ý Quan Trọng

1. **Miễn phí hoàn toàn:** Không cần API key, không tốn phí
2. **Browser yêu cầu:** Chrome, Edge, hoặc Firefox mới nhất
3. **Microphone permission:** Cần cho phép microphone để ghi âm
4. **HTTPS:** Ghi âm chỉ hoạt động qua HTTPS