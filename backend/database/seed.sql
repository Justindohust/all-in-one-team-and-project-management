-- DigiHub Sample Data
-- Run after schema.sql

-- Insert sample users (password is 'password123' hashed with bcrypt)
INSERT INTO users (id, email, password_hash, first_name, last_name, role, job_title, bio, is_online) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'john@digihub.io', '$2a$10$rQZk9Vl8xQ5nF5xJ5Y5ZOuVt5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5', 'John', 'Doe', 'admin', 'Project Manager', 'Experienced project manager with 10+ years in tech industry.', true),
('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'alice@digihub.io', '$2a$10$rQZk9Vl8xQ5nF5xJ5Y5ZOuVt5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5', 'Alice', 'Smith', 'manager', 'Backend Developer', 'Full-stack developer passionate about clean code.', true),
('c3d4e5f6-a7b8-9012-cdef-345678901234', 'mike@digihub.io', '$2a$10$rQZk9Vl8xQ5nF5xJ5Y5ZOuVt5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5', 'Mike', 'Kim', 'member', 'UI/UX Designer', 'Creative designer focused on user experience.', false),
('d4e5f6a7-b8c9-0123-defa-456789012345', 'tina@digihub.io', '$2a$10$rQZk9Vl8xQ5nF5xJ5Y5ZOuVt5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5', 'Tina', 'Nguyen', 'member', 'Frontend Developer', 'React enthusiast building beautiful interfaces.', true);

-- Insert default workspace
INSERT INTO workspaces (id, name, description, owner_id) VALUES
('01234567-89ab-cdef-0123-456789abcdef', 'DigiHub Team', 'Main workspace for DigiHub development team', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890');

-- Add all users to workspace
INSERT INTO workspace_members (workspace_id, user_id, role) VALUES
('01234567-89ab-cdef-0123-456789abcdef', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'admin'),
('01234567-89ab-cdef-0123-456789abcdef', 'b2c3d4e5-f6a7-8901-bcde-f23456789012', 'manager'),
('01234567-89ab-cdef-0123-456789abcdef', 'c3d4e5f6-a7b8-9012-cdef-345678901234', 'member'),
('01234567-89ab-cdef-0123-456789abcdef', 'd4e5f6a7-b8c9-0123-defa-456789012345', 'member');

-- Insert project groups
INSERT INTO project_groups (id, workspace_id, name, description, color, icon, sort_order) VALUES
('11111111-1111-1111-1111-111111111111', '01234567-89ab-cdef-0123-456789abcdef', 'DigiFact', 'Main product development', '#6366f1', 'folder', 1),
('22222222-2222-2222-2222-222222222222', '01234567-89ab-cdef-0123-456789abcdef', 'Events', 'Event management and marketing', '#f59e0b', 'calendar', 2),
('33333333-3333-3333-3333-333333333333', '01234567-89ab-cdef-0123-456789abcdef', 'Internal', 'Internal tools and processes', '#10b981', 'cog', 3);

-- Insert projects
INSERT INTO projects (id, group_id, name, description, color, status, is_favorite, progress, created_by) VALUES
('10000000-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'DigiFact Framework', 'Core framework development', '#6366f1', 'active', true, 75, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('20000000-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'DigiFact Branding', 'Brand identity and design system', '#ec4899', 'active', false, 60, 'c3d4e5f6-a7b8-9012-cdef-345678901234'),
('30000000-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'DigiFact Contest', 'Marketing contest campaign', '#f59e0b', 'active', false, 40, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('40000000-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'TechXpo 2025', 'Annual technology expo', '#10b981', 'active', true, 40, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('50000000-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', 'Webinar Series', 'Monthly webinar events', '#8b5cf6', 'active', false, 25, 'b2c3d4e5-f6a7-8901-bcde-f23456789012'),
('60000000-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333', 'Mobile App', 'DigiHub mobile application', '#ef4444', 'active', false, 90, 'd4e5f6a7-b8c9-0123-defa-456789012345');

-- Insert tasks
INSERT INTO tasks (id, project_id, title, description, status, priority, assignee_id, created_by, due_date) VALUES
('71111111-1111-1111-1111-111111111111', '20000000-2222-2222-2222-222222222222', 'Design new landing page', 'Create mockups for the new landing page with modern design', 'in_progress', 'high', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '2026-01-28'),
('72222222-2222-2222-2222-222222222222', '10000000-1111-1111-1111-111111111111', 'API Integration Testing', 'Complete integration tests for all API endpoints', 'todo', 'medium', 'b2c3d4e5-f6a7-8901-bcde-f23456789012', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '2026-01-30'),
('73333333-3333-3333-3333-333333333333', '40000000-4444-4444-4444-444444444444', 'Prepare TechXpo presentation', 'Create presentation slides for the TechXpo event', 'in_review', 'low', 'c3d4e5f6-a7b8-9012-cdef-345678901234', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '2026-02-05'),
('74444444-4444-4444-4444-444444444444', '10000000-1111-1111-1111-111111111111', 'Setup CI/CD Pipeline', 'Configure GitHub Actions for automated deployment', 'done', 'medium', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '2026-01-20'),
('75555555-5555-5555-5555-555555555555', '10000000-1111-1111-1111-111111111111', 'Database optimization', 'Optimize slow queries and add indexes', 'todo', 'high', 'b2c3d4e5-f6a7-8901-bcde-f23456789012', 'b2c3d4e5-f6a7-8901-bcde-f23456789012', '2026-02-01'),
('76666666-6666-6666-6666-666666666666', '20000000-2222-2222-2222-222222222222', 'Create brand guidelines', 'Document brand colors, fonts, and usage rules', 'in_progress', 'medium', 'c3d4e5f6-a7b8-9012-cdef-345678901234', 'c3d4e5f6-a7b8-9012-cdef-345678901234', '2026-02-10'),
('77777777-7777-7777-7777-777777777777', '60000000-6666-6666-6666-666666666666', 'Implement push notifications', 'Add push notification support for mobile app', 'done', 'high', 'd4e5f6a7-b8c9-0123-defa-456789012345', 'd4e5f6a7-b8c9-0123-defa-456789012345', '2026-01-22'),
('78888888-8888-8888-8888-888888888888', '60000000-6666-6666-6666-666666666666', 'App store submission', 'Prepare and submit app to App Store and Play Store', 'in_review', 'high', 'd4e5f6a7-b8c9-0123-defa-456789012345', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '2026-02-15');

-- Update task 4 as completed
UPDATE tasks SET completed_at = '2026-01-20 15:30:00+07' WHERE id = '74444444-4444-4444-4444-444444444444';
UPDATE tasks SET completed_at = '2026-01-22 10:00:00+07' WHERE id = '77777777-7777-7777-7777-777777777777';

-- Insert channels
INSERT INTO channels (id, workspace_id, name, description, is_private, created_by) VALUES
('81111111-1111-1111-1111-111111111111', '01234567-89ab-cdef-0123-456789abcdef', 'general', 'General discussions for the team', false, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('82222222-2222-2222-2222-222222222222', '01234567-89ab-cdef-0123-456789abcdef', 'development', 'Development discussions and updates', false, 'b2c3d4e5-f6a7-8901-bcde-f23456789012'),
('83333333-3333-3333-3333-333333333333', '01234567-89ab-cdef-0123-456789abcdef', 'design', 'Design team discussions', false, 'c3d4e5f6-a7b8-9012-cdef-345678901234'),
('84444444-4444-4444-4444-444444444444', '01234567-89ab-cdef-0123-456789abcdef', 'announcements', 'Important announcements', false, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890');

-- Add members to channels
INSERT INTO channel_members (channel_id, user_id) VALUES
('81111111-1111-1111-1111-111111111111', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('81111111-1111-1111-1111-111111111111', 'b2c3d4e5-f6a7-8901-bcde-f23456789012'),
('81111111-1111-1111-1111-111111111111', 'c3d4e5f6-a7b8-9012-cdef-345678901234'),
('81111111-1111-1111-1111-111111111111', 'd4e5f6a7-b8c9-0123-defa-456789012345'),
('82222222-2222-2222-2222-222222222222', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('82222222-2222-2222-2222-222222222222', 'b2c3d4e5-f6a7-8901-bcde-f23456789012'),
('82222222-2222-2222-2222-222222222222', 'd4e5f6a7-b8c9-0123-defa-456789012345'),
('83333333-3333-3333-3333-333333333333', 'c3d4e5f6-a7b8-9012-cdef-345678901234'),
('83333333-3333-3333-3333-333333333333', 'd4e5f6a7-b8c9-0123-defa-456789012345');

-- Insert sample messages
INSERT INTO messages (channel_id, sender_id, content, created_at) VALUES
('81111111-1111-1111-1111-111111111111', 'b2c3d4e5-f6a7-8901-bcde-f23456789012', 'Good morning everyone! 👋 How''s the API integration going?', '2026-01-25 10:30:00+07'),
('81111111-1111-1111-1111-111111111111', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Morning Alice! We''re making good progress. Should be done by EOD.', '2026-01-25 10:32:00+07'),
('81111111-1111-1111-1111-111111111111', 'c3d4e5f6-a7b8-9012-cdef-345678901234', 'The new landing page mockups are ready for review! 🎨', '2026-01-25 10:35:00+07');

-- Insert calendar events
INSERT INTO calendar_events (workspace_id, project_id, title, description, event_type, start_time, end_time, color, created_by) VALUES
('01234567-89ab-cdef-0123-456789abcdef', NULL, 'Team Meeting', 'Weekly team sync meeting', 'meeting', '2026-02-10 09:00:00+07', '2026-02-10 10:00:00+07', '#6366f1', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('01234567-89ab-cdef-0123-456789abcdef', '40000000-4444-4444-4444-444444444444', 'TechXpo Deadline', 'Final submission deadline', 'deadline', '2026-02-05 23:59:00+07', NULL, '#ef4444', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890');

-- Insert user settings
INSERT INTO user_settings (user_id, email_notifications, push_notifications, task_reminders, weekly_summary) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', true, true, true, true),
('b2c3d4e5-f6a7-8901-bcde-f23456789012', true, true, true, false),
('c3d4e5f6-a7b8-9012-cdef-345678901234', true, false, true, false),
('d4e5f6a7-b8c9-0123-defa-456789012345', true, true, true, false);

-- Insert activity logs
INSERT INTO activity_logs (workspace_id, user_id, action, entity_type, entity_id, entity_name) VALUES
('01234567-89ab-cdef-0123-456789abcdef', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'completed', 'task', '74444444-4444-4444-4444-444444444444', 'Setup CI/CD Pipeline'),
('01234567-89ab-cdef-0123-456789abcdef', 'b2c3d4e5-f6a7-8901-bcde-f23456789012', 'started', 'task', '72222222-2222-2222-2222-222222222222', 'API Integration Testing'),
('01234567-89ab-cdef-0123-456789abcdef', 'c3d4e5f6-a7b8-9012-cdef-345678901234', 'uploaded', 'project', '20000000-2222-2222-2222-222222222222', 'DigiFact Branding');

-- Insert pending invitations
INSERT INTO invitations (workspace_id, email, role, message, token, invited_by, expires_at) VALUES
('01234567-89ab-cdef-0123-456789abcdef', 'newmember1@example.com', 'member', 'Welcome to our team!', 'token123abc', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '2026-02-01 00:00:00+07'),
('01234567-89ab-cdef-0123-456789abcdef', 'newmember2@example.com', 'member', NULL, 'token456def', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '2026-02-01 00:00:00+07'),
('01234567-89ab-cdef-0123-456789abcdef', 'newmember3@example.com', 'manager', 'Join us as a team lead!', 'token789ghi', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '2026-02-01 00:00:00+07');
