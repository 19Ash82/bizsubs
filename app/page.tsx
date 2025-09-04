// Created 2024-12-19: BizSubs homepage - modular component composition
// SEO-optimized marketing page following PRD specifications

import { Metadata } from "next";
import { 
  Navigation, 
  Hero, 
  Problem,
  Solution,
  ValueProposition,
  FeatureHighlights,
  Features, 
  Pricing,
  Testimonials, 
  FAQ, 
  CTA, 
  Footer 
} from "@/components/homepage";

export const metadata: Metadata = {
  title: "BizSubs - Track Business Subscriptions. Organize Client Costs. Export for Taxes.",
  description: "The subscription tracker built for freelancers and agencies who need to organize business expenses and allocate costs to clients. 7-day free trial, no credit card required.",
  keywords: [
    "business subscriptions",
    "subscription tracker", 
    "freelancer tools",
    "agency tools",
    "tax deductions",
    "client billing",
    "subscription management",
    "business expense tracking",
    "lifetime deals",
    "SaaS management"
  ].join(", "),
  authors: [{ name: "BizSubs" }],
  creator: "BizSubs",
  publisher: "BizSubs",
  openGraph: {
    title: "BizSubs - Track Business Subscriptions. Organize Client Costs. Export for Taxes.",
    description: "The subscription tracker built for freelancers and agencies who need to organize business expenses and allocate costs to clients.",
    type: "website",
    locale: "en_US",
    siteName: "BizSubs",
  },
  twitter: {
    card: "summary_large_image",
    title: "BizSubs - Track Business Subscriptions. Organize Client Costs. Export for Taxes.",
    description: "The subscription tracker built for freelancers and agencies who need to organize business expenses and allocate costs to clients.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add verification codes when available
    // google: "verification-code",
  },
};

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Navigation */}
      <Navigation />

      {/* Page Content */}
      <div className="flex-1">
        {/* Hero Section */}
        <Hero />

        {/* Problem Section */}
        <Problem />

        {/* Solution Section */}
        <Solution />

        {/* Value Proposition Section */}
        <ValueProposition />

        {/* Feature Highlights Section */}
        <FeatureHighlights />

        {/* Pricing Section */}
        <Pricing />

        {/* Testimonials Section */}
        <Testimonials />

        {/* FAQ Section */}
        <FAQ />

        {/* CTA Section */}
        <CTA />
      </div>

      {/* Footer */}
      <Footer />
    </main>
  );
}
