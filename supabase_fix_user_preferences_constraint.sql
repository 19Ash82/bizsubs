-- Fix the user_preferences table to add the missing unique constraint on user_id
-- This will allow the ON CONFLICT (user_id) clause to work properly

-- First, let's check if there are any duplicate user_id records that would prevent adding the constraint
SELECT user_id, COUNT(*) as count 
FROM public.user_preferences 
GROUP BY user_id 
HAVING COUNT(*) > 1;

-- If there are duplicates, we'll need to clean them up first
-- Delete duplicate records, keeping only the most recent one for each user
DELETE FROM public.user_preferences 
WHERE id NOT IN (
    SELECT DISTINCT ON (user_id) id 
    FROM public.user_preferences 
    ORDER BY user_id, updated_at DESC
);

-- Now add the unique constraint on user_id
ALTER TABLE public.user_preferences 
ADD CONSTRAINT user_preferences_user_id_unique UNIQUE (user_id);

-- Verify the constraint was added
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    confupdtype,
    confdeltype
FROM pg_constraint 
WHERE conrelid = 'public.user_preferences'::regclass
AND contype = 'u';

-- Test that we can now do an upsert (this should work)
-- Note: This will only work if you're authenticated as a user
-- INSERT INTO public.user_preferences (user_id, date_format_preference) 
-- VALUES (auth.uid(), 'US') 
-- ON CONFLICT (user_id) DO UPDATE SET date_format_preference = 'US';
