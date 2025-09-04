-- Migration: Add tax_rate field to subscriptions table
-- Run this in your Supabase SQL Editor to add tax percentage tracking per subscription

-- Add tax_rate column to subscriptions table
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS tax_rate DECIMAL DEFAULT 30.0;

-- Add comment for documentation
COMMENT ON COLUMN public.subscriptions.tax_rate IS 'Tax rate percentage for this subscription (e.g., 30.0 for 30%)';

-- Update existing subscriptions to use the default tax rate from users table
-- This ensures existing subscriptions have proper tax rates
UPDATE public.subscriptions 
SET tax_rate = (
  SELECT COALESCE(u.tax_rate, 30.0) 
  FROM public.users u 
  WHERE u.id = subscriptions.user_id
)
WHERE tax_rate IS NULL;

-- Make the field NOT NULL after setting default values
ALTER TABLE public.subscriptions 
ALTER COLUMN tax_rate SET NOT NULL;
