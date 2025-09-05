-- PROJECTS TABLE DIAGNOSIS
-- Run this first to see what's actually in your projects table

-- 1. Check if projects table exists and see its structure
SELECT 
    'Current projects table structure:' AS info,
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check if the table exists at all
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'projects'
) AS projects_table_exists;

-- 3. If it exists, show a sample of data (will fail gracefully if no data)
SELECT 'Sample data from projects:' AS info;
SELECT * FROM public.projects LIMIT 3;

