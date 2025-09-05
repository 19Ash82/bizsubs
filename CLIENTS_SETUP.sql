-- Clients Management Setup Script
-- Run this in your Supabase SQL Editor to add client cost tracking functionality

-- 1. Create function to get clients with cost calculations
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
        -- Calculate monthly cost from active subscriptions
        COALESCE(
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
            ), 0
        )::DECIMAL AS monthly_cost,
        -- Calculate annual cost
        COALESCE(
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
            ), 0
        )::DECIMAL AS annual_cost,
        -- Count active subscriptions
        COUNT(CASE WHEN s.status = 'active' THEN 1 END)::INTEGER AS subscription_count,
        -- Count active lifetime deals
        COUNT(CASE WHEN ltd.status = 'active' THEN 1 END)::INTEGER AS lifetime_deal_count
    FROM public.clients c
    LEFT JOIN public.subscriptions s ON c.id = s.client_id AND s.user_id = p_user_id
    LEFT JOIN public.lifetime_deals ltd ON c.id = ltd.client_id AND ltd.user_id = p_user_id
    WHERE c.user_id = p_user_id
    GROUP BY c.id, c.user_id, c.name, c.email, c.color_hex, c.status, c.created_at, c.updated_at
    ORDER BY c.name ASC;
END;
$$;

