-- Seed data for modules and submodules to demonstrate 4-level hierarchy
-- Clear existing submodules and update modules

-- Clean up first
DELETE FROM submodules;
DELETE FROM modules WHERE name != 'Default Module';

-- Get distinct projects
DO $$
DECLARE
    v_project_id UUID;
    v_module1_id UUID;
    v_module2_id UUID;
    v_submodule1_id UUID;
    v_submodule2_id UUID;
BEGIN
    -- DigiFact Framework project
    SELECT id INTO v_project_id FROM projects WHERE name LIKE '%Framework%' ORDER BY created_at LIMIT 1;
    
    IF v_project_id IS NOT NULL THEN
        -- Update existing default module
        UPDATE modules 
        SET name = 'Frontend Development', 
            description = 'All frontend related work',
            status = 'active',
            priority = 'high',
            progress = 45
        WHERE project_id = v_project_id AND name = 'Default Module'
        RETURNING id INTO v_module1_id;
        
        -- Add second module
        INSERT INTO modules (project_id, name, description, status, priority, progress)
        VALUES (v_project_id, 'Backend Development', 'API and server-side development', 'active', 'high', 30)
        RETURNING id INTO v_module2_id;
        
        -- Add submodules to Frontend Development
        INSERT INTO submodules (module_id, name, description, status, priority, progress)
        VALUES 
            (v_module1_id, 'UI Components', 'Reusable UI component library', 'active', 'high', 60),
            (v_module1_id, 'Authentication Pages', 'Login, register, password reset pages', 'completed', 'urgent', 100),
            (v_module1_id, 'Dashboard Layout', 'Main dashboard and navigation', 'active', 'medium', 40);
        
        -- Add submodules to Backend Development
        INSERT INTO submodules (module_id, name, description, status, priority, progress)
        VALUES 
            (v_module2_id, 'User API', 'User management endpoints', 'completed', 'urgent', 100),
            (v_module2_id, 'Project API', 'Project CRUD operations', 'active', 'high', 70),
            (v_module2_id, 'Authentication Service', 'JWT and session management', 'completed', 'urgent', 100);
        
        RAISE NOTICE 'Added modules and submodules for: %', v_project_id;
    END IF;
    
    -- DigiFact Branding project
    SELECT id INTO v_project_id FROM projects WHERE name LIKE '%Branding%' ORDER BY created_at LIMIT 1;
    
    IF v_project_id IS NOT NULL THEN
        -- Update existing default module
        UPDATE modules 
        SET name = 'Brand Identity', 
            description = 'Logo, colors, typography',
            status = 'active',
            priority = 'medium',
            progress = 75
        WHERE project_id = v_project_id AND name = 'Default Module'
        RETURNING id INTO v_module1_id;
        
        -- Add second module
        INSERT INTO modules (project_id, name, description, status, priority, progress)
        VALUES (v_project_id, 'Marketing Materials', 'Brochures, presentations, social media', 'pending', 'medium', 10)
        RETURNING id INTO v_module2_id;
        
        -- Add submodules
        INSERT INTO submodules (module_id, name, description, status, priority, progress)
        VALUES 
            (v_module1_id, 'Logo Design', 'Primary and secondary logos', 'completed', 'urgent', 100),
            (v_module1_id, 'Color Palette', 'Brand color guidelines', 'active', 'high', 80),
            (v_module2_id, 'Social Media Templates', 'Facebook, Twitter, LinkedIn templates', 'pending', 'low', 0);
            
        RAISE NOTICE 'Added modules and submodules for: %', v_project_id;
    END IF;
    
    -- DigiFact Contest project  
    SELECT id INTO v_project_id FROM projects WHERE name LIKE '%Contest%' ORDER BY created_at LIMIT 1;
    
    IF v_project_id IS NOT NULL THEN
        -- Update existing default module
        UPDATE modules 
        SET name = 'Contest Platform', 
            description = 'Online contest submission system',
            status = 'active',
            priority = 'high',
            progress = 55
        WHERE project_id = v_project_id AND name = 'Default Module'
        RETURNING id INTO v_module1_id;
        
        -- Add submodules
        INSERT INTO submodules (module_id, name, description, status, priority, progress)
        VALUES 
            (v_module1_id, 'Registration System', 'User registration and verification', 'active', 'urgent', 90),
            (v_module1_id, 'Submission Portal', 'Project submission interface', 'active', 'high', 50),
            (v_module1_id, 'Judging Dashboard', 'Judges evaluation interface', 'pending', 'medium', 20);
            
        RAISE NOTICE 'Added modules and submodules for: %', v_project_id;
    END IF;
END $$;

-- Verify the data
SELECT 'Total Modules' as info, COUNT(*) as count FROM modules;
SELECT 'Total Submodules' as info, COUNT(*) as count FROM submodules;

-- Show hierarchy
SELECT 
    p.name as project,
    m.name as module,
    COUNT(s.id) as submodule_count
FROM projects p
LEFT JOIN modules m ON p.id = m.project_id
LEFT JOIN submodules s ON m.id = s.module_id
GROUP BY p.name, m.name
ORDER BY p.name, m.name;
