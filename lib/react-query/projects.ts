// Updated 2024-12-20: React Query hooks for projects operations with optimistic updates
// Implements PRD requirements: project management, cost allocation, color coding

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { subscriptionKeys } from './subscriptions';
import { lifetimeDealKeys } from './lifetime-deals';
import { clientKeys } from './clients';
import { invalidateAfterProjectChange } from './invalidation-utils';

// Types
export interface Project {
  id: string;
  user_id: string;
  client_id: string | null;
  client_name?: string;
  client_color?: string;
  name: string;
  description?: string;
  color_hex: string;
  status: 'active' | 'inactive' | 'completed';
  created_at: string;
  updated_at: string;
  // Calculated fields for cost tracking
  monthly_cost?: number;
  annual_cost?: number;
  subscription_count?: number;
  lifetime_deal_count?: number;
}

export interface CreateProjectData {
  name: string;
  description?: string;
  client_id?: string;
  color_hex?: string;
  status?: 'active' | 'inactive' | 'completed';
}

export interface UpdateProjectData extends CreateProjectData {
  id: string;
}

export interface ProjectCostBreakdown {
  project_id: string;
  project_name: string;
  project_color: string;
  service_name: string;
  service_type: 'subscription' | 'lifetime_deal';
  cost: number;
  billing_cycle: string;
  status: string;
  category: string;
  monthly_equivalent: number;
  annual_equivalent: number;
}

// Query keys factory
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...projectKeys.lists(), filters] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
  costs: () => [...projectKeys.all, 'costs'] as const,
  cost: (id: string) => [...projectKeys.costs(), id] as const,
  breakdown: (id: string) => [...projectKeys.all, 'breakdown', id] as const,
};

// Activity logging helper
async function logActivity(
  action: 'create' | 'update' | 'delete',
  resourceId: string,
  description: string
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    await supabase.from('activity_logs').insert({
      user_id: user.id,
      user_email: user.email || '',
      action_type: action,
      resource_type: 'project',
      resource_id: resourceId,
      description,
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

// Fetch projects with cost calculations
export function useProjectsWithCosts(filters: Record<string, any> = {}) {
  return useQuery({
    queryKey: projectKeys.list(filters),
    queryFn: async (): Promise<Project[]> => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('User not authenticated');

      // Use the database function for cost calculations
      const { data, error } = await supabase
        .rpc('get_projects_with_costs', { p_user_id: user.id });

      if (error) {
        console.error('Error fetching projects with costs:', error);
        throw error;
      }
      
      return data || [];
    },
  });
}

// Fetch project cost breakdown
export function useProjectCostBreakdown(projectId: string) {
  return useQuery({
    queryKey: projectKeys.breakdown(projectId),
    queryFn: async (): Promise<ProjectCostBreakdown[]> => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .rpc('get_project_cost_breakdown', { 
          p_user_id: user.id, 
          p_project_id: projectId 
        });

      if (error) {
        console.error('Error fetching project cost breakdown:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!projectId,
  });
}

// Create project mutation
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProjectData): Promise<Project> => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('User not authenticated');

      const projectData = {
        user_id: user.id,
        ...data,
        color_hex: data.color_hex || '#3B82F6', // Default blue color
        status: data.status || 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: newProject, error } = await supabase
        .from('projects')
        .insert(projectData)
        .select(`
          *,
          clients!projects_client_id_fkey (
            name,
            color_hex
          )
        `)
        .single();

      if (error) throw error;

      // Log activity
      await logActivity('create', newProject.id, `Created project: ${data.name}`);

      // Transform the response to match our interface
      const transformedProject: Project = {
        ...newProject,
        client_name: newProject.clients?.name,
        client_color: newProject.clients?.color_hex,
      };

      return transformedProject;
    },
    onMutate: async (newProject) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: projectKeys.lists() });

      // Snapshot the previous value
      const previousProjects = queryClient.getQueriesData({ queryKey: projectKeys.lists() });

      // Optimistically update to the new value
      queryClient.setQueriesData({ queryKey: projectKeys.lists() }, (old: Project[] | undefined) => {
        if (!old) return [];
        
        const optimisticProject: Project = {
          id: `temp-${Date.now()}`, // Temporary ID
          user_id: 'temp-user',
          client_id: newProject.client_id || null,
          ...newProject,
          color_hex: newProject.color_hex || '#3B82F6',
          status: newProject.status || 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          monthly_cost: 0,
          annual_cost: 0,
          subscription_count: 0,
          lifetime_deal_count: 0,
        };

        return [optimisticProject, ...old];
      });

      // Return context object with the snapshotted value
      return { previousProjects };
    },
    onError: (err, newProject, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousProjects) {
        context.previousProjects.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      
      toast.error('Failed to create project', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    },
    onSuccess: (data) => {
      toast.success('Project created successfully');
    },
    onSettled: () => {
      // Use smart caching system for comprehensive updates
      invalidateAfterProjectChange(queryClient);
    },
  });
}

