// Updated 2024-12-19: Created modular WorkspaceCard component for dashboard

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";

interface WorkspaceCardProps {
  companyName?: string;
  subscriptionTier?: string;
  role?: string;
}

export function WorkspaceCard({ companyName, subscriptionTier, role = "Admin" }: WorkspaceCardProps) {
  const displayTier = subscriptionTier === 'trial' ? 'Trial Active' : subscriptionTier || 'Free';
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Workspace</CardTitle>
        <Building2 className="h-4 w-4 text-muted-foreground ml-auto" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {companyName || "My Workspace"}
        </div>
        <p className="text-xs text-muted-foreground">
          {role} • {displayTier}
        </p>
      </CardContent>
    </Card>
  );
}
