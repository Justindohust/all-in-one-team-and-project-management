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