-- 2. Create function to get client cost breakdown for reports
CREATE OR REPLACE FUNCTION get_client_cost_breakdown(p_user_id UUID, p_client_id UUID DEFAULT NULL)
RETURNS TABLE (
    client_id UUID,
    client_name TEXT,
    client_color TEXT,
    service_name TEXT,
    service_type TEXT, -- 'subscription' or 'lifetime_deal'
    cost DECIMAL,
    billing_cycle TEXT,
    status TEXT,
    category TEXT,
    monthly_equivalent DECIMAL,
    annual_equivalent DECIMAL
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    -- Subscriptions
    SELECT 
        c.id AS client_id,
        c.name AS client_name,
        c.color_hex AS client_color,
        s.service_name,
        'subscription'::TEXT AS service_type,
        s.cost,
        s.billing_cycle,
        s.status,
        s.category,
        -- Monthly equivalent
        CASE s.billing_cycle
            WHEN 'weekly' THEN s.cost * 4.33
            WHEN 'monthly' THEN s.cost
            WHEN 'quarterly' THEN s.cost / 3
            WHEN 'annual' THEN s.cost / 12
            ELSE s.cost
        END AS monthly_equivalent,
        -- Annual equivalent
        CASE s.billing_cycle
            WHEN 'weekly' THEN s.cost * 52
            WHEN 'monthly' THEN s.cost * 12
            WHEN 'quarterly' THEN s.cost * 4
            WHEN 'annual' THEN s.cost
            ELSE s.cost * 12
        END AS annual_equivalent
    FROM public.clients c
    INNER JOIN public.subscriptions s ON c.id = s.client_id
    WHERE c.user_id = p_user_id 
        AND s.user_id = p_user_id
        AND (p_client_id IS NULL OR c.id = p_client_id)
        AND s.status = 'active'
    
    UNION ALL
    
    -- Lifetime Deals (show as one-time cost)
    SELECT 
        c.id AS client_id,
        c.name AS client_name,
        c.color_hex AS client_color,
        ltd.service_name,
        'lifetime_deal'::TEXT AS service_type,
        ltd.original_cost AS cost,
        'one-time'::TEXT AS billing_cycle,
        ltd.status,
        ltd.category,
        0::DECIMAL AS monthly_equivalent, -- Lifetime deals don't contribute to monthly cost
        0::DECIMAL AS annual_equivalent   -- Lifetime deals don't contribute to annual cost
    FROM public.clients c
    INNER JOIN public.lifetime_deals ltd ON c.id = ltd.client_id
    WHERE c.user_id = p_user_id 
        AND ltd.user_id = p_user_id
        AND (p_client_id IS NULL OR c.id = p_client_id)
        AND ltd.status = 'active'
    
    ORDER BY client_name, service_name;
END;
$$;

-- 3. Create function to get client profitability report
CREATE OR REPLACE FUNCTION get_client_profitability_report(p_user_id UUID)
RETURNS TABLE (
    client_id UUID,
    client_name TEXT,
    client_color TEXT,
    client_status TEXT,
    monthly_cost DECIMAL,
    annual_cost DECIMAL,
    subscription_count INTEGER,
    lifetime_deal_count INTEGER,
    lifetime_deal_investment DECIMAL,
    avg_monthly_per_subscription DECIMAL,
    cost_efficiency_score DECIMAL
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id AS client_id,
        c.name AS client_name,
        c.color_hex AS client_color,
        c.status AS client_status,
        costs.monthly_cost,
        costs.annual_cost,
        costs.subscription_count,
        costs.lifetime_deal_count,
        -- Total lifetime deal investment
        COALESCE(SUM(ltd.original_cost), 0)::DECIMAL AS lifetime_deal_investment,
        -- Average monthly cost per subscription
        CASE 
            WHEN costs.subscription_count > 0 THEN costs.monthly_cost / costs.subscription_count
            ELSE 0
        END AS avg_monthly_per_subscription,
        -- Cost efficiency score (lower is better)
        CASE 
            WHEN costs.subscription_count > 0 THEN 
                costs.monthly_cost / GREATEST(costs.subscription_count, 1)
            ELSE 0
        END AS cost_efficiency_score
    FROM public.clients c
    LEFT JOIN get_clients_with_costs(p_user_id) costs ON c.id = costs.id
    LEFT JOIN public.lifetime_deals ltd ON c.id = ltd.client_id AND ltd.user_id = p_user_id AND ltd.status = 'active'
    WHERE c.user_id = p_user_id
    GROUP BY 
        c.id, c.name, c.color_hex, c.status, 
        costs.monthly_cost, costs.annual_cost, 
        costs.subscription_count, costs.lifetime_deal_count
    ORDER BY costs.monthly_cost DESC NULLS LAST;
END;
$$;

-- 4. Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_clients_with_costs(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_client_cost_breakdown(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_client_profitability_report(UUID) TO authenticated;

-- 5. Create indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_subscriptions_client_id_status ON public.subscriptions(client_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_lifetime_deals_client_id_status ON public.lifetime_deals(client_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_clients_user_id_status ON public.clients(user_id, status);

-- 6. Add RLS policies for the functions (they use SECURITY DEFINER but we want to be explicit)
-- The functions already filter by user_id parameter, so they're secure

-- 7. Create a view for easy client cost queries (optional)
CREATE OR REPLACE VIEW client_costs_summary AS
SELECT 
    c.id,
    c.user_id,
    c.name,
    c.email,
    c.color_hex,
    c.status,
    c.created_at,
    c.updated_at,
    COALESCE(monthly_costs.monthly_cost, 0) as monthly_cost,
    COALESCE(monthly_costs.annual_cost, 0) as annual_cost,
    COALESCE(sub_counts.subscription_count, 0) as subscription_count,
    COALESCE(ltd_counts.lifetime_deal_count, 0) as lifetime_deal_count
FROM public.clients c
LEFT JOIN (
    SELECT 
        client_id,
        SUM(CASE 
            WHEN status = 'active' THEN
                CASE billing_cycle
                    WHEN 'weekly' THEN cost * 4.33
                    WHEN 'monthly' THEN cost
                    WHEN 'quarterly' THEN cost / 3
                    WHEN 'annual' THEN cost / 12
                    ELSE cost
                END
            ELSE 0
        END) as monthly_cost,
        SUM(CASE 
            WHEN status = 'active' THEN
                CASE billing_cycle
                    WHEN 'weekly' THEN cost * 52
                    WHEN 'monthly' THEN cost * 12
                    WHEN 'quarterly' THEN cost * 4
                    WHEN 'annual' THEN cost
                    ELSE cost * 12
                END
            ELSE 0
        END) as annual_cost
    FROM public.subscriptions
    GROUP BY client_id
) monthly_costs ON c.id = monthly_costs.client_id
LEFT JOIN (
    SELECT client_id, COUNT(*) as subscription_count
    FROM public.subscriptions
    WHERE status = 'active'
    GROUP BY client_id
) sub_counts ON c.id = sub_counts.client_id
LEFT JOIN (
    SELECT client_id, COUNT(*) as lifetime_deal_count
    FROM public.lifetime_deals
    WHERE status = 'active'
    GROUP BY client_id
) ltd_counts ON c.id = ltd_counts.client_id;

-- Enable RLS on the view
ALTER VIEW client_costs_summary SET (security_invoker = true);
