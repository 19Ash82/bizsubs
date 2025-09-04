// Created 2024-12-19: CTA section component for BizSubs homepage
// Final conversion push with dual CTAs and trust indicators

import { Button } from "@/components/ui/button";
import Link from "next/link";

export interface CTAProps {
  className?: string;
}

export function CTA({ className }: CTAProps) {
  return (
    <section className={`py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-success/10 via-primary/5 to-info/5 ${className}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          {/* Headline */}
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
            Ready to Take Control of Your Business Subscriptions?
          </h2>
          
          {/* Subtitle */}
          <p className="text-lg text-muted-foreground mb-8">
            Join hundreds of freelancers and agencies who use BizSubs to stay profitable and organized.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
            <Button 
              size="lg" 
              className="w-full sm:w-auto min-w-[200px] h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-shadow" 
              asChild
            >
              <Link href="/auth/sign-up">Start Your Free Trial</Link>
            </Button>
            
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full sm:w-auto min-w-[200px] h-12 text-base font-semibold" 
              asChild
            >
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </div>
          
          {/* Trust Indicator */}
          <p className="text-sm text-muted-foreground">
            7-day free trial • No credit card required • Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
}
