-- Migration to add start_date column to subscriptions table
-- This migration adds start_date column and creates a function to calculate next_billing_date

-- 1. Add start_date column to subscriptions table
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS start_date DATE;

-- 2. Create function to calculate next billing date based on start date and billing cycle
CREATE OR REPLACE FUNCTION calculate_next_billing_date(
  start_date_param DATE,
  billing_cycle_param TEXT
) RETURNS DATE
LANGUAGE plpgsql
AS $$
BEGIN
  CASE billing_cycle_param
    WHEN 'weekly' THEN
      RETURN start_date_param + INTERVAL '1 week';
    WHEN 'monthly' THEN
      RETURN start_date_param + INTERVAL '1 month';
    WHEN 'quarterly' THEN
      RETURN start_date_param + INTERVAL '3 months';
    WHEN 'annual' THEN
      RETURN start_date_param + INTERVAL '1 year';
    ELSE
      -- Default to monthly if invalid billing cycle
      RETURN start_date_param + INTERVAL '1 month';
  END CASE;
END;
$$;

-- 3. Update existing subscriptions to set start_date based on next_billing_date
-- This estimates the start date by working backwards from next_billing_date
UPDATE public.subscriptions 
SET start_date = CASE 
  WHEN billing_cycle = 'weekly' THEN next_billing_date - INTERVAL '1 week'
  WHEN billing_cycle = 'monthly' THEN next_billing_date - INTERVAL '1 month'
  WHEN billing_cycle = 'quarterly' THEN next_billing_date - INTERVAL '3 months'
  WHEN billing_cycle = 'annual' THEN next_billing_date - INTERVAL '1 year'
  ELSE next_billing_date - INTERVAL '1 month'
END
WHERE start_date IS NULL AND next_billing_date IS NOT NULL;

-- 4. Create trigger to automatically update next_billing_date when start_date or billing_cycle changes
CREATE OR REPLACE FUNCTION update_next_billing_date_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only update next_billing_date if start_date is provided
  IF NEW.start_date IS NOT NULL THEN
    NEW.next_billing_date = calculate_next_billing_date(NEW.start_date, NEW.billing_cycle);
  END IF;
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS subscriptions_update_next_billing_date ON public.subscriptions;

-- Create new trigger
CREATE TRIGGER subscriptions_update_next_billing_date
  BEFORE INSERT OR UPDATE OF start_date, billing_cycle
  ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_next_billing_date_trigger();

-- 5. Add comment to document the change
COMMENT ON COLUMN public.subscriptions.start_date IS 'Start date of the subscription - next_billing_date is automatically calculated from this';
COMMENT ON FUNCTION calculate_next_billing_date IS 'Calculates the next billing date based on start date and billing cycle';

-- 6. Update RLS policies if needed (they should still work with the new column)
-- The existing RLS policies on subscriptions table should continue to work

-- 7. Grant necessary permissions
GRANT EXECUTE ON FUNCTION calculate_next_billing_date TO authenticated;
GRANT EXECUTE ON FUNCTION update_next_billing_date_trigger TO authenticated;
