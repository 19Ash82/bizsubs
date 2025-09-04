// Updated 2024-12-19: Created modular TrialStatusCard component for dashboard

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface TrialStatusCardProps {
  trialEndsAt?: string;
  subscriptionTier?: string;
}

export function TrialStatusCard({ trialEndsAt, subscriptionTier }: TrialStatusCardProps) {
  // Only show if user is on trial
  if (subscriptionTier !== 'trial' || !trialEndsAt) {
    return null;
  }

  const trialEndDate = new Date(trialEndsAt).toLocaleDateString();

  return (
    <Card className="border-violet-200 bg-violet-50 dark:border-violet-800 dark:bg-violet-900/20">
      <CardHeader>
        <CardTitle className="text-violet-900 dark:text-violet-100">
          🚀 Business Trial Active
        </CardTitle>
        <CardDescription className="text-violet-700 dark:text-violet-300">
          You have access to all Business tier features until {trialEndDate}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-violet-600 dark:text-violet-400">
          ✨ Unlimited subscriptions • Team collaboration • Advanced reports
        </p>
      </CardContent>
    </Card>
  );
}
