// Updated 2024-12-20: React Query hooks for client operations
// Implements PRD requirements: intelligent caching and real-time collaboration

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

// Types
export interface Client {
  id: string;
  name: string;
  color_hex: string;
  status: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Query keys
export const clientKeys = {
  all: ['clients'] as const,
  lists: () => [...clientKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...clientKeys.lists(), filters] as const,
  details: () => [...clientKeys.all, 'detail'] as const,
  detail: (id: string) => [...clientKeys.details(), id] as const,
};

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
      } else {
        query = query.eq('status', 'active'); // Default to active only
      }

      query = query.order('name', { ascending: true });

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    },
  });
}
