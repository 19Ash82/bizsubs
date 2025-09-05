-- Migration to add date format preference to user preferences
-- This allows users to choose their preferred date display format

-- Add date_format_preference column to user_preferences table
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS date_format_preference TEXT DEFAULT 'US' CHECK (date_format_preference IN ('US', 'EU', 'ISO'));

-- Add comment to explain the options
COMMENT ON COLUMN public.user_preferences.date_format_preference IS 
'Date format preference: US (Aug 4, 2025), EU (4 Aug 2025), ISO (2025-08-04)';

-- Update existing records to have default US format
UPDATE public.user_preferences 
SET date_format_preference = 'US' 
WHERE date_format_preference IS NULL;
