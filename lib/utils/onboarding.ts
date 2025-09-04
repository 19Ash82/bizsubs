import { createClient } from "@/lib/supabase/client";
import { createClient as createServerClient } from "@/lib/supabase/server";

export type OnboardingStatus = {
  isComplete: boolean;
  needsProfile: boolean;
  needsWorkspace: boolean;
  profile?: {
    first_name: string;
    last_name: string;
    company_name?: string;
  };
};

/**
 * Check the onboarding status for the current user (client-side)
 */
export async function checkOnboardingStatus(): Promise<OnboardingStatus> {
  const supabase = createClient();
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return {
        isComplete: false,
        needsProfile: true,
        needsWorkspace: true,
      };
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("first_name, last_name, company_name")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return {
        isComplete: false,
        needsProfile: true,
        needsWorkspace: true,
      };
    }

    const needsProfile = !profile.first_name || !profile.last_name;
    const needsWorkspace = !profile.company_name;
    const isComplete = !needsProfile && !needsWorkspace;

    return {
      isComplete,
      needsProfile,
      needsWorkspace,
      profile,
    };
  } catch (error) {
    console.error("Error checking onboarding status:", error);
    return {
      isComplete: false,
      needsProfile: true,
      needsWorkspace: true,
    };
  }
}

/**
 * Check the onboarding status for the current user (server-side)
 */
export async function checkOnboardingStatusServer(): Promise<OnboardingStatus> {
  const supabase = await createServerClient();
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return {
        isComplete: false,
        needsProfile: true,
        needsWorkspace: true,
      };
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("first_name, last_name, company_name")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return {
        isComplete: false,
        needsProfile: true,
        needsWorkspace: true,
      };
    }

    const needsProfile = !profile.first_name || !profile.last_name;
    const needsWorkspace = !profile.company_name;
    const isComplete = !needsProfile && !needsWorkspace;

    return {
      isComplete,
      needsProfile,
      needsWorkspace,
      profile,
    };
  } catch (error) {
    console.error("Error checking onboarding status:", error);
    return {
      isComplete: false,
      needsProfile: true,
      needsWorkspace: true,
    };
  }
}

/**
 * Get the appropriate redirect URL based on onboarding status
 */
export function getOnboardingRedirect(status: OnboardingStatus): string {
  if (status.needsProfile) {
    return "/onboarding/profile";
  } else if (status.needsWorkspace) {
    return "/onboarding/workspace";
  } else {
    return "/protected";
  }
}
