import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      // Check if user has completed onboarding
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Check if user profile exists and is complete
        const { data: profile } = await supabase
          .from("users")
          .select("first_name, last_name, company_name")
          .eq("id", user.id)
          .single();
        
        // If profile doesn't exist or is incomplete, redirect to onboarding
        if (!profile || !profile.first_name || !profile.last_name) {
          redirect("/onboarding/profile");
        } else if (!profile.company_name) {
          redirect("/onboarding/workspace");
        } else {
          // Profile complete, redirect to dashboard or specified URL
          redirect(next === "/" ? "/dashboard" : next);
        }
      } else {
        redirect(next);
      }
    } else {
      // redirect the user to an error page with some instructions
      redirect(`/auth/error?error=${error?.message}`);
    }
  }

  // redirect the user to an error page with some instructions
  redirect(`/auth/error?error=No token hash or type`);
}
