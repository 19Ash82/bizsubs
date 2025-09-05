// Updated 2024-12-20: React Query hooks for lifetime deals operations with optimistic updates
// Implements PRD requirements: immediate UI feedback, team collaboration, audit trails

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { clientKeys } from './clients';
import { invalidateAfterLifetimeDealChange } from './invalidation-utils';

// Types
export interface LifetimeDeal {
  id: string;
  user_id: string;
  service_name: string;
  original_cost: number;
  purchase_date: string;
  category: string;
  status: 'active' | 'resold' | 'shutdown';
  currency: string;
  client_id?: string;
  project_id?: string;
  business_expense: boolean;
  tax_deductible: boolean;
  resold_price?: number;
  resold_date?: string;
  profit_loss?: number; // Calculated field
  notes?: string;
  tax_rate: number;
  created_at: string;
  updated_at: string;
  clients?: {
    name: string;
    color_hex: string;
  };
  projects?: {
    name: string;
  };
}

export interface CreateLifetimeDealData {
  service_name: string;
  original_cost: number;
  purchase_date: string;
  category: string;
  status: 'active' | 'resold' | 'shutdown';
  currency: string;
  client_id?: string | null;
  project_id?: string | null;
  business_expense: boolean;
  tax_deductible: boolean;
  resold_price?: number;
  resold_date?: string;
  notes?: string;
  tax_rate: number;
}

export interface UpdateLifetimeDealData extends CreateLifetimeDealData {
  id: string;
}

// Query keys
export const lifetimeDealKeys = {
  all: ['lifetime-deals'] as const,
  lists: () => [...lifetimeDealKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...lifetimeDealKeys.lists(), filters] as const,
  details: () => [...lifetimeDealKeys.all, 'detail'] as const,
  detail: (id: string) => [...lifetimeDealKeys.details(), id] as const,
  portfolio: () => [...lifetimeDealKeys.all, 'portfolio'] as const,
};

// Activity logging helper
async function logActivity(
  action: 'create' | 'update' | 'delete',
  resourceId: string,
  description: string
) {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  
  if (userData.user) {
    await supabase.from('activity_logs').insert({
      user_id: userData.user.id,
      user_email: userData.user.email!,
      action_type: action,
      resource_type: 'lifetime_deal',
      resource_id: resourceId,
      description,
    });
  }
}

// Fetch lifetime deals
export function useLifetimeDeals(filters: Record<string, any> = {}) {
  return useQuery({
    queryKey: lifetimeDealKeys.list(filters),
    queryFn: async (): Promise<LifetimeDeal[]> => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('lifetime_deals')
        .select(`
          *,
          clients (name, color_hex),
          projects (name)
        `)
        .eq('user_id', user.id);

      // Apply filters
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.client_id && filters.client_id !== 'all') {
        query = query.eq('client_id', filters.client_id);
      }
      if (filters.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }

      query = query.order('purchase_date', { ascending: false });

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    },
  });
}

// Get portfolio overview
export function useLifetimeDealsPortfolio() {
  return useQuery({
    queryKey: lifetimeDealKeys.portfolio(),
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('lifetime_deals')
        .select('original_cost, resold_price, status, currency')
        .eq('user_id', user.id);

      if (error) throw error;

      // Calculate portfolio metrics
      const totalInvested = data.reduce((sum, deal) => sum + deal.original_cost, 0);
      const totalResold = data
        .filter(deal => deal.status === 'resold' && deal.resold_price)
        .reduce((sum, deal) => sum + (deal.resold_price || 0), 0);
      const realizedGains = data
        .filter(deal => deal.status === 'resold' && deal.resold_price)
        .reduce((sum, deal) => sum + ((deal.resold_price || 0) - deal.original_cost), 0);
      const activeDealsValue = data
        .filter(deal => deal.status === 'active')
        .reduce((sum, deal) => sum + deal.original_cost, 0);

      return {
        totalInvested,
        totalResold,
        realizedGains,
        activeDealsValue,
        totalDeals: data.length,
        activeDeals: data.filter(deal => deal.status === 'active').length,
        resoldDeals: data.filter(deal => deal.status === 'resold').length,
      };
    },
  });
}

// Create lifetime deal mutation
export function useCreateLifetimeDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateLifetimeDealData): Promise<LifetimeDeal> => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('User not authenticated');

      const lifetimeDealData = {
        user_id: user.id,
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: newLifetimeDeal, error } = await supabase
        .from('lifetime_deals')
        .insert(lifetimeDealData)
        .select(`
          *,
          clients (name, color_hex),
          projects (name)
        `)
        .single();

      if (error) throw error;

      // Log activity
      await logActivity('create', newLifetimeDeal.id, `Created lifetime deal: ${data.service_name}`);

      return newLifetimeDeal;
    },
    onMutate: async (newLifetimeDeal) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: lifetimeDealKeys.lists() });

      // Snapshot the previous value
      const previousLifetimeDeals = queryClient.getQueriesData({ queryKey: lifetimeDealKeys.lists() });

      // Optimistically update to the new value
      queryClient.setQueriesData({ queryKey: lifetimeDealKeys.lists() }, (old: LifetimeDeal[] | undefined) => {
        if (!old) return [];
        
        const optimisticLifetimeDeal: LifetimeDeal = {
          id: `temp-${Date.now()}`, // Temporary ID
          user_id: 'temp-user',
          ...newLifetimeDeal,
          profit_loss: newLifetimeDeal.resold_price ? newLifetimeDeal.resold_price - newLifetimeDeal.original_cost : undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        return [optimisticLifetimeDeal, ...old];
      });

      // Return context object with the snapshotted value
      return { previousLifetimeDeals };
    },
    onError: (err, newLifetimeDeal, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousLifetimeDeals) {
        context.previousLifetimeDeals.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      
      toast.error('Failed to create lifetime deal', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    },
    onSuccess: (data) => {
      toast.success('Lifetime deal created successfully');
    },
    onSettled: () => {
      // Always refetch after error or success (same as subscriptions)
      queryClient.invalidateQueries({ queryKey: lifetimeDealKeys.lists() });
      // Invalidate client cost data since lifetime deal creation affects client costs
      queryClient.invalidateQueries({ queryKey: clientKeys.costs() });
      // Also invalidate the broader client keys to catch all variations
      queryClient.invalidateQueries({ queryKey: clientKeys.all });
    },
  });
}

