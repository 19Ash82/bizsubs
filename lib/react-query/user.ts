// Updated 2024-12-20: User authentication hook for client components
// Provides user profile data and authentication state

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  company_name: string;
  subscription_tier: 'free' | 'pro' | 'enterprise' | 'member';
  currency_preference: string;
  tax_rate: number;
  created_at: string;
  updated_at: string;
}

export interface UserWithProfile {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  error: Error | null;
}

export function useUser(): UserWithProfile {
  const { data, isLoading, error } = useQuery({
    queryKey: ['user', 'profile'],
    queryFn: async () => {
      const supabase = createClient();
      
      // Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { user: null, profile: null };
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        return { user, profile: null };
      }

      return { user, profile };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  return {
    user: data?.user || null,
    profile: data?.profile || null,
    isLoading,
    error: error as Error | null,
  };
}

export function useUserProfile() {
  const { profile, isLoading, error } = useUser();
  return { profile, isLoading, error };
}
