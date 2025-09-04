"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = async () => {
    try {
      setIsLoggingOut(true);
      
      // Try server-side logout first
      const response = await fetch("/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        // If server logout fails, try client-side logout
        const supabase = createClient();
        await supabase.auth.signOut();
      }
      
      // Force a hard redirect to homepage to clear any cached state
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      // Fallback: try client-side logout and redirect anyway
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch (clientError) {
        console.error("Client logout error:", clientError);
      }
      window.location.href = "/";
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Button onClick={logout} disabled={isLoggingOut} variant="outline">
      {isLoggingOut ? "Signing out..." : "Logout"}
    </Button>
  );
}
