// Updated 2024-12-19: Created modular WorkspaceForm component

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight } from "lucide-react";

interface WorkspaceFormProps {
  userProfile?: {
    first_name: string;
    last_name: string;
  };
  onSuccess?: () => void;
  className?: string;
}

export function WorkspaceForm({ userProfile, onSuccess, className }: WorkspaceFormProps) {
  const [companyName, setCompanyName] = useState("");
  const [taxRate, setTaxRate] = useState(30.0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const validateForm = (): boolean => {
    if (!companyName.trim()) {
      setError("Company name is required");
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

      // Update user profile with company name and tax rate
      const { error: profileError } = await supabase
        .from("users")
        .update({
          company_name: companyName.trim(),
          tax_rate: taxRate,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (profileError) {
        throw profileError;
      }

      // Log the workspace creation activity
      const { error: activityError } = await supabase
        .from("activity_logs")
        .insert({
          user_id: user.id,
          user_email: user.email,
          action_type: "create",
          resource_type: "workspace",
          description: `Created workspace: ${companyName.trim()}`,
          timestamp: new Date().toISOString(),
        });

      if (activityError) {
        console.error("Activity logging error:", activityError);
        // Don't fail the whole process if activity logging fails
      }

      // Call success callback or redirect
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard");
      }
    } catch (error: any) {
      console.error("Workspace setup error:", error);
      setError(error.message || "An error occurred while setting up your workspace");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={className}>
      {userProfile && (
        <div className="mb-6 text-center">
          <p className="text-muted-foreground">
            Hello {userProfile.first_name}! Let's set up your company workspace to organize your business subscriptions.
          </p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="companyName">Company Name *</Label>
          <Input
            id="companyName"
            type="text"
            placeholder="Enter your company name"
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            disabled={isLoading}
          />
          <p className="text-sm text-muted-foreground">
            This will be your workspace name and can be changed later in settings.
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="taxRate">Business Tax Rate (%) *</Label>
          <Input
            id="taxRate"
            type="number"
            step="0.1"
            min="0"
            max="100"
            placeholder="30.0"
            required
            value={taxRate}
            onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
            disabled={isLoading}
          />
          <p className="text-sm text-muted-foreground">
            Your default tax rate for business expenses. This will be used as the default for new subscriptions and can be changed per subscription.
          </p>
        </div>

        <TrialBenefitsCard />

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            "Setting up workspace..."
          ) : (
            <>
              Complete Setup
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}

// Separate component for trial benefits display
function TrialBenefitsCard() {
  return (
    <div className="rounded-lg bg-violet-50 p-4 dark:bg-violet-900/20">
      <h4 className="font-medium text-violet-900 dark:text-violet-100">
        🎉 Your 7-Day Business Trial Starts Now!
      </h4>
      <p className="mt-1 text-sm text-violet-700 dark:text-violet-300">
        You'll have access to all Business tier features including unlimited subscriptions, 
        client organization, and team collaboration.
      </p>
    </div>
  );
}
