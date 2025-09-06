// Updated 2024-12-19: CategoryBreakdown component for expense categorization analysis

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  FolderOpen, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Download,
  FileText,
  PieChart,
  BarChart3,
  Target,
  AlertTriangle
} from "lucide-react";
import { useCategoryBreakdown } from "@/lib/react-query/reports";
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

interface CategoryBreakdownProps {
  userProfile: UserProfile;
  filters: ReportFilters;
  onFilterChange: (filters: Partial<ReportFilters>) => void;
}

const CATEGORY_ICONS: { [key: string]: any } = {
  software: "💻",
  marketing: "📢",
  design: "🎨",
  infrastructure: "🏗️",
  communication: "💬",
  productivity: "⚡",
  analytics: "📊",
  security: "🔒",
  other: "📁",
};

const CATEGORY_COLORS: { [key: string]: string } = {
  software: "bg-blue-100 text-blue-800",
  marketing: "bg-green-100 text-green-800",
  design: "bg-purple-100 text-purple-800",
  infrastructure: "bg-orange-100 text-orange-800",
  communication: "bg-cyan-100 text-cyan-800",
  productivity: "bg-yellow-100 text-yellow-800",
  analytics: "bg-indigo-100 text-indigo-800",
  security: "bg-red-100 text-red-800",
  other: "bg-gray-100 text-gray-800",
};

export function CategoryBreakdown({ 
  userProfile, 
  filters, 
  onFilterChange 
}: CategoryBreakdownProps) {
  const { data: reportData, isLoading, error } = useCategoryBreakdown(filters, userProfile);

  // Set up blur overlay for report data
  const { dataBlurClass } = useDataContainerBlur({
    queryKeys: ['category-breakdown'],
    intensity: 'medium'
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: userProfile.currency_preference,
    }).format(amount);
  };

  const getCategoryIcon = (category: string) => {
    return CATEGORY_ICONS[category] || CATEGORY_ICONS.other;
  };

  const getCategoryColor = (category: string) => {
    return CATEGORY_COLORS[category] || CATEGORY_COLORS.other;
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
        <p className="text-red-500">Error loading category breakdown</p>
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

  const { categoryBreakdown, totalExpenses } = reportData;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${dataBlurClass}`}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Business Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              Business expenses across {categoryBreakdown.length} categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Category</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {categoryBreakdown[0]?.category || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {categoryBreakdown[0] && formatCurrency(categoryBreakdown[0].total)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average per Category</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalExpenses / Math.max(categoryBreakdown.length, 1))}
            </div>
            <p className="text-xs text-muted-foreground">
              Mean category spending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Category Breakdown
          </CardTitle>
          <CardDescription>
            Detailed expense analysis by business category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categoryBreakdown.map((category) => {
              const percentage = totalExpenses > 0 ? (category.total / totalExpenses) * 100 : 0;
              return (
                <div key={category.category} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getCategoryIcon(category.category)}</span>
                      <div>
                        <h3 className="font-medium text-gray-900 capitalize">
                          {category.category}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {category.count} items
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        {formatCurrency(category.total)}
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

                  {/* Category Items Preview */}
                  <div className="space-y-2">
                    {category.items.slice(0, 3).map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                        <div className="flex items-center gap-2">
                          <Badge className={getCategoryColor(item.category)}>
                            {item.category}
                          </Badge>
                          <span className="font-medium">{item.service_name}</span>
                        </div>
                        <span className="font-medium">{formatCurrency(item.calculatedAmount)}</span>
                      </div>
                    ))}
                    {category.items.length > 3 && (
                      <div className="text-sm text-gray-500 text-center py-1">
                        +{category.items.length - 3} more items
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Category Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Category Distribution
          </CardTitle>
          <CardDescription>
            Visual breakdown of expenses by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {categoryBreakdown.map((category) => {
              const percentage = totalExpenses > 0 ? (category.total / totalExpenses) * 100 : 0;
              return (
                <div key={category.category} className="flex items-center gap-3">
                  <span className="text-lg">{getCategoryIcon(category.category)}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium capitalize">{category.category}</span>
                      <span>{formatCurrency(category.total)}</span>
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

      {/* Spending Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Spending Insights
          </CardTitle>
          <CardDescription>
            Key insights for budget optimization and cost management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Top Spending Categories</h4>
              <div className="space-y-2">
                {categoryBreakdown.slice(0, 3).map((category, index) => (
                  <div key={category.category} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                      <span className="text-lg">{getCategoryIcon(category.category)}</span>
                      <span className="text-sm font-medium capitalize">{category.category}</span>
                    </div>
                    <span className="text-sm font-medium">{formatCurrency(category.total)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Category Statistics</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Categories</span>
                  <span>{categoryBreakdown.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Items</span>
                  <span>{categoryBreakdown.reduce((sum, cat) => sum + cat.count, 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Average per Category</span>
                  <span>{formatCurrency(totalExpenses / Math.max(categoryBreakdown.length, 1))}</span>
                </div>
                <div className="flex justify-between text-sm font-medium border-t pt-2">
                  <span>Total Expenses</span>
                  <span>{formatCurrency(totalExpenses)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Budget Recommendations
          </CardTitle>
          <CardDescription>
            Suggestions for optimizing your business expenses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categoryBreakdown.slice(0, 3).map((category) => {
              const percentage = totalExpenses > 0 ? (category.total / totalExpenses) * 100 : 0;
              const isHighSpending = percentage > 30;
              const isLowSpending = percentage < 10;
              
              return (
                <div key={category.category} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{getCategoryIcon(category.category)}</span>
                    <span className="font-medium capitalize">{category.category}</span>
                    <Badge className={getCategoryColor(category.category)}>
                      {percentage.toFixed(1)}%
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    {isHighSpending && (
                      <>High spending category. Consider reviewing subscriptions for potential savings.</>
                    )}
                    {isLowSpending && (
                      <>Low spending category. This might be an area for strategic investment.</>
                    )}
                    {!isHighSpending && !isLowSpending && (
                      <>Balanced spending. Monitor for any significant changes.</>
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tax Disclaimer */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <AlertTriangle className="h-5 w-5" />
            Important Information
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-amber-700 space-y-2">
          <p>
            <strong>These figures are estimates only - consult a tax professional.</strong>
          </p>
          <p>
            Business expense categorization for tax preparation purposes only.
            This software provides expense tracking and does not constitute tax advice.
          </p>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Category Report
          </CardTitle>
          <CardDescription>
            Download category breakdown for budget planning and analysis
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
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Budget Planning:</strong> Use this report to identify spending patterns 
              and optimize your business expense allocation.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
