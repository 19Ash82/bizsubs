// Created 2024-12-19: Solution section component for BizSubs homepage
// Presents BizSubs as the organized solution with core pillars

import { Card, CardContent } from "@/components/ui/card";
import { Database, Users, Tags, Shield } from "lucide-react";

export interface SolutionProps {
  className?: string;
}

interface SolutionPillar {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

const solutionPillars: SolutionPillar[] = [
  {
    icon: Database,
    title: "Centralized Tracking",
    description: "All your business subscriptions in one organized dashboard"
  },
  {
    icon: Users,
    title: "Client Assignment",
    description: "Assign costs to specific clients and projects for accurate billing"
  },
  {
    icon: Tags,
    title: "Automated Categorization",
    description: "Business vs personal expenses automatically categorized for taxes"
  },
  {
    icon: Shield,
    title: "Team Collaboration",
    description: "Role-based permissions keep your team organized and accountable"
  }
];

export function Solution({ className }: SolutionProps) {
  return (
    <section className={`py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-success/5 via-background to-primary/5 ${className}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
            BizSubs organizes everything in one place
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Stop juggling spreadsheets and scattered receipts. Get organized with a system built specifically for business professionals.
          </p>
        </div>
        
        {/* Dashboard Preview Placeholder */}
        <div className="mb-12 max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-8 border border-primary/20">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Database className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Organized Dashboard Preview</h3>
              <p className="text-muted-foreground">
                Visual preview of organized dashboard coming soon
              </p>
            </div>
          </div>
        </div>
        
        {/* Solution Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {solutionPillars.map((pillar, index) => {
            const IconComponent = pillar.icon;
            return (
              <Card key={index} className="text-center border-0 shadow-sm">
                <CardContent className="p-6">
                  {/* Icon */}
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="w-6 h-6 text-primary" />
                  </div>
                  
                  {/* Title */}
                  <h3 className="font-semibold mb-2">{pillar.title}</h3>
                  
                  {/* Description */}
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {pillar.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
