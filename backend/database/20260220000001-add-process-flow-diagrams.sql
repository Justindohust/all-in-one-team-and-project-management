-- Migration: Add Process Flow Diagrams Table
-- This stores the visual process flow diagram data per project

-- =====================
-- PROCESS FLOW DIAGRAMS Table
-- =====================
CREATE TABLE IF NOT EXISTS process_flow_diagrams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE UNIQUE,
    modules_config JSONB DEFAULT '[]'::jsonb,
    module_data JSONB DEFAULT '{}'::jsonb,
    connection_data JSONB DEFAULT '{}'::jsonb,
    module_connections JSONB DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_process_flow_diagrams_project_id ON process_flow_diagrams(project_id);

-- Add comment for documentation
COMMENT ON TABLE process_flow_diagrams IS 'Stores visual process flow diagram data (modules, positions, connections) for each project';
COMMENT ON COLUMN process_flow_diagrams.modules_config IS 'Array of module configurations with position, style, submodules';
COMMENT ON COLUMN process_flow_diagrams.module_data IS 'Mapping of module ID to its data';
COMMENT ON COLUMN process_flow_diagrams.connection_data IS 'Mapping of submodule codes to connections';
COMMENT ON COLUMN process_flow_diagrams.module_connections IS 'Array of module-to-module connections';

