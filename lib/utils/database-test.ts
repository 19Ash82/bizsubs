// Updated 2024-12-19: Database connection and permissions test utility

import { createClient } from "@/lib/supabase/client";

export async function testDatabaseConnection() {
  try {
    const supabase = createClient();
    
    // Test 1: Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log("Auth test:", { hasUser: !!user, authError });
    
    if (!user) {
      return { success: false, error: "No authenticated user" };
    }

    // Test 2: Check if users table exists and is accessible
    const { data: tableTest, error: tableError } = await supabase
      .from("users")
      .select("id")
      .limit(1);
    
    console.log("Table access test:", { tableError, canAccess: !tableError });

    // Test 3: Try a simple select to verify RLS policies
    const { data: userProfile, error: selectError } = await supabase
      .from("users")
      .select("id, email, first_name")
      .eq("id", user.id)
      .single();
    
    console.log("User profile test:", { 
      hasProfile: !!userProfile, 
      selectError,
      profileData: userProfile ? {
        hasId: !!userProfile.id,
        hasEmail: !!userProfile.email,
        hasFirstName: !!userProfile.first_name
      } : null
    });

    return { 
      success: true, 
      user: { id: user.id, email: user.email },
      hasExistingProfile: !!userProfile,
      profile: userProfile
    };
  } catch (error) {
    console.error("Database test error:", error);
    return { success: false, error };
  }
}
