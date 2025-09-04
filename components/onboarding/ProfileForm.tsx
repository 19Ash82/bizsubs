// Updated 2024-12-19: Created modular ProfileForm component

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight } from "lucide-react";

interface ProfileFormProps {
  onSuccess?: () => void;
  className?: string;
}

interface ProfileFormData {
  firstName: string;
  lastName: string;
}

export function ProfileForm({ onSuccess, className }: ProfileFormProps) {
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: "",
    lastName: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError("Both first name and last name are required");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("User not authenticated");
      }

      // Create or update user profile
      const { error: profileError } = await supabase
        .from("users")
        .upsert({
          id: user.id,
          email: user.email,
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          subscription_tier: "trial", // New users get 7-day trial
          trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          currency_preference: "USD",
          financial_year_end: "12-31",
          tax_rate: 30.0,
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        throw profileError;
      }

      // Call success callback or redirect
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/onboarding/workspace");
      }
    } catch (error: any) {
      console.error("Profile setup error:", error);
      setError(error.message || "An error occurred while setting up your profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className || ""}`}>
      <div className="grid gap-2">
        <Label htmlFor="firstName">First Name *</Label>
        <Input
          id="firstName"
          type="text"
          placeholder="Enter your first name"
          required
          value={formData.firstName}
          onChange={(e) => handleInputChange("firstName", e.target.value)}
          disabled={isLoading}
        />
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="lastName">Last Name *</Label>
        <Input
          id="lastName"
          type="text"
          placeholder="Enter your last name"
          required
          value={formData.lastName}
          onChange={(e) => handleInputChange("lastName", e.target.value)}
          disabled={isLoading}
        />
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          "Setting up profile..."
        ) : (
          <>
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  );
}
