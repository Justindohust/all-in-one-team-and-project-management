-- Migration: Add modules table and update tasks table
-- Run this if database already exists

-- Add modules table if not exists
CREATE TABLE IF NOT EXISTS modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'pending', 'archived')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    start_date DATE,
    due_date DATE,
    progress INT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    sort_order INT DEFAULT 0,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add module_id column to tasks table if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='tasks' AND column_name='module_id'
    ) THEN
        ALTER TABLE tasks ADD COLUMN module_id UUID REFERENCES modules(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_modules_project_id ON modules(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_module_id ON tasks(module_id);

-- Update existing data (optional - assign tasks to default modules per project)
-- You can customize this based on your needs
DO $$
DECLARE
    project_record RECORD;
    default_module_id UUID;
BEGIN
    FOR project_record IN SELECT id FROM projects LOOP
        -- Create a default module for each project
        INSERT INTO modules (project_id, name, description, status)
        VALUES (project_record.id, 'Default Module', 'Auto-generated default module', 'active')
        RETURNING id INTO default_module_id;
        
        -- Assign tasks without module to this default module
        UPDATE tasks 
        SET module_id = default_module_id 
        WHERE project_id = project_record.id AND module_id IS NULL;
    END LOOP;
END $$;
