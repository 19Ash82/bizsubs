// Created 2024-12-19: BizSubs pricing section component
// Implements freemium model with Business and Business Pro tiers as per PRD

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckIcon, XIcon } from "lucide-react";

interface PricingFeature {
  name: string;
  included: boolean;
}

interface PricingTier {
  name: string;
  price: string;
  yearlyPrice?: string;
  savings?: string;
  description: string;
  features: PricingFeature[];
  cta: string;
  popular?: boolean;
  trialText?: string;
}

const pricingTiers: PricingTier[] = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for getting started with basic subscription tracking",
    features: [
      { name: "Track up to 3 total items", included: true },
      { name: "Basic dashboard overview", included: true },
      { name: "Manual data entry", included: true },
      { name: "Cloud storage", included: true },
      { name: "Client/project organization", included: false },
      { name: "Tax categorization", included: false },
      { name: "Team collaboration", included: false },
      { name: "Advanced reporting", included: false },
    ],
    cta: "Get Started Free",
  },
  {
    name: "Business",
    price: "$12.99",
    yearlyPrice: "$129",
    savings: "Save $26",
    description: "Everything you need to organize business subscriptions and client costs",
    features: [
      { name: "Unlimited subscriptions & lifetime deals", included: true },
      { name: "Currency selection (USD, EUR, GBP, CAD)", included: true },
      { name: "Client/project organization", included: true },
      { name: "Tax categorization & exports", included: true },
      { name: "Team collaboration (up to 3 members)", included: true },
      { name: "Advanced reporting & exports", included: true },
      { name: "Priority email support", included: true },
      { name: "Unlimited team members", included: false },
    ],
    cta: "Start 7-Day Free Trial",
    popular: true,
    trialText: "No credit card required",
  },
  {
    name: "Business Premium",
    price: "$24.99",
    yearlyPrice: "$249",
    savings: "Save $50",
    description: "Advanced features for growing agencies and teams",
    features: [
      { name: "Everything in Business tier", included: true },
      { name: "Up to 25 team members", included: true },
      { name: "Advanced reporting features", included: true },
      { name: "Priority support with response within 24h", included: true },
      { name: "Custom integrations (coming soon)", included: true },
      { name: "API access (coming soon)", included: true },
      { name: "Advanced analytics dashboard", included: true },
    ],
    cta: "Start 7-Day Free Trial",
    trialText: "No credit card required",
  },
];

export function Pricing() {
  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-900/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-50 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            Start free and upgrade when you need more. All paid plans include a 7-day free trial with no credit card required.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {pricingTiers.map((tier, index) => (
            <Card 
              key={tier.name} 
              className={`relative flex flex-col ${
                tier.popular 
                  ? 'border-violet-500 shadow-lg shadow-violet-500/25 scale-105' 
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              {tier.popular && (
                <Badge 
                  className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-violet-600 text-white px-4 py-1"
                >
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                  {tier.name}
                </CardTitle>
                
                <div className="mt-4">
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-slate-900 dark:text-slate-50">
                      {tier.price}
                    </span>
                    {tier.price !== "$0" && (
                      <span className="text-slate-600 dark:text-slate-400 ml-1">
                        /month
                      </span>
                    )}
                  </div>
                  
                  {tier.yearlyPrice && (
                    <div className="mt-2">
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        or <span className="font-semibold">{tier.yearlyPrice}/year</span>
                      </p>
                      {tier.savings && (
                        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                          {tier.savings}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                
                <CardDescription className="text-slate-600 dark:text-slate-400 mt-4">
                  {tier.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col">
                {/* Features List */}
                <ul className="space-y-3 mb-8 flex-1">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      {feature.included ? (
                        <CheckIcon className="h-5 w-5 text-emerald-500 mt-0.5 mr-3 flex-shrink-0" />
                      ) : (
                        <XIcon className="h-5 w-5 text-slate-400 mt-0.5 mr-3 flex-shrink-0" />
                      )}
                      <span className={`text-sm ${
                        feature.included 
                          ? 'text-slate-700 dark:text-slate-300' 
                          : 'text-slate-500 dark:text-slate-500'
                      }`}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
                
                {/* CTA Button */}
                <div className="space-y-3">
                  <Button 
                    className={`w-full ${
                      tier.popular
                        ? 'bg-violet-600 hover:bg-violet-700 text-white'
                        : tier.name === 'Free'
                        ? 'bg-slate-600 hover:bg-slate-700 text-white'
                        : 'bg-violet-600 hover:bg-violet-700 text-white'
                    }`}
                    size="lg"
                  >
                    {tier.cta}
                  </Button>
                  
                  {tier.trialText && (
                    <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                      {tier.trialText}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Information */}
        <div className="text-center mt-16">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-8 max-w-4xl mx-auto border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-4">
              7-Day Free Trial Details
            </h3>
            <div className="grid md:grid-cols-2 gap-6 text-sm text-slate-600 dark:text-slate-400">
              <div>
                <h4 className="font-medium text-slate-900 dark:text-slate-50 mb-2">
                  What's Included:
                </h4>
                <ul className="space-y-1">
                  <li>• Full access to Business tier features</li>
                  <li>• No credit card required to start</li>
                  <li>• Clear trial countdown in dashboard</li>
                  <li>• Cancel anytime during trial</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-slate-900 dark:text-slate-50 mb-2">
                  After Trial Ends:
                </h4>
                <ul className="space-y-1">
                  <li>• Keep all your data</li>
                  <li>• Continue with Free plan (3 items max)</li>
                  <li>• Upgrade anytime to unlock full features</li>
                  <li>• No surprise charges</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
