-- Migration: Add comprehensive comments and activities system
-- Date: 2026-02-12

-- =====================
-- ENTITY COMMENTS (Unified comments table for all entities)
-- =====================
CREATE TABLE IF NOT EXISTS entity_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('project', 'module', 'submodule', 'task')),
    entity_id UUID NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES entity_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_entity_comments_entity ON entity_comments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_comments_parent ON entity_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_entity_comments_user ON entity_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_entity_comments_created_at ON entity_comments(created_at DESC);

-- =====================
-- ENHANCED ACTIVITY LOGS
-- =====================
-- Add columns to existing activity_logs table for entity-specific tracking
ALTER TABLE activity_logs 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS submodule_id UUID REFERENCES submodules(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS task_id UUID REFERENCES tasks(id) ON DELETE CASCADE;

-- Create indexes for entity-specific queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_project_id ON activity_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_module_id ON activity_logs(module_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_submodule_id ON activity_logs(submodule_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_task_id ON activity_logs(task_id);

-- =====================
-- TRIGGERS FOR AUTOMATIC ACTIVITY LOGGING
-- =====================

-- Function to log module changes
CREATE OR REPLACE FUNCTION log_module_activity()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_action VARCHAR(50);
    v_details JSONB;
BEGIN
    -- Get user from context (set by application)
    v_user_id := current_setting('app.current_user_id', true)::UUID;
    
    IF TG_OP = 'INSERT' THEN
        v_action := 'created';
        v_details := jsonb_build_object(
            'name', NEW.name,
            'status', NEW.status,
            'priority', NEW.priority
        );
        
        INSERT INTO activity_logs (user_id, action, entity_type, entity_id, entity_name, details, project_id, module_id)
        VALUES (v_user_id, v_action, 'module', NEW.id, NEW.name, v_details, NEW.project_id, NEW.id);
        
    ELSIF TG_OP = 'UPDATE' THEN
        v_details := jsonb_build_object();
        
        IF OLD.name != NEW.name THEN
            v_details := v_details || jsonb_build_object('name_changed', jsonb_build_object('from', OLD.name, 'to', NEW.name));
        END IF;
        
        IF OLD.status != NEW.status THEN
            v_details := v_details || jsonb_build_object('status_changed', jsonb_build_object('from', OLD.status, 'to', NEW.status));
        END IF;
        
        IF OLD.priority != NEW.priority THEN
            v_details := v_details || jsonb_build_object('priority_changed', jsonb_build_object('from', OLD.priority, 'to', NEW.priority));
        END IF;
        
        IF OLD.start_date != NEW.start_date OR OLD.end_date != NEW.end_date THEN
            v_details := v_details || jsonb_build_object('dates_changed', jsonb_build_object(
                'start_date', jsonb_build_object('from', OLD.start_date, 'to', NEW.start_date),
                'end_date', jsonb_build_object('from', OLD.end_date, 'to', NEW.end_date)
            ));
        END IF;
        
        IF OLD.progress != NEW.progress THEN
            v_details := v_details || jsonb_build_object('progress_changed', jsonb_build_object('from', OLD.progress, 'to', NEW.progress));
        END IF;
        
        -- Only log if something actually changed
        IF v_details != '{}'::jsonb THEN
            INSERT INTO activity_logs (user_id, action, entity_type, entity_id, entity_name, details, project_id, module_id)
            VALUES (v_user_id, 'updated', 'module', NEW.id, NEW.name, v_details, NEW.project_id, NEW.id);
        END IF;
        
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'deleted';
        v_details := jsonb_build_object('name', OLD.name);
        
        INSERT INTO activity_logs (user_id, action, entity_type, entity_id, entity_name, details, project_id, module_id)
        VALUES (v_user_id, v_action, 'module', OLD.id, OLD.name, v_details, OLD.project_id, OLD.id);
    END IF;
    
    RETURN COALESCE(NEW, OLD);
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the transaction
        RAISE NOTICE 'Error logging module activity: %', SQLERRM;
        RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to log submodule changes
CREATE OR REPLACE FUNCTION log_submodule_activity()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_action VARCHAR(50);
    v_details JSONB;
    v_project_id UUID;
BEGIN
    v_user_id := current_setting('app.current_user_id', true)::UUID;
    
    -- Get project_id from parent module
    SELECT m.project_id INTO v_project_id 
    FROM modules m 
    WHERE m.id = COALESCE(NEW.module_id, OLD.module_id);
    
    IF TG_OP = 'INSERT' THEN
        v_action := 'created';
        v_details := jsonb_build_object(
            'name', NEW.name,
            'status', NEW.status,
            'priority', NEW.priority
        );
        
        INSERT INTO activity_logs (user_id, action, entity_type, entity_id, entity_name, details, project_id, module_id, submodule_id)
        VALUES (v_user_id, v_action, 'submodule', NEW.id, NEW.name, v_details, v_project_id, NEW.module_id, NEW.id);
        
    ELSIF TG_OP = 'UPDATE' THEN
        v_details := jsonb_build_object();
        
        IF OLD.name != NEW.name THEN
            v_details := v_details || jsonb_build_object('name_changed', jsonb_build_object('from', OLD.name, 'to', NEW.name));
        END IF;
        
        IF OLD.status != NEW.status THEN
            v_details := v_details || jsonb_build_object('status_changed', jsonb_build_object('from', OLD.status, 'to', NEW.status));
        END IF;
        
        IF OLD.priority != NEW.priority THEN
            v_details := v_details || jsonb_build_object('priority_changed', jsonb_build_object('from', OLD.priority, 'to', NEW.priority));
        END IF;
        
        IF OLD.start_date != NEW.start_date OR OLD.end_date != NEW.end_date THEN
            v_details := v_details || jsonb_build_object('dates_changed', jsonb_build_object(
                'start_date', jsonb_build_object('from', OLD.start_date, 'to', NEW.start_date),
                'end_date', jsonb_build_object('from', OLD.end_date, 'to', NEW.end_date)
            ));
        END IF;
        
        IF OLD.progress != NEW.progress THEN
            v_details := v_details || jsonb_build_object('progress_changed', jsonb_build_object('from', OLD.progress, 'to', NEW.progress));
        END IF;
        
        IF v_details != '{}'::jsonb THEN
            INSERT INTO activity_logs (user_id, action, entity_type, entity_id, entity_name, details, project_id, module_id, submodule_id)
            VALUES (v_user_id, 'updated', 'submodule', NEW.id, NEW.name, v_details, v_project_id, NEW.module_id, NEW.id);
        END IF;
        
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'deleted';
        v_details := jsonb_build_object('name', OLD.name);
        
        INSERT INTO activity_logs (user_id, action, entity_type, entity_id, entity_name, details, project_id, module_id, submodule_id)
        VALUES (v_user_id, v_action, 'submodule', OLD.id, OLD.name, v_details, v_project_id, OLD.module_id, OLD.id);
    END IF;
    
    RETURN COALESCE(NEW, OLD);
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error logging submodule activity: %', SQLERRM;
        RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to log task changes
CREATE OR REPLACE FUNCTION log_task_activity()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_action VARCHAR(50);
    v_details JSONB;
    v_project_id UUID;
    v_module_id UUID;
    v_submodule_id UUID;
BEGIN
    v_user_id := current_setting('app.current_user_id', true)::UUID;
    
    -- Get parent IDs
    v_module_id := COALESCE(NEW.module_id, OLD.module_id);
    v_submodule_id := COALESCE(NEW.submodule_id, OLD.submodule_id);
    
    IF v_submodule_id IS NOT NULL THEN
        SELECT m.project_id, s.module_id INTO v_project_id, v_module_id
        FROM submodules s
        JOIN modules m ON s.module_id = m.id
        WHERE s.id = v_submodule_id;
    ELSIF v_module_id IS NOT NULL THEN
        SELECT project_id INTO v_project_id FROM modules WHERE id = v_module_id;
    END IF;
    
    IF TG_OP = 'INSERT' THEN
        v_action := 'created';
        v_details := jsonb_build_object(
            'title', NEW.title,
            'status', NEW.status,
            'priority', NEW.priority
        );
        
        INSERT INTO activity_logs (user_id, action, entity_type, entity_id, entity_name, details, project_id, module_id, submodule_id, task_id)
        VALUES (v_user_id, v_action, 'task', NEW.id, NEW.title, v_details, v_project_id, v_module_id, v_submodule_id, NEW.id);
        
    ELSIF TG_OP = 'UPDATE' THEN
        v_details := jsonb_build_object();
        
        IF OLD.title != NEW.title THEN
            v_details := v_details || jsonb_build_object('title_changed', jsonb_build_object('from', OLD.title, 'to', NEW.title));
        END IF;
        
        IF OLD.status != NEW.status THEN
            v_details := v_details || jsonb_build_object('status_changed', jsonb_build_object('from', OLD.status, 'to', NEW.status));
        END IF;
        
        IF OLD.priority != NEW.priority THEN
            v_details := v_details || jsonb_build_object('priority_changed', jsonb_build_object('from', OLD.priority, 'to', NEW.priority));
        END IF;
        
        IF OLD.due_date != NEW.due_date THEN
            v_details := v_details || jsonb_build_object('due_date_changed', jsonb_build_object('from', OLD.due_date, 'to', NEW.due_date));
        END IF;
        
        IF OLD.assignee_id != NEW.assignee_id THEN
            v_details := v_details || jsonb_build_object('assignee_changed', jsonb_build_object('from', OLD.assignee_id, 'to', NEW.assignee_id));
        END IF;
        
        IF v_details != '{}'::jsonb THEN
            INSERT INTO activity_logs (user_id, action, entity_type, entity_id, entity_name, details, project_id, module_id, submodule_id, task_id)
            VALUES (v_user_id, 'updated', 'task', NEW.id, NEW.title, v_details, v_project_id, v_module_id, v_submodule_id, NEW.id);
        END IF;
        
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'deleted';
        v_details := jsonb_build_object('title', OLD.title);
        
        INSERT INTO activity_logs (user_id, action, entity_type, entity_id, entity_name, details, project_id, module_id, submodule_id, task_id)
        VALUES (v_user_id, v_action, 'task', OLD.id, OLD.title, v_details, v_project_id, v_module_id, v_submodule_id, OLD.id);
    END IF;
    
    RETURN COALESCE(NEW, OLD);
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error logging task activity: %', SQLERRM;
        RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_log_module_activity ON modules;
DROP TRIGGER IF EXISTS trigger_log_submodule_activity ON submodules;
DROP TRIGGER IF EXISTS trigger_log_task_activity ON tasks;

-- Create triggers
CREATE TRIGGER trigger_log_module_activity
    AFTER INSERT OR UPDATE OR DELETE ON modules
    FOR EACH ROW
    EXECUTE FUNCTION log_module_activity();

CREATE TRIGGER trigger_log_submodule_activity
    AFTER INSERT OR UPDATE OR DELETE ON submodules
    FOR EACH ROW
    EXECUTE FUNCTION log_submodule_activity();

CREATE TRIGGER trigger_log_task_activity
    AFTER INSERT OR UPDATE OR DELETE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION log_task_activity();

-- =====================
-- MIGRATE EXISTING TASK COMMENTS
-- =====================
INSERT INTO entity_comments (entity_type, entity_id, user_id, content, created_at, updated_at)
SELECT 
    'task'::VARCHAR(50) as entity_type,
    task_id as entity_id,
    user_id,
    content,
    created_at,
    updated_at
FROM task_comments
WHERE NOT EXISTS (
    SELECT 1 FROM entity_comments ec 
    WHERE ec.entity_type = 'task' 
    AND ec.entity_id = task_comments.task_id
    AND ec.content = task_comments.content
    AND ec.created_at = task_comments.created_at
);

-- Note: Keep task_comments table for backward compatibility
-- You can drop it later if needed: DROP TABLE IF EXISTS task_comments;
