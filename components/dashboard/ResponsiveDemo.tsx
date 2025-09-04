"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * Demo component showing responsive breakpoints
 * This helps visualize the actual responsive behavior
 */
export function ResponsiveDemo() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Responsive Breakpoint Test</h2>
        <p className="text-gray-600">
          Resize your browser or test on different devices to see the layout changes
        </p>
      </div>

      {/* Breakpoint Indicators */}
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Current Layout</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="block md:hidden">
                <Badge className="bg-red-500">MOBILE LAYOUT (&lt; 768px)</Badge>
                <p className="text-sm mt-2">Card-based layout with expandable details</p>
              </div>
              <div className="hidden md:block lg:hidden">
                <Badge className="bg-yellow-500">TABLET LAYOUT (768px - 1024px)</Badge>
                <p className="text-sm mt-2">Compressed table: Name, Client, Cost, Cycle, Status, Actions</p>
              </div>
              <div className="hidden lg:block">
                <Badge className="bg-green-500">DESKTOP LAYOUT (&gt; 1024px)</Badge>
                <p className="text-sm mt-2">Full table with all columns including Project, Category, Next Payment</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mobile Features */}
        <Card>
          <CardHeader>
            <CardTitle>Mobile Features (< 768px)</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1">
              <li>✅ Stacked card components</li>
              <li>✅ Touch-friendly interactions</li>
              <li>✅ Expandable details section</li>
              <li>✅ Essential info: Name, Client, Cost, Status, Actions</li>
              <li>✅ Hidden details: Project, Category, Cycle, Next Payment</li>
              <li>✅ Full-width cards with proper spacing</li>
              <li>✅ CSS Grid/Flexbox (no table)</li>
            </ul>
          </CardContent>
        </Card>

        {/* Tablet Features */}
        <Card>
          <CardHeader>
            <CardTitle>Tablet Features (768px - 1024px)</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1">
              <li>✅ Hybrid table/card approach</li>
              <li>✅ Hidden: Project and Category columns</li>
              <li>✅ Visible: Name, Client, Cost, Cycle, Status, Actions</li>
              <li>✅ Maintains table structure</li>
              <li>✅ Compressed layout</li>
            </ul>
          </CardContent>
        </Card>

        {/* Desktop Features */}
        <Card>
          <CardHeader>
            <CardTitle>Desktop Features (> 1024px)</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1">
              <li>✅ Full table with all columns</li>
              <li>✅ Properly constrained width</li>
              <li>✅ All data visible</li>
              <li>✅ Optimal desktop experience</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Technical Implementation */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Implementation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <strong>Mobile (< 768px):</strong>
              <code className="block bg-gray-100 p-2 rounded mt-1">
                &lt;div className="block md:hidden"&gt;
              </code>
            </div>
            <div>
              <strong>Tablet (768px - 1024px):</strong>
              <code className="block bg-gray-100 p-2 rounded mt-1">
                &lt;div className="hidden md:block lg:hidden"&gt;
              </code>
            </div>
            <div>
              <strong>Desktop (> 1024px):</strong>
              <code className="block bg-gray-100 p-2 rounded mt-1">
                &lt;div className="hidden lg:block"&gt;
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
