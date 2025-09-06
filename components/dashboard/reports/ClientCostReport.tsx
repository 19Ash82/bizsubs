// Updated 2024-12-19: ClientCostReport component for client cost allocation and billing transparency

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Download,
  FileText,
  PieChart,
  BarChart3
} from "lucide-react";
import { useClientCostReport } from "@/lib/react-query/reports";
import { useDataContainerBlur } from "@/lib/hooks/useDataContainerBlur";

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  company_name: string;
  currency_preference: string;
  financial_year_end: string;
  tax_rate: number;
  subscription_tier: string;
}

interface ReportFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  clientId?: string;
  category?: string;
  projectId?: string;
}

interface ClientCostReportProps {
  userProfile: UserProfile;
  filters: ReportFilters;
  onFilterChange: (filters: Partial<ReportFilters>) => void;
}

export function ClientCostReport({ 
  userProfile, 
  filters, 
  onFilterChange 
}: ClientCostReportProps) {
  const { data: reportData, isLoading, error } = useClientCostReport(filters, userProfile);

  // Set up blur overlay for report data
  const { dataBlurClass } = useDataContainerBlur({
    queryKeys: ['client-cost-report'],
    intensity: 'medium'
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: userProfile.currency_preference,
    }).format(amount);
  };

  const getClientColor = (colorHex?: string) => {
    return colorHex || '#6366f1';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Error loading client cost report</p>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No data available for the selected period</p>
      </div>
    );
  }

  const { clientCosts, totalCosts } = reportData;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${dataBlurClass}`}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Client Costs</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalCosts)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {clientCosts.length} clients
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clientCosts.filter(client => client.totalCost > 0).length}
            </div>
            <p className="text-xs text-muted-foreground">
              With associated costs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Cost per Client</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalCosts / Math.max(clientCosts.length, 1))}
            </div>
            <p className="text-xs text-muted-foreground">
              Mean cost allocation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Client Cost Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Client Cost Breakdown
          </CardTitle>
          <CardDescription>
            Detailed cost allocation by client for billing transparency
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className={`space-y-4 ${dataBlurClass}`}>
            {clientCosts.map((client) => {
              const percentage = totalCosts > 0 ? (client.totalCost / totalCosts) * 100 : 0;
              return (
                <div key={client.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: getClientColor(client.color_hex) }}
                      ></div>
                      <div>
                        <h3 className="font-medium text-gray-900">{client.name}</h3>
                        {client.email && (
                          <p className="text-sm text-gray-500">{client.email}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        {formatCurrency(client.totalCost)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {percentage.toFixed(1)}% of total
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <Progress value={percentage} className="h-2" />
                  </div>

                  {/* Cost Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subscriptions:</span>
                      <span className="font-medium">{formatCurrency(client.subscriptionCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Lifetime Deals:</span>
                      <span className="font-medium">{formatCurrency(client.lifetimeDealCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Items:</span>
                      <span className="font-medium">
                        {client.subscriptionCount + client.lifetimeDealCount} total
                      </span>
                    </div>
                  </div>

                  {/* Item Counts */}
                  <div className="mt-3 flex gap-4 text-xs text-gray-500">
                    <span>{client.subscriptionCount} subscriptions</span>
                    <span>{client.lifetimeDealCount} lifetime deals</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Cost Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Cost Distribution
          </CardTitle>
          <CardDescription>
            Visual breakdown of costs by client
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {clientCosts
              .filter(client => client.totalCost > 0)
              .map((client) => {
                const percentage = totalCosts > 0 ? (client.totalCost / totalCosts) * 100 : 0;
                return (
                  <div key={client.id} className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getClientColor(client.color_hex) }}
                    ></div>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{client.name}</span>
                        <span>{formatCurrency(client.totalCost)}</span>
                      </div>
                      <Progress value={percentage} className="h-1 mt-1" />
                    </div>
                    <div className="text-xs text-gray-500 w-12 text-right">
                      {percentage.toFixed(1)}%
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Billing Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Billing Insights
          </CardTitle>
          <CardDescription>
            Key insights for client billing and profitability analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Top Spending Clients</h4>
              <div className="space-y-2">
                {clientCosts
                  .filter(client => client.totalCost > 0)
                  .slice(0, 3)
                  .map((client, index) => (
                    <div key={client.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                        <span className="text-sm font-medium">{client.name}</span>
                      </div>
                      <span className="text-sm font-medium">{formatCurrency(client.totalCost)}</span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Cost Categories</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subscriptions</span>
                  <span>{formatCurrency(clientCosts.reduce((sum, client) => sum + client.subscriptionCost, 0))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Lifetime Deals</span>
                  <span>{formatCurrency(clientCosts.reduce((sum, client) => sum + client.lifetimeDealCost, 0))}</span>
                </div>
                <div className="flex justify-between text-sm font-medium border-t pt-2">
                  <span>Total</span>
                  <span>{formatCurrency(totalCosts)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Client Report
          </CardTitle>
          <CardDescription>
            Download client cost allocation for billing and profitability analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Export PDF
            </Button>
          </div>
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>Billing Ready:</strong> This report includes all necessary details 
              for client billing and cost allocation transparency.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
