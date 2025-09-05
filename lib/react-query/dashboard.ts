// Updated 2024-12-20: React Query hooks for dashboard data
// Implements PRD requirements: intelligent caching and real-time collaboration

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

// Types
export interface ActivityLog {
  id: string;
  user_email: string;
  action_type: 'create' | 'update' | 'delete';
  resource_type: string;
  resource_id: string;
  description: string;
  timestamp: string;
}

export interface DashboardMetrics {
  totalMonthlyRecurring: number;
  annualBusinessSpend: number;
  taxDeductibleAmount: number;
  thisMonthRenewals: number;
  currency: string;
}

export interface UpcomingRenewal {
  id: string;
  service_name: string;
  cost: number;
  currency: string;
  next_billing_date: string;
  billing_cycle: string;
  client_name?: string;
  client_color?: string;
  status: string;
}

// Query keys
export const dashboardKeys = {
  all: ['dashboard'] as const,
  metrics: () => [...dashboardKeys.all, 'metrics'] as const,
  activity: () => [...dashboardKeys.all, 'activity'] as const,
  renewals: () => [...dashboardKeys.all, 'renewals'] as const,
};

// Fetch dashboard metrics
export function useDashboardMetrics() {
  return useQuery({
    queryKey: dashboardKeys.metrics(),
    queryFn: async (): Promise<DashboardMetrics> => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('User not authenticated');

      // Get active subscriptions
      const { data: subscriptions, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (error) throw error;

      const subs = subscriptions || [];

      // Calculate total monthly recurring
      const totalMonthlyRecurring = subs.reduce((sum, sub) => {
        const monthlyAmount = sub.billing_cycle === 'monthly' ? sub.cost :
                             sub.billing_cycle === 'annual' ? sub.cost / 12 :
                             sub.billing_cycle === 'quarterly' ? sub.cost / 3 :
                             sub.billing_cycle === 'weekly' ? sub.cost * 4.33 : sub.cost;
        return sum + monthlyAmount;
      }, 0);

      // Calculate annual business spend
      const annualBusinessSpend = subs.reduce((sum, sub) => {
        if (!sub.business_expense) return sum;
        const annualAmount = sub.billing_cycle === 'annual' ? sub.cost :
                           sub.billing_cycle === 'monthly' ? sub.cost * 12 :
                           sub.billing_cycle === 'quarterly' ? sub.cost * 4 :
                           sub.billing_cycle === 'weekly' ? sub.cost * 52 : sub.cost * 12;
        return sum + annualAmount;
      }, 0);

      // Calculate tax deductible amount
      const taxDeductibleAmount = subs.reduce((sum, sub) => {
        if (!sub.tax_deductible) return sum;
        const annualAmount = sub.billing_cycle === 'annual' ? sub.cost :
                           sub.billing_cycle === 'monthly' ? sub.cost * 12 :
                           sub.billing_cycle === 'quarterly' ? sub.cost * 4 :
                           sub.billing_cycle === 'weekly' ? sub.cost * 52 : sub.cost * 12;
        return sum + (annualAmount * (sub.tax_rate || 0) / 100);
      }, 0);

      // Calculate renewals this month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const thisMonthRenewals = subs.filter(sub => {
        const nextBilling = new Date(sub.next_billing_date);
        return nextBilling >= startOfMonth && nextBilling <= endOfMonth;
      }).length;

      // Get user's currency preference
      const { data: profile } = await supabase
        .from('users')
        .select('currency_preference')
        .eq('id', user.id)
        .single();

      return {
        totalMonthlyRecurring,
        annualBusinessSpend,
        taxDeductibleAmount,
        thisMonthRenewals,
        currency: profile?.currency_preference || 'USD'
      };
    },
  });
}

// Fetch recent activity
export function useRecentActivity(limit: number = 10) {
  return useQuery({
    queryKey: [...dashboardKeys.activity(), { limit }],
    queryFn: async (): Promise<ActivityLog[]> => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
  });
}

// Fetch upcoming renewals
export function useUpcomingRenewals(days: number = 30) {
  return useQuery({
    queryKey: [...dashboardKeys.renewals(), { days }],
    queryFn: async (): Promise<UpcomingRenewal[]> => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('User not authenticated');

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);

      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          clients (name, color_hex)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .lte('next_billing_date', endDate.toISOString())
        .order('next_billing_date', { ascending: true });

      if (error) throw error;

      return (data || []).map(sub => ({
        id: sub.id,
        service_name: sub.service_name,
        cost: sub.cost,
        currency: sub.currency,
        next_billing_date: sub.next_billing_date,
        billing_cycle: sub.billing_cycle,
        client_name: sub.clients?.name,
        client_color: sub.clients?.color_hex,
        status: sub.status
      }));
    },
  });
}
