-- Migration: Add tax_rate field to lifetime_deals table
-- Date: 2024-12-20
-- Description: Add tax_rate field to lifetime_deals table to match PRD requirements

-- Add tax_rate column to lifetime_deals table
ALTER TABLE public.lifetime_deals 
ADD COLUMN IF NOT EXISTS tax_rate DECIMAL DEFAULT 30.0;
