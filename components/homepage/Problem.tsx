// Updated 2024-12-19: Problem section component for BizSubs homepage
// Redesigned with 2-column layout: subscription visual left, problems right, purple theming

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { 
  CreditCardIcon, 
  Users2Icon, 
  FileX2Icon, 
  AlertTriangleIcon
} from "lucide-react";

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
    icon: CreditCardIcon,
    title: "Scattered Receipts",
    description: "Subscription receipts spread across multiple email accounts and payment methods"
  },
  {
    icon: Users2Icon,
    title: "Unclear Client Cost Allocation",
    description: "Can't easily track which tools are used for which clients or projects"
  },
  {
    icon: FileX2Icon,
    title: "Tax Season Chaos",
    description: "Scrambling to categorize business expenses and calculate deductions"
  },
  {
    icon: AlertTriangleIcon,
    title: "Team Tool Confusion",
    description: "Team members using different tools without visibility into total costs"
  }
];

// Subscription chaos image component
const SubscriptionChaosImage = () => {
  return (
    <div className="relative rounded-xl overflow-hidden shadow-2xl">
      <img 
        src="/images/subscription-chaos-desk.jpg" 
        alt="Chaotic desk covered with sticky notes showing payment failures, account suspensions, and subscription management problems - representing the current reality of managing multiple business subscriptions"
        className="w-full h-auto rounded-xl"
        style={{ aspectRatio: '1/1' }}
      />
      {/* Overlay for better text contrast if needed */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent rounded-xl"></div>
      
      {/* Chaos indicator */}
      <div className="absolute top-4 right-4">
        <div className="bg-red-500 text-white text-xs px-3 py-1 rounded-full font-medium shadow-lg animate-pulse">
          This is you right now!
        </div>
      </div>
    </div>
  );
};

export function Problem({ className }: ProblemProps) {
  return (
    <section className={`py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-violet-50/50 via-background to-violet-100/30 dark:from-violet-950/20 dark:via-background dark:to-violet-900/10 ${className}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 text-slate-900 dark:text-slate-100">
            Managing subscriptions across multiple projects is messy
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Sound familiar? You're not alone. Here's what most freelancers and agencies struggle with:
          </p>
        </div>
        
        {/* Main Content: 2-column layout on desktop, stacked on mobile */}
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            
            {/* Left Column: Subscription Management Visual (shows first on mobile) */}
            <div className="order-1 lg:order-1">
              <div className="sticky top-8">
                <h3 className="text-xl font-semibold mb-6 text-center lg:text-left text-slate-900 dark:text-slate-100">
                  Your current reality
                </h3>
                <SubscriptionChaosImage />
              </div>
            </div>

            {/* Right Column: Problem Points (shows second on mobile) */}
            <div className="order-2 lg:order-2">
              <h3 className="text-xl font-semibold mb-6 text-center lg:text-left text-slate-900 dark:text-slate-100">
                The problems you face daily
              </h3>
              <div className="space-y-4">
                {painPoints.map((painPoint, index) => {
                  const IconComponent = painPoint.icon;
                  return (
                    <Card key={index} className="border-violet-200/50 dark:border-violet-800/30 shadow-sm bg-background/80 backdrop-blur-sm hover:shadow-lg hover:shadow-violet-500/10 transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          {/* Icon */}
                          <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                            <IconComponent className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg mb-2 text-slate-900 dark:text-slate-100">
                              {painPoint.title}
                            </h4>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
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
          </div>
        </div>
      </div>
    </section>
  );
}
