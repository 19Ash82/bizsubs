// Updated 2024-12-19: Created modular OnboardingLayout component

import { Card, CardContent } from "@/components/ui/card";

interface OnboardingLayoutProps {
  children: React.ReactNode;
  isLoading?: boolean;
}

export function OnboardingLayout({ children, isLoading }: OnboardingLayoutProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {children}
    </Card>
  );
}
