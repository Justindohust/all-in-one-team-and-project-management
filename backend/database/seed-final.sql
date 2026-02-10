-- Simple seed data for modules and submodules
-- Clear existing non-default data
DELETE FROM submodules;
UPDATE modules SET name = 'Default Module';
DELETE FROM modules WHERE sort_order > 0;

-- DigiFact Framework (10000000-1111-1111-1111-111111111111)
-- Update default module
UPDATE modules 
SET name = 'Frontend Development', 
    description = 'All frontend related work',
    status = 'active',
    priority = 'high',
    progress = 45,
    sort_order = 1
WHERE project_id = '10000000-1111-1111-1111-111111111111';

-- Add Backend module
INSERT INTO modules (id, project_id, name, description, status, priority, progress, sort_order)
VALUES (uuid_generate_v4(), '10000000-1111-1111-1111-111111111111', 'Backend Development', 'API and server-side development', 'active', 'high', 30, 2);

-- Get module IDs to insert submodules
DO $$
DECLARE
    v_frontend_id UUID;
    v_backend_id UUID;
BEGIN
    SELECT id INTO v_frontend_id FROM modules WHERE project_id = '10000000-1111-1111-1111-111111111111' AND name = 'Frontend Development';
    SELECT id INTO v_backend_id FROM modules WHERE project_id = '10000000-1111-1111-1111-111111111111' AND name = 'Backend Development';
    
    -- Frontend submodules
    INSERT INTO submodules (module_id, name, description, status, priority, progress, sort_order)
    VALUES 
        (v_frontend_id, 'UI Components', 'Reusable UI component library', 'active', 'high', 60, 1),
        (v_frontend_id, 'Authentication Pages', 'Login, register, password reset pages', 'completed', 'urgent', 100, 2),
        (v_frontend_id, 'Dashboard Layout', 'Main dashboard and navigation', 'active', 'medium', 40, 3);
    
    -- Backend submodules
    INSERT INTO submodules (module_id, name, description, status, priority, progress, sort_order)
    VALUES 
        (v_backend_id, 'User API', 'User management endpoints', 'completed', 'urgent', 100, 1),
        (v_backend_id, 'Project API', 'Project CRUD operations', 'active', 'high', 70, 2),
        (v_backend_id, 'Authentication Service', 'JWT and session management', 'completed', 'urgent', 100, 3);
END $$;

-- DigiFact Branding (20000000-2222-2222-2222-222222222222)
UPDATE modules 
SET name = 'Brand Identity', 
    description = 'Logo, colors, typography',
    status = 'active',
    priority = 'medium',
    progress = 75,
    sort_order = 1
WHERE project_id = '20000000-2222-2222-2222-222222222222';

INSERT INTO modules (id, project_id, name, description, status, priority, progress, sort_order)
VALUES (uuid_generate_v4(), '20000000-2222-2222-2222-222222222222', 'Marketing Materials', 'Brochures, presentations, social media', 'pending', 'medium', 10, 2);

DO $$
DECLARE
    v_brand_id UUID;
    v_marketing_id UUID;
BEGIN
    SELECT id INTO v_brand_id FROM modules WHERE project_id = '20000000-2222-2222-2222-222222222222' AND name = 'Brand Identity';
    SELECT id INTO v_marketing_id FROM modules WHERE project_id = '20000000-2222-2222-2222-222222222222' AND name = 'Marketing Materials';
    
    INSERT INTO submodules (module_id, name, description, status, priority, progress, sort_order)
    VALUES 
        (v_brand_id, 'Logo Design', 'Primary and secondary logos', 'completed', 'urgent', 100, 1),
        (v_brand_id, 'Color Palette', 'Brand color guidelines', 'active', 'high', 80, 2),
        (v_marketing_id, 'Social Media Templates', 'Facebook, Twitter, LinkedIn templates', 'pending', 'low', 0, 1);
END $$;

-- DigiFact Contest (30000000-3333-3333-3333-333333333333)
UPDATE modules 
SET name = 'Contest Platform', 
    description = 'Online contest submission system',
    status = 'active',
    priority = 'high',
    progress = 55,
    sort_order = 1
WHERE project_id = '30000000-3333-3333-3333-333333333333';

DO $$
DECLARE
    v_platform_id UUID;
BEGIN
    SELECT id INTO v_platform_id FROM modules WHERE project_id = '30000000-3333-3333-3333-333333333333' AND name = 'Contest Platform';
    
    INSERT INTO submodules (module_id, name, description, status, priority, progress, sort_order)
    VALUES 
        (v_platform_id, 'Registration System', 'User registration and verification', 'active', 'urgent', 90, 1),
        (v_platform_id, 'Submission Portal', 'Project submission interface', 'active', 'high', 50, 2),
        (v_platform_id, 'Judging Dashboard', 'Judges evaluation interface', 'pending', 'medium', 20, 3);
END $$;

-- Show results
SELECT '=== SUMMARY ===' as info;
SELECT 'Total Modules:' as info, COUNT(*) as count FROM modules;
SELECT 'Total Submodules:' as info, COUNT(*) as count FROM submodules;

SELECT '=== HIERARCHY ===' as info;
SELECT 
    p.name as "Project",
    m.name as "Module",
    COUNT(s.id) as "Submodules"
FROM projects p
LEFT JOIN modules m ON p.id = m.project_id
LEFT JOIN submodules s ON m.id = s.module_id
WHERE p.name LIKE '%DigiFact%'
GROUP BY p.name, m.name
ORDER BY p.name, m.name;
