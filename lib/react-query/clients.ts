// Updated 2024-12-20: React Query hooks for clients operations with optimistic updates
// Implements PRD requirements: client cost tracking, color coding, export functionality

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { subscriptionKeys } from './subscriptions';
import { lifetimeDealKeys } from './lifetime-deals';
import { invalidateAfterClientChange } from './invalidation-utils';

// Types
export interface Client {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  color_hex: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  // Calculated fields for cost tracking
  monthly_cost?: number;
  annual_cost?: number;
  subscription_count?: number;
  lifetime_deal_count?: number;
}

export interface CreateClientData {
  name: string;
  email?: string;
  color_hex: string;
  status: 'active' | 'inactive';
}

export interface UpdateClientData extends CreateClientData {
  id: string;
}

// Query keys
export const clientKeys = {
  all: ['clients'] as const,
  lists: () => [...clientKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...clientKeys.lists(), filters] as const,
  details: () => [...clientKeys.all, 'detail'] as const,
  detail: (id: string) => [...clientKeys.details(), id] as const,
  costs: () => [...clientKeys.all, 'costs'] as const,
  reports: () => [...clientKeys.all, 'reports'] as const,
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
      resource_type: 'client',
      resource_id: resourceId,
      description,
    });
  }
}

// Fetch clients
export function useClients(filters: Record<string, any> = {}) {
  return useQuery({
    queryKey: clientKeys.list(filters),
    queryFn: async (): Promise<Client[]> => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id);

      // Apply filters
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      query = query.order('name', { ascending: true });

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    },
  });
}

// Fetch clients with cost data
export function useClientsWithCosts(filters: Record<string, any> = {}) {
  return useQuery({
    queryKey: [...clientKeys.costs(), filters],
    staleTime: 0, // Always refetch when invalidated
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnMount: true, // Always refetch when component mounts
    queryFn: async (): Promise<Client[]> => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('User not authenticated');

      // Get clients with cost calculations
      const { data, error } = await supabase.rpc('get_clients_with_costs', {
        p_user_id: user.id
      });

      if (error) {
        console.warn('RPC function not available, falling back to basic client query');
        
        // Fallback to basic client query
        let query = supabase
          .from('clients')
          .select('*')
          .eq('user_id', user.id);

        if (filters.status && filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }

        query = query.order('name', { ascending: true });

        const { data: fallbackData, error: fallbackError } = await query;
        if (fallbackError) throw fallbackError;
        
        return fallbackData || [];
      }
      
      return data || [];
    },
  });
}

// Create client mutation
export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateClientData): Promise<Client> => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('User not authenticated');

      const clientData = {
        user_id: user.id,
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: newClient, error } = await supabase
        .from('clients')
        .insert(clientData)
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await logActivity('create', newClient.id, `Created client: ${data.name}`);

      return newClient;
    },
    onMutate: async (newClient) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: clientKeys.lists() });

      // Snapshot the previous value
      const previousClients = queryClient.getQueriesData({ queryKey: clientKeys.lists() });

      // Optimistically update to the new value
      queryClient.setQueriesData({ queryKey: clientKeys.lists() }, (old: Client[] | undefined) => {
        if (!old) return [];
        
        const optimisticClient: Client = {
          id: `temp-${Date.now()}`, // Temporary ID
          user_id: 'temp-user',
          ...newClient,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        return [optimisticClient, ...old];
      });

      // Return context object with the snapshotted value
      return { previousClients };
    },
    onError: (err, newClient, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousClients) {
        context.previousClients.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      
      toast.error('Failed to create client', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    },
    onSuccess: (data) => {
      toast.success('Client created successfully');
    },
    onSettled: () => {
      // Use comprehensive invalidation strategy for client changes
      invalidateAfterClientChange(queryClient);
    },
  });
}

