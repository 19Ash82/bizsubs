-- Migration: Add cancelled_date field to subscriptions table
-- Date: 2024-12-20
-- Description: Add cancelled_date field to track when subscriptions end for proper tax calculations

-- Add cancelled_date column to subscriptions table
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS cancelled_date DATE;

-- Add comment for documentation
COMMENT ON COLUMN public.subscriptions.cancelled_date IS 'Date when subscription was cancelled (for pro-rated tax calculations)';

-- Update existing cancelled subscriptions to have a cancelled_date if they don't have one
-- This sets a default cancelled_date for existing cancelled subscriptions
UPDATE public.subscriptions 
SET cancelled_date = updated_at::DATE
WHERE status = 'cancelled' AND cancelled_date IS NULL;
