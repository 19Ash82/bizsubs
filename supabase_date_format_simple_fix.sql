-- Simple fix to add date_format_preference column to existing user_preferences table

-- Add the date_format_preference column if it doesn't exist
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS date_format_preference TEXT DEFAULT 'US' 
CHECK (date_format_preference IN ('US', 'EU', 'ISO'));

-- Add comment to explain the date format options
COMMENT ON COLUMN public.user_preferences.date_format_preference IS 
'Date format preference: US (Aug 4, 2025), EU (4 Aug 2025), ISO (2025-08-04)';

-- Update existing records to have default US format if they don't have one
UPDATE public.user_preferences 
SET date_format_preference = 'US' 
WHERE date_format_preference IS NULL;

-- Verify the column was added successfully
SELECT column_name, data_type, column_default, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_preferences' 
AND column_name = 'date_format_preference';
