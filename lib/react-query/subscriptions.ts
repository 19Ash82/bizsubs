// Updated 2024-12-20: React Query hooks for subscription operations with optimistic updates
// Implements PRD requirements: immediate UI feedback, team collaboration, audit trails

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

// Types
export interface Subscription {
  id: string;
  user_id: string;
  service_name: string;
  cost: number;
  billing_cycle: 'weekly' | 'monthly' | 'quarterly' | 'annual';
  next_billing_date: string;
  category: string;
  status: 'active' | 'cancelled' | 'paused';
  currency: string;
  client_id?: string;
  project_id?: string;
  business_expense: boolean;
  tax_deductible: boolean;
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

export interface CreateSubscriptionData {
  service_name: string;
  cost: number;
  billing_cycle: 'weekly' | 'monthly' | 'quarterly' | 'annual';
  next_billing_date: string;
  category: string;
  status: 'active' | 'cancelled' | 'paused';
  currency: string;
  client_id?: string;
  project_id?: string;
  business_expense: boolean;
  tax_deductible: boolean;
  notes?: string;
  tax_rate: number;
}

export interface UpdateSubscriptionData extends CreateSubscriptionData {
  id: string;
}

// Query keys
export const subscriptionKeys = {
  all: ['subscriptions'] as const,
  lists: () => [...subscriptionKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...subscriptionKeys.lists(), filters] as const,
  details: () => [...subscriptionKeys.all, 'detail'] as const,
  detail: (id: string) => [...subscriptionKeys.details(), id] as const,
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
      resource_type: 'subscription',
      resource_id: resourceId,
      description,
    });
  }
}

// Fetch subscriptions
export function useSubscriptions(filters: Record<string, any> = {}) {
  return useQuery({
    queryKey: subscriptionKeys.list(filters),
    queryFn: async (): Promise<Subscription[]> => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('subscriptions')
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

      query = query.order('next_billing_date', { ascending: true });

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    },
  });
}

// Create subscription mutation
export function useCreateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSubscriptionData): Promise<Subscription> => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('User not authenticated');

      const subscriptionData = {
        user_id: user.id,
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: newSubscription, error } = await supabase
        .from('subscriptions')
        .insert(subscriptionData)
        .select(`
          *,
          clients (name, color_hex),
          projects (name)
        `)
        .single();

      if (error) throw error;

      // Log activity
      await logActivity('create', newSubscription.id, `Created subscription: ${data.service_name}`);

      return newSubscription;
    },
    onMutate: async (newSubscription) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: subscriptionKeys.lists() });

      // Snapshot the previous value
      const previousSubscriptions = queryClient.getQueriesData({ queryKey: subscriptionKeys.lists() });

      // Optimistically update to the new value
      queryClient.setQueriesData({ queryKey: subscriptionKeys.lists() }, (old: Subscription[] | undefined) => {
        if (!old) return [];
        
        const optimisticSubscription: Subscription = {
          id: `temp-${Date.now()}`, // Temporary ID
          user_id: 'temp-user',
          ...newSubscription,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        return [optimisticSubscription, ...old];
      });

      // Return context object with the snapshotted value
      return { previousSubscriptions };
    },
    onError: (err, newSubscription, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousSubscriptions) {
        context.previousSubscriptions.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      
      toast.error('Failed to create subscription', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    },
    onSuccess: (data) => {
      toast.success('Subscription created successfully');
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() });
    },
  });
}

// Update subscription mutation
export function useUpdateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateSubscriptionData): Promise<Subscription> => {
      const supabase = createClient();

      const { id, ...updateData } = data;
      const finalUpdateData = {
        ...updateData,
        updated_at: new Date().toISOString(),
      };

      const { data: updatedSubscription, error } = await supabase
        .from('subscriptions')
        .update(finalUpdateData)
        .eq('id', id)
        .select(`
          *,
          clients (name, color_hex),
          projects (name)
        `)
        .single();

      if (error) throw error;

      // Log activity
      await logActivity('update', id, `Updated subscription: ${data.service_name}`);

      return updatedSubscription;
    },
    onMutate: async (updatedSubscription) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: subscriptionKeys.lists() });

      // Snapshot the previous value
      const previousSubscriptions = queryClient.getQueriesData({ queryKey: subscriptionKeys.lists() });

      // Optimistically update to the new value
      queryClient.setQueriesData({ queryKey: subscriptionKeys.lists() }, (old: Subscription[] | undefined) => {
        if (!old) return [];
        
        return old.map(subscription => 
          subscription.id === updatedSubscription.id
            ? { ...subscription, ...updatedSubscription, updated_at: new Date().toISOString() }
            : subscription
        );
      });

      // Return context object with the snapshotted value
      return { previousSubscriptions };
    },
    onError: (err, updatedSubscription, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousSubscriptions) {
        context.previousSubscriptions.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      
      toast.error('Failed to update subscription', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    },
    onSuccess: (data) => {
      toast.success('Subscription updated successfully');
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() });
    },
  });
}

// Delete subscription mutation
export function useDeleteSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const supabase = createClient();
      
      // Get subscription name for logging
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('service_name')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Log activity
      await logActivity('delete', id, `Deleted subscription: ${subscription?.service_name || 'Unknown'}`);
    },
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: subscriptionKeys.lists() });

      // Snapshot the previous value
      const previousSubscriptions = queryClient.getQueriesData({ queryKey: subscriptionKeys.lists() });

      // Optimistically update to the new value
      queryClient.setQueriesData({ queryKey: subscriptionKeys.lists() }, (old: Subscription[] | undefined) => {
        if (!old) return [];
        return old.filter(subscription => subscription.id !== deletedId);
      });

      // Return context object with the snapshotted value
      return { previousSubscriptions };
    },
    onError: (err, deletedId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousSubscriptions) {
        context.previousSubscriptions.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      
      toast.error('Failed to delete subscription', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    },
    onSuccess: () => {
      toast.success('Subscription deleted successfully');
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() });
    },
  });
}