// Update project mutation
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateProjectData): Promise<Project> => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('User not authenticated');

      const updateData = {
        ...data,
        updated_at: new Date().toISOString(),
      };

      const { data: updatedProject, error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', data.id)
        .eq('user_id', user.id)
        .select(`
          *,
          clients!projects_client_id_fkey (
            name,
            color_hex
          )
        `)
        .single();

      if (error) throw error;

      // Log activity
      await logActivity('update', updatedProject.id, `Updated project: ${data.name}`);

      // Transform the response to match our interface
      const transformedProject: Project = {
        ...updatedProject,
        client_name: updatedProject.clients?.name,
        client_color: updatedProject.clients?.color_hex,
      };

      return transformedProject;
    },
    onMutate: async (updatedProject) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: projectKeys.lists() });

      // Snapshot the previous value
      const previousProjects = queryClient.getQueriesData({ queryKey: projectKeys.lists() });

      // Optimistically update to the new value
      queryClient.setQueriesData({ queryKey: projectKeys.lists() }, (old: Project[] | undefined) => {
        if (!old) return [];
        
        return old.map(project => 
          project.id === updatedProject.id
            ? { ...project, ...updatedProject, updated_at: new Date().toISOString() }
            : project
        );
      });

      // Return context object with the snapshotted value
      return { previousProjects };
    },
    onError: (err, updatedProject, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousProjects) {
        context.previousProjects.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      
      toast.error('Failed to update project', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    },
    onSuccess: (data) => {
      toast.success('Project updated successfully');
    },
    onSettled: () => {
      // Use smart caching system for comprehensive updates
      invalidateAfterProjectChange(queryClient);
    },
  });
}

// Delete project mutation
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string): Promise<void> => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('User not authenticated');

      // Get project name for logging
      const { data: project } = await supabase
        .from('projects')
        .select('name')
        .eq('id', projectId)
        .eq('user_id', user.id)
        .single();

      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Log activity
      await logActivity('delete', projectId, `Deleted project: ${project?.name || 'Unknown'}`);
    },
    onMutate: async (projectId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: projectKeys.lists() });

      // Snapshot the previous value
      const previousProjects = queryClient.getQueriesData({ queryKey: projectKeys.lists() });

      // Optimistically update to the new value
      queryClient.setQueriesData({ queryKey: projectKeys.lists() }, (old: Project[] | undefined) => {
        if (!old) return [];
        return old.filter(project => project.id !== projectId);
      });

      // Return context object with the snapshotted value
      return { previousProjects };
    },
    onError: (err, projectId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousProjects) {
        context.previousProjects.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      
      toast.error('Failed to delete project', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    },
    onSuccess: () => {
      toast.success('Project deleted successfully');
    },
    onSettled: () => {
      // Use smart caching system for comprehensive updates
      invalidateAfterProjectChange(queryClient);
    },
  });
}