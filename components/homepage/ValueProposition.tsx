// Created 2024-12-19: Value Proposition section component for BizSubs homepage
// Dedicated "Why Us" section highlighting business-specific benefits

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, FileText, Shield, TrendingUp } from "lucide-react";

export interface ValuePropositionProps {
  className?: string;
}

interface ValuePoint {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  badge?: string;
}

const valuePoints: ValuePoint[] = [
  {
    icon: Building2,
    title: "Built specifically for business users",
    description: "Not another personal finance app. Every feature designed for freelancers, agencies, and business professionals.",
    badge: "Business Focus"
  },
  {
    icon: Users,
    title: "Client-project cost allocation",
    description: "The only subscription tracker that lets you assign costs to specific clients and projects for accurate billing.",
    badge: "Unique Feature"
  },
  {
    icon: FileText,
    title: "Tax-ready exports",
    description: "Customizable financial year settings and detailed reports that your accountant will actually want to use.",
    badge: "Tax Season Ready"
  },
  {
    icon: Shield,
    title: "Team collaboration with role-based permissions",
    description: "Invite team members with proper access controls. Admins manage, Members view - no confusion.",
    badge: "Team Ready"
  },
  {
    icon: TrendingUp,
    title: "Lifetime deal tracking for ROI analysis",
    description: "Track one-time software purchases, monitor resale values, and optimize your software investment portfolio.",
    badge: "ROI Focused"
  }
];

export function ValueProposition({ className }: ValuePropositionProps) {
  return (
    <section className={`py-12 sm:py-16 lg:py-20 bg-gradient-to-r from-info/5 via-background to-primary/10 ${className}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
            Why choose BizSubs?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Other tools treat subscriptions like personal expenses. We understand you're running a business.
          </p>
        </div>
        
        {/* Value Points */}
        <div className="space-y-6 max-w-4xl mx-auto">
          {valuePoints.map((point, index) => {
            const IconComponent = point.icon;
            return (
              <Card key={index} className="border-0 shadow-sm">
                <CardHeader>
                  <div className="flex items-start space-x-4">
                    {/* Icon */}
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <IconComponent className="w-6 h-6 text-primary" />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl">{point.title}</CardTitle>
                        {point.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {point.badge}
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-base leading-relaxed">
                        {point.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
