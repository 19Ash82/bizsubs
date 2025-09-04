// Created 2024-12-19: FAQ section component for BizSubs homepage
// Addresses business user concerns and common questions

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface FAQProps {
  className?: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    question: "What happens when my free trial ends?",
    answer: "You can view all your existing data but cannot add new items if you're over the 2-item free limit. You can delete items to get under the limit or upgrade to continue with full functionality. Your data is never lost."
  },
  {
    question: "How does client cost allocation work?",
    answer: "You can assign each subscription to specific clients and projects. BizSubs automatically calculates total costs per client, making it easy to see profitability and bill clients for tool usage."
  },
  {
    question: "Can I export data for my accountant?",
    answer: "Yes! BizSubs generates detailed CSV and PDF reports with business categorization, tax deductible amounts, and custom date ranges. Perfect for tax season and accounting software imports."
  },
  {
    question: "What are lifetime deals and why track them?",
    answer: "Lifetime deals are one-time software purchases. BizSubs helps you track what you paid, current market value, and potential resale value - helping you optimize your software investments and avoid redundant purchases."
  },
  {
    question: "How does team collaboration work?",
    answer: "Invite team members by email. Admins have full access while Members can view all data but cannot edit or delete. All changes are logged for transparency and accountability."
  }
];

export function FAQ({ className }: FAQProps) {
  return (
    <section className={`py-12 sm:py-16 lg:py-20 bg-gradient-to-r from-primary/5 via-background to-info/10 ${className}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about BizSubs and managing your business subscriptions.
          </p>
        </div>
        
        {/* FAQ Items */}
        <div className="max-w-3xl mx-auto space-y-6">
          {faqItems.map((item, index) => (
            <Card key={index} className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">
                  {item.question}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="pt-0">
                <p className="text-muted-foreground leading-relaxed">
                  {item.answer}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
