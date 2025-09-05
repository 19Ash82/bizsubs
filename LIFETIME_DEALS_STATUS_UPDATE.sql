-- Update lifetime_deals status constraint to replace 'inactive' with 'shutdown'
-- Run this in your Supabase SQL Editor

-- 1. Drop the existing check constraint
ALTER TABLE public.lifetime_deals DROP CONSTRAINT IF EXISTS lifetime_deals_status_check;

-- 2. Add the new check constraint with 'shutdown' instead of 'inactive'
ALTER TABLE public.lifetime_deals ADD CONSTRAINT lifetime_deals_status_check 
    CHECK (status IN ('active', 'resold', 'shutdown'));

-- 3. Update any existing 'inactive' records to 'shutdown' (if any exist)
UPDATE public.lifetime_deals 
SET status = 'shutdown' 
WHERE status = 'inactive';

-- 4. Verify the constraint is working
SELECT DISTINCT status FROM public.lifetime_deals;