// Update lifetime deal mutation
export function useUpdateLifetimeDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateLifetimeDealData): Promise<LifetimeDeal> => {
      console.log('🔍 LIFETIME DEAL UPDATE REQUEST:', {
        originalData: data,
        client_id: data.client_id,
        client_id_type: typeof data.client_id
      });

      const supabase = createClient();

      const { id, ...updateData } = data;
      const finalUpdateData = {
        ...updateData,
        updated_at: new Date().toISOString(),
      };

      console.log('🔍 SUPABASE UPDATE PAYLOAD:', {
        id,
        finalUpdateData,
        client_id: finalUpdateData.client_id,
        client_id_type: typeof finalUpdateData.client_id
      });

      const { data: updatedLifetimeDeal, error } = await supabase
        .from('lifetime_deals')
        .update(finalUpdateData)
        .eq('id', id)
        .select(`
          *,
          clients (name, color_hex),
          projects (name)
        `)
        .single();

      console.log('🔍 SUPABASE UPDATE RESPONSE:', {
        updatedLifetimeDeal,
        client_id: updatedLifetimeDeal?.client_id,
        clients: updatedLifetimeDeal?.clients,
        error
      });

      if (error) {
        console.error('❌ SUPABASE UPDATE ERROR:', error);
        throw error;
      }

      // Log activity
      await logActivity('update', id, `Updated lifetime deal: ${data.service_name}`);

      return updatedLifetimeDeal;
    },
    onMutate: async (updatedLifetimeDeal) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: lifetimeDealKeys.lists() });

      // Snapshot the previous value
      const previousLifetimeDeals = queryClient.getQueriesData({ queryKey: lifetimeDealKeys.lists() });

      // Optimistically update to the new value
      queryClient.setQueriesData({ queryKey: lifetimeDealKeys.lists() }, (old: LifetimeDeal[] | undefined) => {
        if (!old) return [];
        
        return old.map(lifetimeDeal => 
          lifetimeDeal.id === updatedLifetimeDeal.id
            ? { ...lifetimeDeal, ...updatedLifetimeDeal, updated_at: new Date().toISOString() }
            : lifetimeDeal
        );
      });

      // Return context object with the snapshotted value
      return { previousLifetimeDeals };
    },
    onError: (err, updatedLifetimeDeal, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousLifetimeDeals) {
        context.previousLifetimeDeals.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      
      toast.error('Failed to update lifetime deal', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    },
    onSuccess: (data) => {
      toast.success('Lifetime deal updated successfully');
    },
    onSettled: () => {
      // Always refetch after error or success (same as subscriptions)
      queryClient.invalidateQueries({ queryKey: lifetimeDealKeys.lists() });
      // Invalidate client cost data since lifetime deal update affects client costs
      queryClient.invalidateQueries({ queryKey: clientKeys.costs() });
      // Also invalidate the broader client keys to catch all variations
      queryClient.invalidateQueries({ queryKey: clientKeys.all });
    },
  });
}

// Delete lifetime deal mutation
export function useDeleteLifetimeDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const supabase = createClient();
      
      // Get lifetime deal name for logging
      const { data: lifetimeDeal } = await supabase
        .from('lifetime_deals')
        .select('service_name')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('lifetime_deals')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Log activity
      await logActivity('delete', id, `Deleted lifetime deal: ${lifetimeDeal?.service_name || 'Unknown'}`);
    },
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: lifetimeDealKeys.lists() });

      // Snapshot the previous value
      const previousLifetimeDeals = queryClient.getQueriesData({ queryKey: lifetimeDealKeys.lists() });

      // Optimistically update to the new value
      queryClient.setQueriesData({ queryKey: lifetimeDealKeys.lists() }, (old: LifetimeDeal[] | undefined) => {
        if (!old) return [];
        return old.filter(lifetimeDeal => lifetimeDeal.id !== deletedId);
      });

      // Return context object with the snapshotted value
      return { previousLifetimeDeals };
    },
    onError: (err, deletedId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousLifetimeDeals) {
        context.previousLifetimeDeals.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      
      toast.error('Failed to delete lifetime deal', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    },
    onSuccess: () => {
      toast.success('Lifetime deal deleted successfully');
    },
    onSettled: () => {
      // Always refetch after error or success (same as subscriptions)
      queryClient.invalidateQueries({ queryKey: lifetimeDealKeys.lists() });
      // Invalidate client cost data since lifetime deal deletion affects client costs
      queryClient.invalidateQueries({ queryKey: clientKeys.costs() });
      // Also invalidate the broader client keys to catch all variations
      queryClient.invalidateQueries({ queryKey: clientKeys.all });
    },
  });
}
