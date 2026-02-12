-- Migration: Add 'urgent' priority to tasks table
-- This allows tasks to have the same priority levels as modules and submodules

-- Drop old constraint
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_priority_check;

-- Add new constraint with 'urgent'
ALTER TABLE tasks ADD CONSTRAINT tasks_priority_check 
    CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
