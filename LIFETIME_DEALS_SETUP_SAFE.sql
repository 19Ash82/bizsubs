-- Safe Lifetime Deals Setup Script
-- This version handles existing components gracefully

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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add tax_rate column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lifetime_deals' 
        AND column_name = 'tax_rate'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.lifetime_deals ADD COLUMN tax_rate DECIMAL DEFAULT 30.0;
    END IF;
END $$;

-- 3. Enable Row Level Security (safe)
ALTER TABLE public.lifetime_deals ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policy (safe - drop and recreate)
DROP POLICY IF EXISTS "Users can manage own lifetime deals" ON public.lifetime_deals;
CREATE POLICY "Users can manage own lifetime deals" ON public.lifetime_deals
    FOR ALL USING (auth.uid() = user_id);

-- 5. Create indexes (safe with IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_lifetime_deals_user_id ON public.lifetime_deals(user_id);
CREATE INDEX IF NOT EXISTS idx_lifetime_deals_client_id ON public.lifetime_deals(client_id);
CREATE INDEX IF NOT EXISTS idx_lifetime_deals_project_id ON public.lifetime_deals(project_id);
CREATE INDEX IF NOT EXISTS idx_lifetime_deals_status ON public.lifetime_deals(status);
CREATE INDEX IF NOT EXISTS idx_lifetime_deals_purchase_date ON public.lifetime_deals(purchase_date DESC);

-- 6. Create updated_at trigger (safe - drop and recreate)
DROP TRIGGER IF EXISTS update_lifetime_deals_updated_at ON public.lifetime_deals;
CREATE TRIGGER update_lifetime_deals_updated_at BEFORE UPDATE ON public.lifetime_deals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Verify the final table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'lifetime_deals' 
    AND table_schema = 'public'
ORDER BY ordinal_position;
