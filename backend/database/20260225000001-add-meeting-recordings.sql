-- Meeting Recording and Summary Database Schema
-- Stores meeting recordings and AI-generated summaries using NotebookLM/Gemini

-- Create meeting_recordings table
CREATE TABLE IF NOT EXISTS meeting_recordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    duration_seconds INT,
    mime_type VARCHAR(100) DEFAULT 'audio/webm',
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
    transcript TEXT,
    summary TEXT,
    summary_file_path VARCHAR(500),
    notebooklm_source_id VARCHAR(255), -- ID from NotebookLM if uploaded
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Create meeting_recording_participants table (who spoke in the recording)
CREATE TABLE IF NOT EXISTS meeting_recording_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recording_id UUID REFERENCES meeting_recordings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    start_time_seconds INT,
    end_time_seconds INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for recordings
CREATE INDEX IF NOT EXISTS idx_meeting_recordings_meeting ON meeting_recordings(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_recordings_status ON meeting_recordings(status);
CREATE INDEX IF NOT EXISTS idx_meeting_recordings_created_at ON meeting_recordings(created_at);
CREATE INDEX IF NOT EXISTS idx_meeting_recording_participants_recording ON meeting_recording_participants(recording_id);

COMMENT ON TABLE meeting_recordings IS 'Stores meeting audio recordings and AI-generated summaries';
COMMENT ON TABLE meeting_recording_participants IS 'Stores speaker segments from meeting recordings';

-- Add recording_url column to meetings table for easy access
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS recording_url VARCHAR(500);
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS summary_url VARCHAR(500);
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS recording_status VARCHAR(50) DEFAULT NULL;

