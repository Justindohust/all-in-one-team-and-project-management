-- Seed data for modules and submodules to demonstrate 4-level hierarchy

-- Get the first project (DigiFact Framework)
DO $$
DECLARE
    v_project_id UUID;
    v_module1_id UUID;
    v_module2_id UUID;
    v_submodule1_id UUID;
    v_submodule2_id UUID;
BEGIN
    -- Get DigiFact Framework project ID
    SELECT id INTO v_project_id FROM projects WHERE name = 'DigiFact Framework' LIMIT 1;
    
    IF v_project_id IS NOT NULL THEN
        -- Update existing default module
        UPDATE modules 
        SET name = 'Frontend Development', 
            description = 'All frontend related work',
            status = 'active',
            priority = 'high'
        WHERE project_id = v_project_id
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
        
        SELECT id INTO v_submodule1_id FROM submodules WHERE module_id = v_module1_id AND name = 'UI Components';
        
        -- Add submodules to Backend Development
        INSERT INTO submodules (module_id, name, description, status, priority, progress)
        VALUES 
            (v_module2_id, 'User API', 'User management endpoints', 'completed', 'urgent', 100),
            (v_module2_id, 'Project API', 'Project CRUD operations', 'active', 'high', 70),
            (v_module2_id, 'Authentication Service', 'JWT and session management', 'completed', 'urgent', 100);
        
        SELECT id INTO v_submodule2_id FROM submodules WHERE module_id = v_module2_id AND name = 'User API';
        
        -- Update some tasks to be under submodules
        UPDATE tasks 
        SET submodule_id = v_submodule1_id,
            module_id = v_module1_id
        WHERE id IN (
            SELECT id FROM tasks 
            WHERE project_id = v_project_id 
            AND subject LIKE '%UI%'
            LIMIT 2
        );
        
        UPDATE tasks 
        SET submodule_id = v_submodule2_id,
            module_id = v_module2_id
        WHERE id IN (
            SELECT id FROM tasks 
            WHERE project_id = v_project_id 
            AND subject LIKE '%API%'
            LIMIT 2
        );
    END IF;
    
    -- Get DigiFact Branding project ID
    SELECT id INTO v_project_id FROM projects WHERE name = 'DigiFact Branding' LIMIT 1;
    
    IF v_project_id IS NOT NULL THEN
        -- Update existing default module
        UPDATE modules 
        SET name = 'Brand Identity', 
            description = 'Logo, colors, typography',
            status = 'active',
            priority = 'medium'
        WHERE project_id = v_project_id
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
    END IF;
    
    -- Get DigiFact Contest project ID  
    SELECT id INTO v_project_id FROM projects WHERE name = 'DigiFact Contest' LIMIT 1;
    
    IF v_project_id IS NOT NULL THEN
        -- Update existing default module
        UPDATE modules 
        SET name = 'Contest Platform', 
            description = 'Online contest submission system',
            status = 'active',
            priority = 'high'
        WHERE project_id = v_project_id
        RETURNING id INTO v_module1_id;
        
        -- Add submodules
        INSERT INTO submodules (module_id, name, description, status, priority, progress)
        VALUES 
            (v_module1_id, 'Registration System', 'User registration and verification', 'active', 'urgent', 90),
            (v_module1_id, 'Submission Portal', 'Project submission interface', 'active', 'high', 50),
            (v_module1_id, 'Judging Dashboard', 'Judges evaluation interface', 'pending', 'medium', 20);
    END IF;
END $$;

-- Verify the data
SELECT 'Modules created:' as info, COUNT(*) as count FROM modules;
SELECT 'Submodules created:' as info, COUNT(*) as count FROM submodules;
SELECT 'Tasks with submodules:' as info, COUNT(*) as count FROM tasks WHERE submodule_id IS NOT NULL;
