// Updated 2024-12-19: Enhanced layout with dashboard sidebar navigation

import { ThemeSwitcher } from "@/components/theme-switcher";
import { DashboardSidebar, UserProfileDropdown } from "@/components/dashboard";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check authentication and onboarding status
  const supabase = await createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  // Redirect to login if not authenticated
  if (error || !user) {
    redirect("/auth/login");
  }

  // Check if user has completed onboarding
  let profile = null;
  try {
    const { data: profileData, error: profileError } = await supabase
      .from("users")
      .select("first_name, last_name, company_name, subscription_tier")
      .eq("id", user.id)
      .single();
    
    if (profileError) {
      console.error("Profile fetch error:", profileError);
      // If we can't fetch the profile, redirect to login
      redirect("/auth/login");
    }
    
    profile = profileData;
  } catch (error) {
    console.error("Profile fetch error:", error);
    redirect("/auth/login");
  }
  
  // Redirect to appropriate onboarding step if profile is incomplete
  if (!profile || !profile.first_name || !profile.last_name) {
    redirect("/onboarding/profile");
  } else if (!profile.company_name) {
    redirect("/onboarding/workspace");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Sidebar */}
        <DashboardSidebar userTier={profile?.subscription_tier} />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Header */}
          <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold text-gray-900">
                  BizSubs Dashboard
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <ThemeSwitcher />
                <UserProfileDropdown />
              </div>
            </div>
          </header>
          
          {/* Page Content */}
          <main className="flex-1 overflow-y-auto bg-gray-50">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
