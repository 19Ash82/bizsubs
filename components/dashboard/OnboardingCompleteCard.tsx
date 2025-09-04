// Updated 2024-12-19: Created modular OnboardingCompleteCard component for dashboard

import { InfoIcon } from "lucide-react";

export function OnboardingCompleteCard() {
  return (
    <div className="w-full">
      <div className="bg-emerald-50 border border-emerald-200 text-sm p-4 rounded-md text-emerald-800 flex gap-3 items-center dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-200">
        <InfoIcon size="16" strokeWidth={2} />
        <div>
          <p className="font-medium">Onboarding Complete!</p>
          <p>Your profile and workspace are set up. You can now start tracking your business subscriptions.</p>
        </div>
      </div>
    </div>
  );
}