// Update client mutation
export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateClientData): Promise<Client> => {
      const supabase = createClient();

      const { id, ...updateData } = data;
      const finalUpdateData = {
        ...updateData,
        updated_at: new Date().toISOString(),
      };

      const { data: updatedClient, error } = await supabase
        .from('clients')
        .update(finalUpdateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await logActivity('update', id, `Updated client: ${data.name}`);

      return updatedClient;
    },
    onMutate: async (updatedClient) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: clientKeys.lists() });

      // Snapshot the previous value
      const previousClients = queryClient.getQueriesData({ queryKey: clientKeys.lists() });

      // Optimistically update to the new value
      queryClient.setQueriesData({ queryKey: clientKeys.lists() }, (old: Client[] | undefined) => {
        if (!old) return [];
        
        return old.map(client => 
          client.id === updatedClient.id
            ? { ...client, ...updatedClient, updated_at: new Date().toISOString() }
            : client
        );
      });

      // Return context object with the snapshotted value
      return { previousClients };
    },
    onError: (err, updatedClient, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousClients) {
        context.previousClients.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      
      toast.error('Failed to update client', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    },
    onSuccess: (data) => {
      toast.success('Client updated successfully');
    },
    onSettled: () => {
      // Use comprehensive invalidation strategy for client changes
      invalidateAfterClientChange(queryClient);
    },
  });
}

// Delete client mutation
export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const supabase = createClient();
      
      // Get client name for logging
      const { data: client } = await supabase
        .from('clients')
        .select('name')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Log activity
      await logActivity('delete', id, `Deleted client: ${client?.name || 'Unknown'}`);
    },
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: clientKeys.lists() });

      // Snapshot the previous value
      const previousClients = queryClient.getQueriesData({ queryKey: clientKeys.lists() });

      // Optimistically update to the new value
      queryClient.setQueriesData({ queryKey: clientKeys.lists() }, (old: Client[] | undefined) => {
        if (!old) return [];
        return old.filter(client => client.id !== deletedId);
      });

      // Return context object with the snapshotted value
      return { previousClients };
    },
    onError: (err, deletedId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousClients) {
        context.previousClients.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      
      toast.error('Failed to delete client', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    },
    onSuccess: () => {
      toast.success('Client deleted successfully');
    },
    onSettled: () => {
      // Use comprehensive invalidation strategy for client changes
      invalidateAfterClientChange(queryClient);
    },
  });
}

// Export client data for reports
export function useExportClients() {
  return useMutation({
    mutationFn: async (format: 'csv' | 'json' = 'csv'): Promise<string> => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('User not authenticated');

      // Get clients with cost data
      const { data: clients, error } = await supabase
        .from('clients')
        .select(`
          *,
          subscriptions (cost, billing_cycle, status),
          lifetime_deals (original_cost, status)
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      if (format === 'csv') {
        // Generate CSV
        const headers = ['Name', 'Email', 'Status', 'Monthly Cost', 'Annual Cost', 'Subscription Count', 'Lifetime Deal Count', 'Created Date'];
        const rows = clients.map(client => {
          const monthlyTotal = client.subscriptions?.reduce((sum: number, sub: any) => {
            if (sub.status !== 'active') return sum;
            const multiplier = sub.billing_cycle === 'weekly' ? 4.33 : 
                              sub.billing_cycle === 'monthly' ? 1 : 
                              sub.billing_cycle === 'quarterly' ? 0.33 : 
                              sub.billing_cycle === 'annual' ? 0.083 : 1;
            return sum + (sub.cost * multiplier);
          }, 0) || 0;

          const annualTotal = monthlyTotal * 12;
          const subscriptionCount = client.subscriptions?.filter((sub: any) => sub.status === 'active').length || 0;
          const lifetimeDealCount = client.lifetime_deals?.filter((ltd: any) => ltd.status === 'active').length || 0;

          return [
            client.name,
            client.email || '',
            client.status,
            monthlyTotal.toFixed(2),
            annualTotal.toFixed(2),
            subscriptionCount.toString(),
            lifetimeDealCount.toString(),
            new Date(client.created_at).toLocaleDateString()
          ];
        });

        const csvContent = [headers, ...rows]
          .map(row => row.map(cell => `"${cell}"`).join(','))
          .join('\n');

        return csvContent;
      } else {
        // Return JSON
        return JSON.stringify(clients, null, 2);
      }
    },
    onSuccess: (data, format) => {
      // Create and download file
      const blob = new Blob([data], { type: format === 'csv' ? 'text/csv' : 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clients_report_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`Client report exported as ${format.toUpperCase()}`);
    },
    onError: (err) => {
      toast.error('Failed to export client report', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    },
  });
}