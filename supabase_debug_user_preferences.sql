-- Debug script to check user_preferences table status
-- Run this to see what's happening with the table

-- 1. Check if the table exists
SELECT 
    table_name, 
    table_type,
    table_schema
FROM information_schema.tables 
WHERE table_name = 'user_preferences';

-- 2. Check table structure if it exists
SELECT 
    column_name, 
    data_type, 
    column_default, 
    is_nullable,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'user_preferences' 
ORDER BY ordinal_position;

-- 3. Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_preferences';

-- 4. Check if there are any existing records
SELECT COUNT(*) as record_count FROM public.user_preferences;

-- 5. Check current user context
SELECT 
    auth.uid() as current_user_id,
    auth.role() as current_role;

-- 6. Try to see if we can select from the table
SELECT * FROM public.user_preferences LIMIT 5;
