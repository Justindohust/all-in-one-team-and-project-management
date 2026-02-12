-- Comprehensive seed data for complete 4-level hierarchy
-- Project -> Module -> Submodule -> Task

-- Clear existing data (except projects and users)
DELETE FROM tasks;
DELETE FROM submodules;
DELETE FROM modules;

-- =====================
-- DigiFact Framework (10000000-1111-1111-1111-111111111111)
-- =====================

-- Modules for DigiFact Framework
INSERT INTO modules (id, project_id, name, description, status, priority, progress, sort_order)
VALUES 
    ('a0000000-0000-0000-0000-000000000001', '10000000-1111-1111-1111-111111111111', 'Frontend Development', 'User interface and client-side development', 'active', 'high', 55, 1),
    ('a0000000-0000-0000-0000-000000000002', '10000000-1111-1111-1111-111111111111', 'Backend Development', 'Server-side API and business logic', 'active', 'high', 40, 2),
    ('a0000000-0000-0000-0000-000000000003', '10000000-1111-1111-1111-111111111111', 'Testing & QA', 'Quality assurance and testing', 'active', 'medium', 25, 3);

-- Submodules for Frontend Development
INSERT INTO submodules (id, module_id, name, description, status, priority, progress, sort_order)
VALUES 
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'UI Components', 'Reusable component library', 'active', 'high', 70, 1),
    ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Authentication Pages', 'Login and user management UI', 'completed', 'urgent', 100, 2),
    ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Dashboard Layout', 'Main application layout and navigation', 'active', 'high', 45, 3);

-- Submodules for Backend Development
INSERT INTO submodules (id, module_id, name, description, status, priority, progress, sort_order)
VALUES 
    ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', 'User API', 'User management endpoints', 'completed', 'urgent', 100, 1),
    ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002', 'Project API', 'Project CRUD operations', 'active', 'high', 60, 2),
    ('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000002', 'Authentication Service', 'JWT and session management', 'completed', 'urgent', 100, 3);

-- Submodules for Testing & QA
INSERT INTO submodules (id, module_id, name, description, status, priority, progress, sort_order)
VALUES 
    ('b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000003', 'Unit Testing', 'Component and function tests', 'active', 'medium', 30, 1),
    ('b0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000003', 'Integration Testing', 'End-to-end testing', 'pending', 'medium', 10, 2);

-- Tasks for UI Components submodule
INSERT INTO tasks (project_id, module_id, submodule_id, title, description, status, priority, due_date, sort_order)
VALUES 
    ('10000000-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Create Button Components', 'Design and implement reusable button components', 'done', 'high', '2026-02-10', 1),
    ('10000000-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Form Input Components', 'Text inputs, checkboxes, radio buttons', 'in_progress', 'high', '2026-02-15', 2),
    ('10000000-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Modal Dialog Component', 'Reusable modal for popups', 'todo', 'medium', '2026-02-20', 3),
    ('10000000-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Data Table Component', 'Sortable and filterable table', 'todo', 'medium', '2026-02-25', 4);

