// Updated 2024-12-19: Created modular ProfileCard component for dashboard

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";

interface ProfileCardProps {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export function ProfileCard({ firstName, lastName, email }: ProfileCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Profile</CardTitle>
        <User className="h-4 w-4 text-muted-foreground ml-auto" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {firstName && lastName ? `${firstName} ${lastName}` : "User"}
        </div>
        <p className="text-xs text-muted-foreground">
          {email || "No email"}
        </p>
      </CardContent>
    </Card>
  );
}
