// User preferences React Query hooks
// Updated 2024-12-20: Added hook for loading user date format preferences

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export interface UserPreferences {
  id?: string;
  user_id: string;
  date_format_preference: 'US' | 'EU' | 'ISO';
  visible_subscription_columns?: string[];
  visible_ltd_columns?: string[];
  default_filters?: Record<string, any>;
  dashboard_layout?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export function useUserPreferences() {
  return useQuery({
    queryKey: ['user-preferences'],
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
        throw error;
      }

      // Return default preferences if none exist
      if (!data) {
        return {
          user_id: user.id,
          date_format_preference: 'US' as const,
        } as UserPreferences;
      }

      return data as UserPreferences;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateUserPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preferences: Partial<UserPreferences> & { user_id: string }) => {
      const supabase = createClient();
      
      console.log('Attempting to update preferences:', preferences);
      
      // First try to update existing record
      let { data, error } = await supabase
        .from('user_preferences')
        .update(preferences)
        .eq('user_id', preferences.user_id)
        .select()
        .single();

      // If no record exists, insert a new one
      if (error && error.code === 'PGRST116') {
        console.log('No existing record found, inserting new one...');
        const insertResult = await supabase
          .from('user_preferences')
          .insert(preferences)
          .select()
          .single();
        
        data = insertResult.data;
        error = insertResult.error;
      }

      if (error) {
        console.error('Supabase error:', error);
        console.error('Full error object:', JSON.stringify(error, null, 2));
        console.error('Error properties:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      console.log('Successfully updated preferences:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
    },
    onError: (error) => {
      console.error('Mutation error:', error);
    },
  });
}
