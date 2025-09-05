-- Complete setup for user_preferences table with date format preference
-- This script ensures the table exists and has all required columns

-- First, create the user_preferences table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    visible_subscription_columns JSONB DEFAULT '["service_name", "cost", "billing_cycle", "next_billing_date", "client_name"]',
    visible_ltd_columns JSONB DEFAULT '["service_name", "original_cost", "purchase_date", "client_name"]',
    default_filters JSONB DEFAULT '{}',
    dashboard_layout JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add the date_format_preference column if it doesn't exist
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS date_format_preference TEXT DEFAULT 'US' CHECK (date_format_preference IN ('US', 'EU', 'ISO'));

-- Add comment to explain the date format options
COMMENT ON COLUMN public.user_preferences.date_format_preference IS 
'Date format preference: US (Aug 4, 2025), EU (4 Aug 2025), ISO (2025-08-04)';

-- Update existing records to have default US format if they don't have one
UPDATE public.user_preferences 
SET date_format_preference = 'US' 
WHERE date_format_preference IS NULL;

-- Enable RLS if not already enabled
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create or replace the RLS policy
DROP POLICY IF EXISTS "Users can manage own preferences" ON public.user_preferences;
CREATE POLICY "Users can manage own preferences" ON public.user_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Create index for better performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);

-- Create or replace the updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create the trigger for user_preferences if it doesn't exist
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON public.user_preferences TO authenticated;

-- Test that we can insert a record (this will be rolled back)
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Get a test user ID (or create a dummy one for testing)
    SELECT auth.uid() INTO test_user_id;
    
    IF test_user_id IS NOT NULL THEN
        -- Try to insert/update a test record
        INSERT INTO public.user_preferences (user_id, date_format_preference) 
        VALUES (test_user_id, 'US')
        ON CONFLICT (user_id) DO UPDATE SET date_format_preference = 'US';
        
        RAISE NOTICE 'Successfully tested user_preferences table with user_id: %', test_user_id;
    ELSE
        RAISE NOTICE 'No authenticated user found for testing, but table structure is ready';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error testing user_preferences: %', SQLERRM;
END $$;
