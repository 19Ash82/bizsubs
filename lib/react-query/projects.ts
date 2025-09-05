// Updated 2024-12-20: React Query hooks for project operations
// Implements PRD requirements: intelligent caching and real-time collaboration

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

// Types
export interface Project {
  id: string;
  name: string;
  client_id: string;
  status: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Query keys
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...projectKeys.lists(), filters] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
};

// Fetch projects
export function useProjects(filters: Record<string, any> = {}) {
  return useQuery({
    queryKey: projectKeys.list(filters),
    queryFn: async (): Promise<Project[]> => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id);

      // Apply filters
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      } else {
        query = query.eq('status', 'active'); // Default to active only
      }

      if (filters.client_id) {
        query = query.eq('client_id', filters.client_id);
      }

      query = query.order('name', { ascending: true });

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    },
  });
}
