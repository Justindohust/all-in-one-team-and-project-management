-- Meetings Module Database Schema
-- Created for DigiHub Meeting Management

-- Create meetings table
CREATE TABLE IF NOT EXISTS meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL DEFAULT '01234567-89ab-cdef-0123-456789abcdef',
    organizer_id UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    location VARCHAR(255),
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern VARCHAR(50),
    recurrence_end_date DATE,
    status VARCHAR(50) DEFAULT 'scheduled',
    minutes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create meeting_participants table
CREATE TABLE IF NOT EXISTS meeting_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(meeting_id, user_id)
);

-- Create meeting_notifiees table (people who receive meeting minutes)
CREATE TABLE IF NOT EXISTS meeting_notifiees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(meeting_id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_meetings_workspace ON meetings(workspace_id);
CREATE INDEX IF NOT EXISTS idx_meetings_start_time ON meetings(start_time);
CREATE INDEX IF NOT EXISTS idx_meetings_organizer ON meetings(organizer_id);
CREATE INDEX IF NOT EXISTS idx_meetings_is_recurring ON meetings(is_recurring);
CREATE INDEX IF NOT EXISTS idx_meeting_participants_meeting ON meeting_participants(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_participants_user ON meeting_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_meeting_notifiees_meeting ON meeting_notifiees(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_notifiees_user ON meeting_notifiees(user_id);

-- Add foreign key from meetings to workspace
ALTER TABLE meetings 
ADD CONSTRAINT fk_meetings_workspace 
FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

COMMENT ON TABLE meetings IS 'Stores meeting information including one-time and recurring meetings';
COMMENT ON TABLE meeting_participants IS 'Stores participants for each meeting';
COMMENT ON TABLE meeting_notifiees IS 'Stores users who will receive meeting minutes';

-- Insert sample meetings data (optional)
-- INSERT INTO meetings (workspace_id, organizer_id, title, description, start_time, end_time, location, is_recurring, recurrence_pattern, status)
-- VALUES 
--   ('01234567-89ab-cdef-0123-456789abcdef', 'user-uuid', 'Weekly Standup', 'Weekly team sync', '2026-02-10 09:00:00+00', '2026-02-10 09:30:00+00', 'Virtual', true, 'weekly', 'scheduled'),
--   ('01234567-89ab-cdef-0123-456789abcdef', 'user-uuid', 'Sprint Planning', 'Plan next sprint tasks', '2026-02-12 14:00:00+00', '2026-02-12 15:00:00+00', 'Room A', false, NULL, 'scheduled');

