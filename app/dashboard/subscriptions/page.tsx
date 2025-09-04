import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SubscriptionsPageClient } from './SubscriptionsPageClient';

export default async function SubscriptionsPage() {
  const supabase = await createClient();

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/auth/login');
  }

  // Get user profile data
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('Error fetching user profile:', profileError);
    redirect('/onboarding/profile');
  }

  // Check if user has completed onboarding
  if (!profile.first_name || !profile.last_name || !profile.company_name) {
    redirect('/onboarding/profile');
  }

  // Get user's team role (check if they're a workspace owner or member)
  const { data: teamMember } = await supabase
    .from('team_members')
    .select('role, status')
    .eq('member_id', user.id)
    .eq('status', 'active')
    .single();

  // Determine user role - they're admin if they own the workspace or no team member record exists
  const userRole = teamMember ? teamMember.role : 'admin';

  return (
    <SubscriptionsPageClient
      profile={profile}
      userRole={userRole as 'admin' | 'member'}
    />
  );
}
