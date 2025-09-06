// Updated 2024-12-19: MonthlyExpenseReport component with detailed monthly breakdown

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  FileText,
  Download,
  ChevronDown,
  ChevronRight,
  AlertTriangle
} from "lucide-react";
import { useState } from "react";
import { useMonthlyExpenseReport } from "@/lib/react-query/reports";
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

interface MonthlyExpenseReportProps {
  userProfile: UserProfile;
  filters: ReportFilters;
  onFilterChange: (filters: Partial<ReportFilters>) => void;
}

export function MonthlyExpenseReport({ 
  userProfile, 
  filters, 
  onFilterChange 
}: MonthlyExpenseReportProps) {
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const { data: reportData, isLoading, error } = useMonthlyExpenseReport(filters, userProfile);

  // Set up blur overlay for report data
  const { dataBlurClass } = useDataContainerBlur({
    queryKeys: ['monthly-expense-report'],
    intensity: 'medium'
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: userProfile.currency_preference,
    }).format(amount);
  };

  const formatMonth = (monthString: string) => {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  const toggleMonthExpansion = (month: string) => {
    const newExpanded = new Set(expandedMonths);
    if (newExpanded.has(month)) {
      newExpanded.delete(month);
    } else {
      newExpanded.add(month);
    }
    setExpandedMonths(newExpanded);
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      software: "bg-blue-100 text-blue-800",
      marketing: "bg-green-100 text-green-800",
      design: "bg-purple-100 text-purple-800",
      infrastructure: "bg-orange-100 text-orange-800",
      other: "bg-gray-100 text-gray-800",
    };
    return colors[category] || colors.other;
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
        <p className="text-red-500">Error loading monthly expense report</p>
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
              {formatCurrency(reportData.totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              All business-related expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potentially Deductible</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(reportData.totalTaxDeductible)}
            </div>
            <p className="text-xs text-muted-foreground">
              {((reportData.totalTaxDeductible / reportData.totalExpenses) * 100).toFixed(1)}% of business expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potential Tax Impact</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(reportData.totalTaxSavings || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              If deductible (estimate only)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Monthly Breakdown
          </CardTitle>
          <CardDescription>
            Detailed monthly expense breakdown with itemized costs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className={`space-y-4 ${dataBlurClass}`}>
            {reportData.monthlyTotals.map((month) => {
              const isExpanded = expandedMonths.has(month.month);
              return (
                <div key={month.month} className="border rounded-lg">
                  {/* Month Header */}
                  <div 
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleMonthExpansion(month.month)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        )}
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {formatMonth(month.month)}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {month.items.length} items
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">
                          {formatCurrency(month.total)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatCurrency(month.taxDeductible)} deductible
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Month Details */}
                  {isExpanded && (
                    <div className="border-t bg-gray-50 p-4">
                      <div className="space-y-3">
                        {month.items.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {item.service_name}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <Badge 
                                    variant="secondary" 
                                    className={getCategoryColor(item.category)}
                                  >
                                    {item.category}
                                  </Badge>
                                  {item.clients?.name && (
                                    <span>• {item.clients.name}</span>
                                  )}
                                  {item.projects?.name && (
                                    <span>• {item.projects.name}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-gray-900">
                                {formatCurrency(item.calculatedAmount)}
                              </div>
                              <div className="text-sm text-gray-500">
                                {item.tax_deductible ? (
                                  <span className="text-green-600">Tax deductible</span>
                                ) : (
                                  <span className="text-gray-400">Not deductible</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
            Important Tax Information
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-amber-700 space-y-2">
          <p>
            <strong>These figures are estimates only - consult a tax professional.</strong>
          </p>
          <p>
            Actual deductibility depends on your specific tax situation, local tax laws, and current regulations.
          </p>
          <p>
            This software provides expense tracking only and does not constitute tax advice.
          </p>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Options
          </CardTitle>
          <CardDescription>
            Download your monthly expense report in various formats
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
        </CardContent>
      </Card>
    </div>
  );
}
