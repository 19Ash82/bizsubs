// Created 2024-12-19: Problem section component for BizSubs homepage
// Highlights pain points in managing business subscriptions across clients

import { Card, CardContent } from "@/components/ui/card";
import { FileSearchIcon, UsersIcon, ReceiptIcon, CalendarIcon } from "lucide-react";

export interface ProblemProps {
  className?: string;
}

interface PainPoint {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

const painPoints: PainPoint[] = [
  {
    icon: ReceiptIcon,
    title: "Scattered Receipts",
    description: "Subscription receipts spread across multiple email accounts and payment methods"
  },
  {
    icon: UsersIcon,
    title: "Unclear Client Cost Allocation",
    description: "Can't easily track which tools are used for which clients or projects"
  },
  {
    icon: CalendarIcon,
    title: "Tax Season Chaos",
    description: "Scrambling to categorize business expenses and calculate deductions"
  },
  {
    icon: FileSearchIcon,
    title: "Team Tool Confusion",
    description: "Team members using different tools without visibility into total costs"
  }
];

export function Problem({ className }: ProblemProps) {
  return (
    <section className={`py-12 sm:py-16 lg:py-20 bg-gradient-to-r from-warning/5 via-background to-warning/10 ${className}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
            Managing business subscriptions across multiple clients is messy
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Sound familiar? You're not alone. Here's what most freelancers and agencies struggle with:
          </p>
        </div>
        
        {/* Pain Points Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
          {painPoints.map((painPoint, index) => {
            const IconComponent = painPoint.icon;
            return (
              <Card key={index} className="border-0 shadow-sm bg-background/50">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    {/* Icon */}
                    <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <IconComponent className="w-5 h-5 text-warning" />
                    </div>
                    
                    {/* Content */}
                    <div>
                      <h3 className="font-semibold mb-2">{painPoint.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {painPoint.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
