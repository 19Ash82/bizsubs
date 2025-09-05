-- PROJECTS FUNCTIONS ONLY
-- Run this AFTER the minimal setup works

-- 1. Function to get projects with cost calculations
CREATE OR REPLACE FUNCTION get_projects_with_costs(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    client_id UUID,
    client_name TEXT,
    client_color TEXT,
    name TEXT,
    description TEXT,
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
        p.id,
        p.user_id,
        p.client_id,
        c.name AS client_name,
        c.color_hex AS client_color,
        p.name,
        p.description,
        COALESCE(p.color_hex, '#3B82F6') AS color_hex,
        p.status,
        p.created_at,
        p.updated_at,
        -- Calculate monthly cost from subscriptions assigned to this project
        COALESCE(sub_data.monthly_cost, 0)::DECIMAL AS monthly_cost,
        -- Calculate annual cost from subscriptions assigned to this project
        COALESCE(sub_data.annual_cost, 0)::DECIMAL AS annual_cost,
        -- Subscription count
        COALESCE(sub_data.subscription_count, 0)::INTEGER AS subscription_count,
        -- Lifetime deal count
        COALESCE(ltd_data.lifetime_deal_count, 0)::INTEGER AS lifetime_deal_count
    FROM public.projects p
    LEFT JOIN public.clients c ON p.client_id = c.id
    LEFT JOIN (
        SELECT 
            s.project_id,
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
        WHERE s.user_id = p_user_id AND s.project_id IS NOT NULL
        GROUP BY s.project_id
    ) sub_data ON p.id = sub_data.project_id
    LEFT JOIN (
        SELECT 
            ltd.project_id,
            COUNT(*) AS lifetime_deal_count
        FROM public.lifetime_deals ltd
        WHERE ltd.user_id = p_user_id AND ltd.project_id IS NOT NULL AND ltd.status = 'active'
        GROUP BY ltd.project_id
    ) ltd_data ON p.id = ltd_data.project_id
    WHERE p.user_id = p_user_id
    ORDER BY p.name;
END;
$$;

-- 2. Function to get project cost breakdown
CREATE OR REPLACE FUNCTION get_project_cost_breakdown(p_user_id UUID, p_project_id UUID)
RETURNS TABLE (
    project_id UUID,
    project_name TEXT,
    project_color TEXT,
    service_name TEXT,
    service_type TEXT,
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
    -- Subscriptions assigned to this project
    SELECT 
        p.id AS project_id,
        p.name AS project_name,
        COALESCE(p.color_hex, '#3B82F6') AS project_color,
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
    FROM public.projects p
    INNER JOIN public.subscriptions s ON p.id = s.project_id
    WHERE p.user_id = p_user_id 
        AND s.user_id = p_user_id
        AND p.id = p_project_id
        AND s.status = 'active'
    
    UNION ALL
    
    -- Lifetime Deals assigned to this project
    SELECT 
        p.id AS project_id,
        p.name AS project_name,
        COALESCE(p.color_hex, '#3B82F6') AS project_color,
        ltd.service_name,
        'lifetime_deal'::TEXT AS service_type,
        ltd.original_cost AS cost,
        'one-time'::TEXT AS billing_cycle,
        ltd.status,
        ltd.category,
        0::DECIMAL AS monthly_equivalent, -- Lifetime deals don't contribute to monthly cost
        0::DECIMAL AS annual_equivalent   -- Lifetime deals don't contribute to annual cost
    FROM public.projects p
    INNER JOIN public.lifetime_deals ltd ON p.id = ltd.project_id
    WHERE p.user_id = p_user_id 
        AND ltd.user_id = p_user_id
        AND p.id = p_project_id
        AND ltd.status = 'active'
    
    ORDER BY service_name;
END;
$$;

-- Test the functions
SELECT 'Functions created successfully!' AS result;

