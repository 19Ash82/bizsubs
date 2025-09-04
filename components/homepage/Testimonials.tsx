// Created 2024-12-19: Testimonials section component for BizSubs homepage
// Business case studies and social proof from freelancers and agencies

import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { StarIcon } from "lucide-react";

export interface TestimonialsProps {
  className?: string;
}

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  initials: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    quote: "BizSubs saved me hours during tax season. I can finally see exactly what each client costs me and bill accordingly.",
    author: "Sarah Martinez",
    role: "Freelance Designer",
    initials: "SM",
    rating: 5
  },
  {
    quote: "The lifetime deal tracking is genius. I've already saved $2,400 by identifying redundant tools and optimizing our stack.",
    author: "Michael Johnson",
    role: "Agency Owner",
    initials: "MJ",
    rating: 5
  },
  {
    quote: "Simple, clean interface that actually helps me stay organized. The client filtering makes invoicing so much easier.",
    author: "Emily Rodriguez",
    role: "Marketing Consultant",
    initials: "ER",
    rating: 5
  }
];

export function Testimonials({ className }: TestimonialsProps) {
  return (
    <section className={`py-12 sm:py-16 lg:py-20 ${className}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
            Trusted by Business Professionals
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See how freelancers and agencies use BizSubs to stay profitable and organized.
          </p>
        </div>
        
        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                {/* Star Rating */}
                <div className="flex items-center space-x-1 mb-3">
                  {Array.from({ length: testimonial.rating }).map((_, starIndex) => (
                    <StarIcon 
                      key={starIndex} 
                      className="w-4 h-4 fill-primary text-primary" 
                    />
                  ))}
                </div>
                
                {/* Quote */}
                <CardDescription className="text-base leading-relaxed">
                  "{testimonial.quote}"
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0">
                {/* Author Info */}
                <div className="flex items-center space-x-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-primary">
                      {testimonial.initials}
                    </span>
                  </div>
                  
                  {/* Name and Role */}
                  <div>
                    <p className="font-semibold text-sm">{testimonial.author}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

