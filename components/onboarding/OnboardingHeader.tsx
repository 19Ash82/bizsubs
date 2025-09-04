// Updated 2024-12-19: Created modular OnboardingHeader component

import { LucideIcon } from "lucide-react";
import {
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface OnboardingHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function OnboardingHeader({ 
  icon: Icon, 
  title, 
  description 
}: OnboardingHeaderProps) {
  return (
    <CardHeader className="text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900">
        <Icon className="h-6 w-6 text-violet-600 dark:text-violet-400" />
      </div>
      <CardTitle className="text-2xl">{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
  );
}
