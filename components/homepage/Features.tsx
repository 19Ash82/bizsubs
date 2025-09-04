// Created 2024-12-19: Features section component for BizSubs homepage
// Highlights key value propositions: client cost allocation, tax exports, lifetime deal tracking

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UsersIcon, FileTextIcon, TrendingUpIcon } from "lucide-react";

export interface FeaturesProps {
  className?: string;
}

interface FeatureCard {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  colorClass: string;
}

const features: FeatureCard[] = [
  {
    icon: UsersIcon,
    title: "Client Cost Allocation",
    description: "Assign subscriptions to specific clients and projects. See exactly what each client costs you per month.",
    colorClass: "bg-primary/10 text-primary"
  },
  {
    icon: FileTextIcon,
    title: "Tax-Ready Exports",
    description: "Generate detailed reports for your accountant. Track business vs personal expenses with proper categorization.",
    colorClass: "bg-success/10 text-success"
  },
  {
    icon: TrendingUpIcon,
    title: "Lifetime Deal Tracking",
    description: "Track one-time purchases, monitor resale values, and calculate profit/loss on your software investments.",
    colorClass: "bg-info/10 text-info"
  }
];

export function Features({ className }: FeaturesProps) {
  return (
    <section className={`py-12 sm:py-16 lg:py-20 ${className}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
            Built for Business Professionals
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to manage business subscriptions, track costs by client, and stay tax-ready.
          </p>
        </div>
        
        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card key={index} className="text-center border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4 ${feature.colorClass}`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  
                  {/* Title */}
                  <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
                  
                  {/* Description */}
                  <CardDescription className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

