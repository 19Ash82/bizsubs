// Updated 2024-12-19: TaxYearSummary component for annual tax reporting

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Download,
  Receipt,
  Calculator,
  PieChart
} from "lucide-react";
import { useTaxYearSummary } from "@/lib/react-query/reports";

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

interface TaxYearSummaryProps {
  userProfile: UserProfile;
  filters: ReportFilters;
  onFilterChange: (filters: Partial<ReportFilters>) => void;
}

export function TaxYearSummary({ 
  userProfile, 
  filters, 
  onFilterChange 
}: TaxYearSummaryProps) {
  const { data: reportData, isLoading, error } = useTaxYearSummary(filters, userProfile);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: userProfile.currency_preference,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long',
      day: 'numeric'
    });
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
        <p className="text-red-500">Error loading tax year summary</p>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No data available for the tax year</p>
      </div>
    );
  }

  const { taxSummary, financialYearStart, financialYearEnd } = reportData;

  return (
    <div className="space-y-6">
      {/* Financial Year Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Financial Year Summary
          </CardTitle>
          <CardDescription>
            Tax year: {formatDate(financialYearStart)} - {formatDate(financialYearEnd)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Financial Year End</div>
              <div className="text-lg font-medium">{userProfile.financial_year_end}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Tax Rate</div>
              <div className="text-lg font-medium">{userProfile.tax_rate}%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tax Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Business Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(taxSummary.totalBusinessExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              All business-related expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tax Deductible Amount</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(taxSummary.totalTaxDeductible)}
            </div>
            <p className="text-xs text-muted-foreground">
              {((taxSummary.totalTaxDeductible / taxSummary.totalBusinessExpenses) * 100).toFixed(1)}% of total expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estimated Tax Savings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(taxSummary.totalTaxSavings)}
            </div>
            <p className="text-xs text-muted-foreground">
              At {taxSummary.averageTaxRate?.toFixed(1)}% average rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Deductibility Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Deductibility Breakdown
          </CardTitle>
          <CardDescription>
            Breakdown of deductible vs non-deductible expenses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Tax Deductible</span>
                <span>{formatCurrency(taxSummary.totalTaxDeductible)}</span>
              </div>
              <Progress 
                value={(taxSummary.totalTaxDeductible / taxSummary.totalBusinessExpenses) * 100} 
                className="h-2"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Non-Deductible</span>
                <span>{formatCurrency(taxSummary.totalBusinessExpenses - taxSummary.totalTaxDeductible)}</span>
              </div>
              <Progress 
                value={((taxSummary.totalBusinessExpenses - taxSummary.totalTaxDeductible) / taxSummary.totalBusinessExpenses) * 100} 
                className="h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Category Breakdown
          </CardTitle>
          <CardDescription>
            Tax deductible expenses by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(
              reportData.subscriptions
                .filter(sub => sub.tax_deductible)
                .reduce((acc: { [key: string]: number }, sub) => {
                  const category = sub.category || 'other';
                  const annualAmount = sub.billing_cycle === 'annual' ? sub.cost :
                                     sub.billing_cycle === 'monthly' ? sub.cost * 12 :
                                     sub.billing_cycle === 'quarterly' ? sub.cost * 4 :
                                     sub.billing_cycle === 'weekly' ? sub.cost * 52 : sub.cost * 12;
                  acc[category] = (acc[category] || 0) + annualAmount;
                  return acc;
                }, {})
            )
              .sort(([,a], [,b]) => (b as number) - (a as number))
              .map(([category, amount]) => (
                <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge className={getCategoryColor(category)}>
                      {category}
                    </Badge>
                  </div>
                                      <div className="text-right">
                      <div className="font-medium">{formatCurrency(amount)}</div>
                      <div className="text-sm text-gray-500">
                        Tax savings calculated per item
                      </div>
                    </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Lifetime Deals Summary */}
      {reportData.lifetimeDeals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Lifetime Deals Summary
            </CardTitle>
            <CardDescription>
              One-time purchases for the tax year
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportData.lifetimeDeals
                .filter(deal => deal.tax_deductible)
                .map((deal) => (
                  <div key={deal.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge className={getCategoryColor(deal.category)}>
                        {deal.category}
                      </Badge>
                      <div>
                        <div className="font-medium">{deal.service_name}</div>
                        <div className="text-sm text-gray-500">
                          Purchased: {new Date(deal.purchase_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(deal.original_cost)}</div>
                      <div className="text-sm text-gray-500">
                        {formatCurrency(deal.original_cost * ((deal.tax_rate || userProfile.tax_rate) / 100))} tax savings
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Tax Report
          </CardTitle>
          <CardDescription>
            Download your tax year summary for your accountant
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
              <strong>Note:</strong> Tax calculations use individual tax rates set for each subscription and lifetime deal. 
              Please verify all amounts with your accountant before filing.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
