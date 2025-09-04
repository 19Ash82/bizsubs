import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  // Redirect to login if not authenticated
  if (error || !user) {
    redirect("/auth/login");
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </main>
  );
}
