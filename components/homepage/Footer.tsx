// Created 2024-12-19: Footer component for BizSubs homepage
// Simple footer with brand logo and copyright

import { DollarSignIcon } from "lucide-react";

export interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className={`border-t bg-background ${className}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          {/* Brand Logo */}
          <div className="flex items-center space-x-2 mb-4 sm:mb-0">
            <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center">
              <DollarSignIcon className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold">BizSubs</span>
          </div>
          
          {/* Copyright */}
          <div className="text-sm text-muted-foreground">
            © {currentYear} BizSubs. Built for business professionals.
          </div>
        </div>
      </div>
    </footer>
  );
}
