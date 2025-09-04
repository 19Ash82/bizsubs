// Updated 2024-12-19: Refactored to use modular components following cursor rules

import { CardContent } from "@/components/ui/card";
import { User } from "lucide-react";
import {
  OnboardingLayout,
  OnboardingHeader,
  ProfileForm,
  ProgressIndicator,
} from "@/components/onboarding";

export default function ProfileSetupPage() {
  return (
    <OnboardingLayout>
      <OnboardingHeader
        icon={User}
        title="Welcome to BizSubs!"
        description="Let's start by setting up your profile. This helps us personalize your experience."
      />
      <CardContent>
        <ProfileForm />
        <div className="mt-6">
          <ProgressIndicator
            currentStep={1}
            totalSteps={2}
            stepLabel="Step 1 of 2"
          />
        </div>
      </CardContent>
    </OnboardingLayout>
  );
}
