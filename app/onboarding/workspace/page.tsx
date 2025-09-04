// Updated 2024-12-19: Refactored to use modular components following cursor rules

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CardContent } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import {
  OnboardingLayout,
  OnboardingHeader,
  WorkspaceForm,
  ProgressIndicator,
} from "@/components/onboarding";

interface UserProfile {
  first_name: string;
  last_name: string;
  company_name?: string;
}

export default function WorkspaceSetupPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkProfileSetup = async () => {
      const supabase = createClient();
      
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          router.push("/auth/login");
          return;
        }

        // Check if user has completed profile setup
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("first_name, last_name, company_name")
          .eq("id", user.id)
          .single();

        if (profileError || !profile?.first_name || !profile?.last_name) {
          // Profile not complete, redirect to profile setup
          router.push("/onboarding/profile");
          return;
        }

        setUserProfile(profile);
        
        // If company_name already exists, redirect to dashboard
        if (profile.company_name) {
          router.push("/protected");
        }
      } catch (error) {
        console.error("Error checking profile:", error);
        router.push("/onboarding/profile");
      } finally {
        setIsLoading(false);
      }
    };

    checkProfileSetup();
  }, [router]);

  if (isLoading || !userProfile) {
    return <OnboardingLayout isLoading={true} />;
  }

  return (
    <OnboardingLayout>
      <OnboardingHeader
        icon={Building2}
        title="Create Your Workspace"
        description={`Hello ${userProfile.first_name}! Let's set up your company workspace to organize your business subscriptions.`}
      />
      <CardContent>
        <WorkspaceForm userProfile={userProfile} />
        <div className="mt-6">
          <ProgressIndicator
            currentStep={2}
            totalSteps={2}
            stepLabel="Step 2 of 2"
          />
        </div>
      </CardContent>
    </OnboardingLayout>
  );
}
