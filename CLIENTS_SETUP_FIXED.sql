-- CLIENTS SETUP - FIXED VERSION
-- This fixes the counting issue with lifetime deals vs subscriptions
-- Copy and paste this ENTIRE content into your Supabase SQL Editor and run it

-- 1. Drop and recreate the function with proper counting logic
DROP FUNCTION IF EXISTS get_clients_with_costs(UUID);

CREATE OR REPLACE FUNCTION get_clients_with_costs(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    name TEXT,
    email TEXT,
    color_hex TEXT,
    status TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    monthly_cost DECIMAL,
    annual_cost DECIMAL,
    subscription_count INTEGER,
    lifetime_deal_count INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.user_id,
        c.name,
        c.email,
        c.color_hex,
        c.status,
        c.created_at,
        c.updated_at,
        -- Monthly cost calculation from subscriptions only
        COALESCE(sub_data.monthly_cost, 0)::DECIMAL AS monthly_cost,
        -- Annual cost calculation from subscriptions only  
        COALESCE(sub_data.annual_cost, 0)::DECIMAL AS annual_cost,
        -- Subscription count
        COALESCE(sub_data.subscription_count, 0)::INTEGER AS subscription_count,
        -- Lifetime deal count
        COALESCE(ltd_data.lifetime_deal_count, 0)::INTEGER AS lifetime_deal_count
    FROM public.clients c
    LEFT JOIN (
        -- Subquery for subscription data to avoid JOIN issues
        SELECT 
            s.client_id,
            SUM(
                CASE 
                    WHEN s.status = 'active' THEN
                        CASE s.billing_cycle
                            WHEN 'weekly' THEN s.cost * 4.33
                            WHEN 'monthly' THEN s.cost
                            WHEN 'quarterly' THEN s.cost / 3
                            WHEN 'annual' THEN s.cost / 12
                            ELSE s.cost
                        END
                    ELSE 0
                END
            ) AS monthly_cost,
            SUM(
                CASE 
                    WHEN s.status = 'active' THEN
                        CASE s.billing_cycle
                            WHEN 'weekly' THEN s.cost * 52
                            WHEN 'monthly' THEN s.cost * 12
                            WHEN 'quarterly' THEN s.cost * 4
                            WHEN 'annual' THEN s.cost
                            ELSE s.cost * 12
                        END
                    ELSE 0
                END
            ) AS annual_cost,
            COUNT(CASE WHEN s.status = 'active' THEN 1 END) AS subscription_count
        FROM public.subscriptions s
        WHERE s.user_id = p_user_id
        GROUP BY s.client_id
    ) sub_data ON c.id = sub_data.client_id
    LEFT JOIN (
        -- Subquery for lifetime deal data to avoid JOIN issues
        SELECT 
            ltd.client_id,
            COUNT(CASE WHEN ltd.status = 'active' THEN 1 END) AS lifetime_deal_count
        FROM public.lifetime_deals ltd
        WHERE ltd.user_id = p_user_id
        GROUP BY ltd.client_id
    ) ltd_data ON c.id = ltd_data.client_id
    WHERE c.user_id = p_user_id
    ORDER BY c.name ASC;
END;
$$;

-- 2. Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_clients_with_costs(UUID) TO authenticated;

-- 3. Test the function (optional - you can run this to verify it works)
-- SELECT * FROM get_clients_with_costs('your-user-id-here');
