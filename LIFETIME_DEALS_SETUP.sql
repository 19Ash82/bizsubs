-- Complete Lifetime Deals Setup Script
-- Run this in your Supabase SQL Editor

-- 1. Create lifetime_deals table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.lifetime_deals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    service_name TEXT NOT NULL,
    original_cost DECIMAL NOT NULL,
    purchase_date DATE NOT NULL,
    category TEXT DEFAULT 'software',
    business_expense BOOLEAN DEFAULT true,
    tax_deductible BOOLEAN DEFAULT true,
    resold_price DECIMAL,
    resold_date DATE,
    profit_loss DECIMAL GENERATED ALWAYS AS (resold_price - original_cost) STORED,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resold', 'inactive')),
    notes TEXT,
    currency TEXT DEFAULT 'USD' CHECK (currency IN ('USD', 'EUR', 'GBP', 'CAD')),
    tax_rate DECIMAL DEFAULT 30.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE public.lifetime_deals ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policy
CREATE POLICY "Users can manage own lifetime deals" ON public.lifetime_deals
    FOR ALL USING (auth.uid() = user_id);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lifetime_deals_user_id ON public.lifetime_deals(user_id);
CREATE INDEX IF NOT EXISTS idx_lifetime_deals_client_id ON public.lifetime_deals(client_id);
CREATE INDEX IF NOT EXISTS idx_lifetime_deals_project_id ON public.lifetime_deals(project_id);
CREATE INDEX IF NOT EXISTS idx_lifetime_deals_status ON public.lifetime_deals(status);
CREATE INDEX IF NOT EXISTS idx_lifetime_deals_purchase_date ON public.lifetime_deals(purchase_date DESC);

-- 5. Create updated_at trigger
CREATE TRIGGER update_lifetime_deals_updated_at BEFORE UPDATE ON public.lifetime_deals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Verify the table was created correctly
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'lifetime_deals' 
    AND table_schema = 'public'
ORDER BY ordinal_position;
