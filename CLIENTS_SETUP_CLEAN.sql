-- CLIENTS SETUP FOR SUPABASE - CLEAN VERSION
-- Copy and paste this ENTIRE content into your Supabase SQL Editor and run it

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
        COUNT(CASE WHEN s.status = 'active' THEN 1 END)::INTEGER AS subscription_count,
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
        CASE s.billing_cycle
            WHEN 'weekly' THEN s.cost * 4.33
            WHEN 'monthly' THEN s.cost
            WHEN 'quarterly' THEN s.cost / 3
            WHEN 'annual' THEN s.cost / 12
            ELSE s.cost
        END AS monthly_equivalent,
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
        0::DECIMAL AS monthly_equivalent,
        0::DECIMAL AS annual_equivalent
    FROM public.clients c
    INNER JOIN public.lifetime_deals ltd ON c.id = ltd.client_id
    WHERE c.user_id = p_user_id 
        AND ltd.user_id = p_user_id
        AND (p_client_id IS NULL OR c.id = p_client_id)
        AND ltd.status = 'active'
    
    ORDER BY client_name, service_name;
END;
$$;

-- 3. Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_clients_with_costs(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_client_cost_breakdown(UUID, UUID) TO authenticated;

-- 4. Create indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_subscriptions_client_id_status ON public.subscriptions(client_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_lifetime_deals_client_id_status ON public.lifetime_deals(client_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_clients_user_id_status ON public.clients(user_id, status);