-- Tasks for Authentication Pages submodule
INSERT INTO tasks (project_id, module_id, submodule_id, title, description, status, priority, due_date, sort_order)
VALUES 
    ('10000000-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'Login Page UI', 'Design and implement login form', 'done', 'urgent', '2026-01-20', 1),
    ('10000000-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'Registration Page', 'User signup form with validation', 'done', 'urgent', '2026-01-25', 2),
    ('10000000-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'Password Reset Flow', 'Forgot password and reset pages', 'done', 'high', '2026-01-30', 3);

-- Tasks for Dashboard Layout submodule
INSERT INTO tasks (project_id, module_id, submodule_id, title, description, status, priority, due_date, sort_order)
VALUES 
    ('10000000-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'Sidebar Navigation', 'Left sidebar with menu items', 'done', 'high', '2026-02-05', 1),
    ('10000000-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'Top Header Bar', 'Header with user profile and notifications', 'in_progress', 'high', '2026-02-12', 2),
    ('10000000-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'Responsive Layout', 'Mobile and tablet responsive design', 'todo', 'medium', '2026-02-18', 3);

-- Tasks for User API submodule
INSERT INTO tasks (project_id, module_id, submodule_id, title, description, status, priority, due_date, sort_order)
VALUES 
    ('10000000-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004', 'GET /api/users endpoint', 'List all users with pagination', 'done', 'urgent', '2026-01-15', 1),
    ('10000000-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004', 'POST /api/users endpoint', 'Create new user account', 'done', 'urgent', '2026-01-20', 2),
    ('10000000-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004', 'PUT /api/users/:id endpoint', 'Update user information', 'done', 'high', '2026-01-25', 3);

-- Tasks for Project API submodule
INSERT INTO tasks (project_id, module_id, submodule_id, title, description, status, priority, due_date, sort_order)
VALUES 
    ('10000000-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000005', 'GET /api/projects endpoint', 'List projects with filters', 'done', 'high', '2026-02-01', 1),
    ('10000000-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000005', 'POST /api/projects endpoint', 'Create new project', 'in_progress', 'high', '2026-02-10', 2),
    ('10000000-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000005', 'Update project hierarchy', 'Handle modules and submodules', 'todo', 'high', '2026-02-20', 3);

-- =====================
-- DigiFact Branding (20000000-2222-2222-2222-222222222222)
-- =====================

-- Modules for DigiFact Branding
INSERT INTO modules (id, project_id, name, description, status, priority, progress, sort_order)
VALUES 
    ('a1000000-0000-0000-0000-000000000001', '20000000-2222-2222-2222-222222222222', 'Brand Identity', 'Logo, colors, typography design', 'active', 'high', 60, 1),
    ('a1000000-0000-0000-0000-000000000002', '20000000-2222-2222-2222-222222222222', 'Marketing Materials', 'Brochures, banners, presentations', 'active', 'medium', 30, 2);

-- Submodules for Brand Identity
INSERT INTO submodules (id, module_id, name, description, status, priority, progress, sort_order)
VALUES 
    ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Logo Design', 'Primary and secondary logo variations', 'completed', 'urgent', 100, 1),
    ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'Color Palette', 'Brand color system and guidelines', 'active', 'high', 80, 2),
    ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'Typography System', 'Font selection and usage rules', 'active', 'medium', 40, 3);

-- Submodules for Marketing Materials
INSERT INTO submodules (id, module_id, name, description, status, priority, progress, sort_order)
VALUES 
    ('b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000002', 'Print Materials', 'Business cards, brochures, flyers', 'active', 'medium', 35, 1),
    ('b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000002', 'Digital Assets', 'Social media templates, banners', 'pending', 'medium', 20, 2);

-- Tasks for Logo Design submodule
INSERT INTO tasks (project_id, module_id, submodule_id, title, description, status, priority, due_date, sort_order)
VALUES 
    ('20000000-2222-2222-2222-222222222222', 'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'Initial Logo Concepts', 'Create 5 logo concept variations', 'done', 'urgent', '2026-01-10', 1),
    ('20000000-2222-2222-2222-222222222222', 'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'Client Feedback Round', 'Present and refine based on feedback', 'done', 'urgent', '2026-01-15', 2),
    ('20000000-2222-2222-2222-222222222222', 'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'Final Logo Files', 'Deliver all file formats (SVG, PNG, AI)', 'done', 'high', '2026-01-20', 3);

-- Tasks for Color Palette submodule
INSERT INTO tasks (project_id, module_id, submodule_id, title, description, status, priority, due_date, sort_order)
VALUES 
    ('20000000-2222-2222-2222-222222222222', 'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000002', 'Primary Colors Selection', 'Choose main brand colors', 'done', 'high', '2026-01-25', 1),
    ('20000000-2222-2222-2222-222222222222', 'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000002', 'Secondary Colors', 'Complementary color palette', 'in_progress', 'high', '2026-02-05', 2),
    ('20000000-2222-2222-2222-222222222222', 'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000002', 'Color Usage Guidelines', 'Document when and how to use each color', 'todo', 'medium', '2026-02-10', 3);

-- =====================
-- DigiFact Contest (30000000-3333-3333-3333-333333333333)
-- =====================

-- Modules for DigiFact Contest
INSERT INTO modules (id, project_id, name, description, status, priority, progress, sort_order)
VALUES 
    ('a2000000-0000-0000-0000-000000000001', '30000000-3333-3333-3333-333333333333', 'Contest Platform', 'Online contest system development', 'active', 'urgent', 45, 1),
    ('a2000000-0000-0000-0000-000000000002', '30000000-3333-3333-3333-333333333333', 'Marketing Campaign', 'Contest promotion and outreach', 'active', 'high', 30, 2);

-- Submodules for Contest Platform
INSERT INTO submodules (id, module_id, name, description, status, priority, progress, sort_order)
VALUES 
    ('b2000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000001', 'Registration System', 'Participant signup and management', 'active', 'urgent', 60, 1),
    ('b2000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000001', 'Submission Portal', 'Upload and review submissions', 'active', 'urgent', 40, 2),
    ('b2000000-0000-0000-0000-000000000003', 'a2000000-0000-0000-0000-000000000001', 'Judging System', 'Scoring and evaluation tools', 'pending', 'high', 20, 3);

-- Submodules for Marketing Campaign
INSERT INTO submodules (id, module_id, name, description, status, priority, progress, sort_order)
VALUES 
    ('b2000000-0000-0000-0000-000000000004', 'a2000000-0000-0000-0000-000000000002', 'Social Media Strategy', 'Facebook, Instagram, Twitter campaigns', 'active', 'high', 35, 1),
    ('b2000000-0000-0000-0000-000000000005', 'a2000000-0000-0000-0000-000000000002', 'Email Marketing', 'Newsletter and promotional emails', 'active', 'medium', 25, 2);

-- Tasks for Registration System submodule
INSERT INTO tasks (project_id, module_id, submodule_id, title, description, status, priority, due_date, sort_order)
VALUES 
    ('30000000-3333-3333-3333-333333333333', 'a2000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000001', 'Registration Form Design', 'Create registration form UI', 'done', 'urgent', '2026-02-01', 1),
    ('30000000-3333-3333-3333-333333333333', 'a2000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000001', 'Email Verification', 'Send verification emails to participants', 'in_progress', 'urgent', '2026-02-08', 2),
    ('30000000-3333-3333-3333-333333333333', 'a2000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000001', 'User Profile Management', 'Allow participants to edit their info', 'todo', 'high', '2026-02-15', 3);

-- =====================
-- TechXpo 2025 (40000000-4444-4444-4444-444444444444)
-- =====================

-- Modules for TechXpo 2025
INSERT INTO modules (id, project_id, name, description, status, priority, progress, sort_order)
VALUES 
    ('a3000000-0000-0000-0000-000000000001', '40000000-4444-4444-4444-444444444444', 'Event Planning', 'Venue, schedule, logistics', 'active', 'urgent', 50, 1),
    ('a3000000-0000-0000-0000-000000000002', '40000000-4444-4444-4444-444444444444', 'Exhibitor Management', 'Booth assignments and coordination', 'active', 'high', 35, 2);

-- Submodules for Event Planning
INSERT INTO submodules (id, module_id, name, description, status, priority, progress, sort_order)
VALUES 
    ('b3000000-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000001', 'Venue Setup', 'Stage, seating, AV equipment', 'active', 'urgent', 60, 1),
    ('b3000000-0000-0000-0000-000000000002', 'a3000000-0000-0000-0000-000000000001', 'Speaker Coordination', 'Invite and schedule speakers', 'active', 'high', 45, 2),
    ('b3000000-0000-0000-0000-000000000003', 'a3000000-0000-0000-0000-000000000001', 'Catering Services', 'Food and beverage arrangements', 'active', 'medium', 40, 3);

-- Tasks for Venue Setup submodule
INSERT INTO tasks (project_id, module_id, submodule_id, title, description, status, priority, due_date, sort_order)
VALUES 
    ('40000000-4444-4444-4444-444444444444', 'a3000000-0000-0000-0000-000000000001', 'b3000000-0000-0000-0000-000000000001', 'Book Event Venue', 'Reserve convention center space', 'done', 'urgent', '2026-01-05', 1),
    ('40000000-4444-4444-4444-444444444444', 'a3000000-0000-0000-0000-000000000001', 'b3000000-0000-0000-0000-000000000001', 'AV Equipment Rental', 'Projectors, microphones, speakers', 'in_progress', 'urgent', '2026-02-10', 2),
    ('40000000-4444-4444-4444-444444444444', 'a3000000-0000-0000-0000-000000000001', 'b3000000-0000-0000-0000-000000000001', 'Booth Layout Design', 'Floor plan for exhibitor booths', 'in_progress', 'high', '2026-02-15', 3);

-- =====================
-- Webinar Series (50000000-5555-5555-5555-555555555555)
-- =====================

-- Modules for Webinar Series
INSERT INTO modules (id, project_id, name, description, status, priority, progress, sort_order)
VALUES 
    ('a4000000-0000-0000-0000-000000000001', '50000000-5555-5555-5555-555555555555', 'Content Creation', 'Webinar topics and materials', 'active', 'high', 40, 1),
    ('a4000000-0000-0000-0000-000000000002', '50000000-5555-5555-5555-555555555555', 'Technical Setup', 'Streaming platform and tools', 'active', 'high', 55, 2);

-- Submodules for Content Creation
INSERT INTO submodules (id, module_id, name, description, status, priority, progress, sort_order)
VALUES 
    ('b4000000-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000001', 'Topic Research', 'Identify trending topics and speakers', 'active', 'high', 50, 1),
    ('b4000000-0000-0000-0000-000000000002', 'a4000000-0000-0000-0000-000000000001', 'Presentation Slides', 'Create slide decks for each webinar', 'active', 'medium', 30, 2);

-- Tasks for Topic Research submodule
INSERT INTO tasks (project_id, module_id, submodule_id, title, description, status, priority, due_date, sort_order)
VALUES 
    ('50000000-5555-5555-5555-555555555555', 'a4000000-0000-0000-0000-000000000001', 'b4000000-0000-0000-0000-000000000001', 'Survey Target Audience', 'Gather input on preferred topics', 'done', 'high', '2026-01-20', 1),
    ('50000000-5555-5555-5555-555555555555', 'a4000000-0000-0000-0000-000000000001', 'b4000000-0000-0000-0000-000000000001', 'Contact Potential Speakers', 'Reach out to industry experts', 'in_progress', 'high', '2026-02-10', 2),
    ('50000000-5555-5555-5555-555555555555', 'a4000000-0000-0000-0000-000000000001', 'b4000000-0000-0000-0000-000000000001', 'Finalize Webinar Schedule', 'Create calendar for 6 webinars', 'todo', 'high', '2026-02-20', 3);

-- =====================
-- Mobile App (60000000-6666-6666-6666-666666666666)
-- =====================

-- Modules for Mobile App
INSERT INTO modules (id, project_id, name, description, status, priority, progress, sort_order)
VALUES 
    ('a5000000-0000-0000-0000-000000000001', '60000000-6666-6666-6666-666666666666', 'iOS Development', 'Native iOS application', 'active', 'high', 35, 1),
    ('a5000000-0000-0000-0000-000000000002', '60000000-6666-6666-6666-666666666666', 'Android Development', 'Native Android application', 'active', 'high', 30, 2),
    ('a5000000-0000-0000-0000-000000000003', '60000000-6666-6666-6666-666666666666', 'Backend API', 'Mobile backend services', 'active', 'urgent', 50, 3);

-- Submodules for iOS Development
INSERT INTO submodules (id, module_id, name, description, status, priority, progress, sort_order)
VALUES 
    ('b5000000-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000001', 'User Authentication', 'Login and signup screens', 'active', 'urgent', 60, 1),
    ('b5000000-0000-0000-0000-000000000002', 'a5000000-0000-0000-0000-000000000001', 'Home Screen', 'Main dashboard and features', 'active', 'high', 30, 2),
    ('b5000000-0000-0000-0000-000000000003', 'a5000000-0000-0000-0000-000000000001', 'Settings Screen', 'User preferences and settings', 'pending', 'medium', 10, 3);

-- Submodules for Android Development
INSERT INTO submodules (id, module_id, name, description, status, priority, progress, sort_order)
VALUES 
    ('b5000000-0000-0000-0000-000000000004', 'a5000000-0000-0000-0000-000000000002', 'User Authentication', 'Login and signup activities', 'active', 'urgent', 55, 1),
    ('b5000000-0000-0000-0000-000000000005', 'a5000000-0000-0000-0000-000000000002', 'Home Screen', 'Main activity and fragments', 'active', 'high', 25, 2);

-- Submodules for Backend API
INSERT INTO submodules (id, module_id, name, description, status, priority, progress, sort_order)
VALUES 
    ('b5000000-0000-0000-0000-000000000006', 'a5000000-0000-0000-0000-000000000003', 'Authentication Endpoints', 'Login, register, token refresh', 'active', 'urgent', 70, 1),
    ('b5000000-0000-0000-0000-000000000007', 'a5000000-0000-0000-0000-000000000003', 'Data Sync Services', 'Real-time data synchronization', 'active', 'high', 40, 2);

-- Tasks for iOS User Authentication submodule
INSERT INTO tasks (project_id, module_id, submodule_id, title, description, status, priority, due_date, sort_order)
VALUES 
    ('60000000-6666-6666-6666-666666666666', 'a5000000-0000-0000-0000-000000000001', 'b5000000-0000-0000-0000-000000000001', 'Design Login Screen UI', 'Create login interface in SwiftUI', 'done', 'urgent', '2026-01-28', 1),
    ('60000000-6666-6666-6666-666666666666', 'a5000000-0000-0000-0000-000000000001', 'b5000000-0000-0000-0000-000000000001', 'Implement OAuth Integration', 'Add Google and Apple Sign-In', 'in_progress', 'urgent', '2026-02-12', 2),
    ('60000000-6666-6666-6666-666666666666', 'a5000000-0000-0000-0000-000000000001', 'b5000000-0000-0000-0000-000000000001', 'Biometric Authentication', 'Face ID and Touch ID support', 'todo', 'high', '2026-02-18', 3);

-- Tasks for Android User Authentication submodule
INSERT INTO tasks (project_id, module_id, submodule_id, title, description, status, priority, due_date, sort_order)
VALUES 
    ('60000000-6666-6666-6666-666666666666', 'a5000000-0000-0000-0000-000000000002', 'b5000000-0000-0000-0000-000000000004', 'Design Login Activity UI', 'Create login interface in Jetpack Compose', 'done', 'urgent', '2026-02-01', 1),
    ('60000000-6666-6666-6666-666666666666', 'a5000000-0000-0000-0000-000000000002', 'b5000000-0000-0000-0000-000000000004', 'Implement OAuth Integration', 'Add Google Sign-In', 'in_progress', 'urgent', '2026-02-14', 2),
    ('60000000-6666-6666-6666-666666666666', 'a5000000-0000-0000-0000-000000000002', 'b5000000-0000-0000-0000-000000000004', 'Fingerprint Authentication', 'Biometric authentication support', 'todo', 'high', '2026-02-20', 3);

-- Tasks for Backend Authentication Endpoints submodule
INSERT INTO tasks (project_id, module_id, submodule_id, title, description, status, priority, due_date, sort_order)
VALUES 
    ('60000000-6666-6666-6666-666666666666', 'a5000000-0000-0000-0000-000000000003', 'b5000000-0000-0000-0000-000000000006', 'POST /auth/login endpoint', 'User login with JWT', 'done', 'urgent', '2026-01-25', 1),
    ('60000000-6666-6666-6666-666666666666', 'a5000000-0000-0000-0000-000000000003', 'b5000000-0000-0000-0000-000000000006', 'POST /auth/register endpoint', 'New user registration', 'done', 'urgent', '2026-01-30', 2),
    ('60000000-6666-6666-6666-666666666666', 'a5000000-0000-0000-0000-000000000003', 'b5000000-0000-0000-0000-000000000006', 'OAuth Provider Integration', 'Connect with Google and Apple OAuth', 'in_progress', 'high', '2026-02-15', 3);

-- Update module progress based on submodule progress
UPDATE modules m
SET progress = (
    SELECT COALESCE(AVG(s.progress), 0)
    FROM submodules s
    WHERE s.module_id = m.id
)
WHERE EXISTS (
    SELECT 1 FROM submodules s WHERE s.module_id = m.id
);
