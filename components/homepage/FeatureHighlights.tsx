// Created 2024-12-19: Feature Highlights section component for BizSubs homepage
// Visual previews of dashboard, client filtering, export functionality, and mobile showcase

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Monitor, Filter, Download, Smartphone } from "lucide-react";

export interface FeatureHighlightsProps {
  className?: string;
}

interface FeatureHighlight {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  badge: string;
  comingSoon?: boolean;
}

const featureHighlights: FeatureHighlight[] = [
  {
    icon: Monitor,
    title: "Dashboard Overview",
    description: "Clean, organized view of all your business subscriptions with key metrics at a glance",
    badge: "Core Feature",
    comingSoon: true
  },
  {
    icon: Filter,
    title: "Client Filtering",
    description: "Filter your entire dashboard by client or project to see exactly what each relationship costs",
    badge: "Business Focus",
    comingSoon: true
  },
  {
    icon: Download,
    title: "Export Functionality",
    description: "Generate detailed CSV and PDF reports with custom date ranges and tax categorization",
    badge: "Tax Ready",
    comingSoon: true
  },
  {
    icon: Smartphone,
    title: "Mobile-Responsive Design",
    description: "Full functionality on any device - manage subscriptions from anywhere",
    badge: "Mobile First",
    comingSoon: true
  }
];

export function FeatureHighlights({ className }: FeatureHighlightsProps) {
  return (
    <section id="feature-highlights" className={`py-12 sm:py-16 lg:py-20 bg-gradient-to-r from-info/5 via-background to-success/5 ${className}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
            See BizSubs in action
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Visual previews of the features that make BizSubs the perfect subscription tracker for business professionals.
          </p>
        </div>
        
        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {featureHighlights.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card key={index} className="border-0 shadow-sm overflow-hidden">
                <CardContent className="p-0">
                  {/* Visual Preview Placeholder */}
                  <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-8 border-b border-border/50">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <IconComponent className="w-8 h-8 text-primary" />
                      </div>
                      {feature.comingSoon && (
                        <Badge variant="secondary" className="mb-2">
                          Preview Coming Soon
                        </Badge>
                      )}
                      <div className="w-full h-32 bg-background/50 rounded-lg border-2 border-dashed border-border flex items-center justify-center">
                        <span className="text-muted-foreground text-sm">
                          Visual Preview
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Feature Details */}
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-semibold">{feature.title}</h3>
                      <Badge variant="outline" className="text-xs">
                        {feature.badge}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {/* Mobile Showcase Note */}
        <div className="text-center mt-12">
          <Card className="inline-block border-0 shadow-sm bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-primary" />
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Mobile-first design:</strong> All features work seamlessly on desktop, tablet, and mobile devices
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
