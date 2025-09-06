// Updated 2024-12-21: Demo component showing stale-while-revalidate UI pattern
// Demonstrates selective blur overlay with static UI elements remaining crisp

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDataContainerBlur } from "@/lib/hooks/useDataContainerBlur";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Eye, EyeOff } from "lucide-react";

export function StaleWhileRevalidateDemo() {
  const queryClient = useQueryClient();

  // Set up blur overlay for demo data
  const { dataBlurClass, isRefreshing } = useDataContainerBlur({
    queryKeys: ['subscriptions', 'clients', 'projects'],
    intensity: 'medium'
  });

  const handleRefreshData = () => {
    // Invalidate queries to trigger refetch with stale data showing
    queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    queryClient.invalidateQueries({ queryKey: ['clients'] });
    queryClient.invalidateQueries({ queryKey: ['projects'] });
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Stale-While-Revalidate Demo
              <Badge variant={isRefreshing ? "default" : "secondary"}>
                {isRefreshing ? "Refreshing" : "Fresh"}
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Static UI elements stay crisp while data gets selective blur overlay
            </p>
          </div>
          <Button 
            onClick={handleRefreshData}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Static UI Elements - Always Crisp */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Static UI Elements (Always Visible)
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Navigation bars and menus</li>
            <li>• Table headers and column names</li>
            <li>• Action buttons (Add, Export, etc.)</li>
            <li>• Filter dropdowns and search bars</li>
            <li>• Page titles and descriptions</li>
          </ul>
        </div>

        {/* Dynamic Data Container - Gets Blur Overlay */}
        <div className={`p-4 bg-gray-50 rounded-lg ${dataBlurClass}`}>
          <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
            <EyeOff className="h-4 w-4" />
            Dynamic Data (Gets Blur During Refresh)
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Total Subscriptions:</span>
              <Badge variant="outline">24</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Monthly Recurring:</span>
              <Badge variant="outline">$1,247.50</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Active Clients:</span>
              <Badge variant="outline">8</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">This Month Renewals:</span>
              <Badge variant="outline">$450.00</Badge>
            </div>
          </div>
        </div>

        {/* Pattern Explanation */}
        <div className="p-4 bg-green-50 rounded-lg">
          <h3 className="font-medium text-green-900 mb-2">Benefits</h3>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• Immediate interface availability</li>
            <li>• No loading spinners blocking UI</li>
            <li>• Clear visual feedback for data freshness</li>
            <li>• Maintains full interactivity during refresh</li>
            <li>• Better perceived performance</li>
          </ul>
        </div>

        <div className="text-xs text-muted-foreground">
          <strong>Technical Implementation:</strong> Uses TanStack Query's `isRefetching` state 
          with CSS opacity/blur transitions. Static elements use `opacity-100` while dynamic 
          data containers get `opacity-60` during background refresh.
        </div>
      </CardContent>
    </Card>
  );
}

