// Updated 2024-12-19: Refactored to use modular dashboard components following cursor rules

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FetchDataSteps } from "@/components/tutorial/fetch-data-steps";
import {
  WelcomeHeader,
  ProfileCard,
  WorkspaceCard,
  TrialStatusCard,
  OnboardingCompleteCard,
} from "@/components/dashboard";

export default async function ProtectedPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  // Get user profile information
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("users")
    .select("first_name, last_name, company_name, subscription_tier, trial_ends_at")
    .eq("id", user?.id)
    .single();

  return (
    <div className="flex-1 w-full flex flex-col gap-8">
      <WelcomeHeader firstName={profile?.first_name} />

      {/* Profile & Workspace Info */}
      <div className="grid gap-6 md:grid-cols-2">
        <ProfileCard
          firstName={profile?.first_name}
          lastName={profile?.last_name}
          email={user?.email}
        />
        <WorkspaceCard
          companyName={profile?.company_name}
          subscriptionTier={profile?.subscription_tier}
        />
      </div>

      <TrialStatusCard
        trialEndsAt={profile?.trial_ends_at}
        subscriptionTier={profile?.subscription_tier}
      />

      <OnboardingCompleteCard />

      {/* Next Steps */}
      <div>
        <h2 className="font-bold text-2xl mb-4">Next steps</h2>
        <FetchDataSteps />
      </div>
    </div>
  );
}
