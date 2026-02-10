-- Migration: Add Submodules Support
-- This migration adds support for submodules (sub-components of modules)

-- =====================
-- SUBMODULES Table
-- =====================
CREATE TABLE IF NOT EXISTS submodules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
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

-- Add submodule_id column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS submodule_id UUID REFERENCES submodules(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_submodules_module_id ON submodules(module_id);
CREATE INDEX IF NOT EXISTS idx_tasks_submodule_id ON tasks(submodule_id);

-- Add comment for documentation
COMMENT ON TABLE submodules IS 'Submodules are sub-components within modules, providing an additional level of organization';
COMMENT ON COLUMN tasks.submodule_id IS 'Optional reference to submodule if task belongs to a submodule';

-- Update tasks table constraint to allow either module_id or submodule_id (but at least one must be set)
-- Note: This is a soft constraint that should be enforced in application logic
