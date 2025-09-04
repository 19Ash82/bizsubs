// Created 2024-12-19: Hero section component for BizSubs homepage
// Features business-focused messaging, CTAs, and trial badge

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export interface HeroProps {
  className?: string;
}

export function Hero({ className }: HeroProps) {
  return (
    <section className={`py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-primary/5 via-background to-info/5 ${className}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile: Image First, Then Text */}
        <div className="lg:hidden mb-8">
          <DashboardMockup />
        </div>
        
        {/* Desktop: 2-Column Layout, Mobile: Single Column */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Column: Content */}
          <div className="text-center lg:text-left">
            {/* Trial Badge */}
            <Badge variant="secondary" className="mb-4 text-xs sm:text-sm">
            Built for small businesses and agencies

            </Badge>
            
            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight mb-6">
              Track Business Subscriptions.{" "}
              <span className="text-primary bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Organize Client Costs.
              </span>{" "}
              Export for Taxes.
            </h1>
            
            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-muted-foreground mb-6 leading-relaxed">
              The subscription tracker built for freelancers and agencies who need to organize business expenses and allocate costs to clients.
            </p>
            
            {/* Tagline */}
            <p className="text-sm font-medium text-primary/80 mb-8">
            7-Day Free Trial • No Credit Card Required
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center mb-6">
              <Button 
                size="lg" 
                className="w-full sm:w-auto min-w-[200px] h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-shadow" 
                asChild
              >
                <Link href="/auth/sign-up">Start Free Trial</Link>
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full sm:w-auto min-w-[200px] h-12 text-base font-semibold" 
                asChild
              >
                <Link href="#demo">View Demo</Link>
              </Button>
            </div>
            
            {/* Trust Indicator */}
            <p className="text-sm text-muted-foreground">
              Free forever for up to 2 subscriptions • Upgrade anytime
            </p>
          </div>
          
          {/* Right Column: Dashboard Mockup (Desktop Only) */}
          <div className="hidden lg:block">
            <DashboardMockup />
          </div>
        </div>
      </div>
    </section>
  );
}

// Dashboard Mockup Component
function DashboardMockup() {
  const subscriptions = [
    { name: "Google Workspace", cost: "$18.00", client: "Client A", color: "bg-blue-500" },
    { name: "Adobe Creative Suite", cost: "$52.99", client: "Client B", color: "bg-red-500" },
    { name: "Figma Professional", cost: "$12.00", client: "Client A", color: "bg-purple-500" },
    { name: "Notion Pro", cost: "$8.00", client: "Internal", color: "bg-gray-500" },
    { name: "Slack Pro", cost: "$7.25", client: "Client C", color: "bg-green-500" }
  ];

  return (
    <div className="relative">
      {/* Dashboard Container */}
      <div className="bg-background border border-border rounded-xl shadow-2xl p-6 relative z-10">
        {/* Dashboard Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Business Subscriptions</h3>
          <div className="text-sm text-muted-foreground">Total: $98.24/month</div>
        </div>
        
        {/* Subscription List */}
        <div className="space-y-3">
          {subscriptions.map((sub, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${sub.color}`}></div>
                <div>
                  <div className="font-medium text-sm">{sub.name}</div>
                  <div className="text-xs text-muted-foreground">{sub.client}</div>
                </div>
              </div>
              <div className="font-semibold text-sm">{sub.cost}</div>
            </div>
          ))}
        </div>
        
        {/* Bottom Stats */}
        <div className="mt-6 pt-4 border-t border-border">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-primary">$1,179</div>
              <div className="text-xs text-muted-foreground">Annual Cost</div>
            </div>
            <div>
              <div className="text-lg font-bold text-success">$943</div>
              <div className="text-xs text-muted-foreground">Tax Deductible</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl blur-xl transform scale-110 -z-10"></div>
    </div>
  );
}
