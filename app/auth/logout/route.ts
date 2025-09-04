// Updated 2024-12-19: Created server-side logout route for better reliability

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const supabase = await createClient();
    
    // Sign out the user
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error("Server logout error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Return success response
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Server logout error:", error);
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}


