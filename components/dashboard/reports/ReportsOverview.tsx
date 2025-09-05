// Updated 2024-12-19: ReportsOverview component with comprehensive business reporting

"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Download, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  Users,
  FolderOpen,
  BarChart3
} from "lucide-react";

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

interface ReportsOverviewProps {
  userProfile: UserProfile;
  filters: ReportFilters;
  onFilterChange: (filters: Partial<ReportFilters>) => void;
  onExportReport: (reportType: string, format: 'csv' | 'pdf') => void;
}

const REPORT_TYPES = [
  {
    id: "monthly",
    title: "Monthly Expense Report",
    description: "Detailed breakdown of monthly business expenses with tax categorization",
    icon: Calendar,
    color: "bg-blue-500",
    features: [
      "Monthly expense breakdown",
      "Tax deductible amounts",
      "Business vs personal categorization",
      "Billing cycle analysis"
    ],
    exportFormats: ["csv", "pdf"]
  },
  {
    id: "tax",
    title: "Tax Year Summary",
    description: "Annual tax summary based on your financial year settings",
    icon: FileText,
    color: "bg-green-500",
    features: [
      "Financial year calculations",
      "Total deductible amounts",
      "Tax savings calculations",
      "Category-wise breakdown"
    ],
    exportFormats: ["csv", "pdf"]
  },
  {
    id: "client",
    title: "Client Cost Allocation",
    description: "Cost allocation by client for billing transparency and profitability analysis",
    icon: Users,
    color: "bg-purple-500",
    features: [
      "Client-wise cost breakdown",
      "Project cost allocation",
      "Profitability analysis",
      "Billing transparency"
    ],
    exportFormats: ["csv", "pdf"]
  },
  {
    id: "category",
    title: "Category Breakdown",
    description: "Expense analysis by business categories (Software, Marketing, Design, etc.)",
    icon: FolderOpen,
    color: "bg-orange-500",
    features: [
      "Category-wise spending",
      "Trend analysis",
      "Budget allocation insights",
      "Cost optimization opportunities"
    ],
    exportFormats: ["csv", "pdf"]
  }
];

export function ReportsOverview({ 
  userProfile, 
  filters, 
  onFilterChange, 
  onExportReport 
}: ReportsOverviewProps) {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: userProfile.currency_preference,
    }).format(amount);
  };

  const getDateRangeText = () => {
    const start = filters.dateRange.start.toLocaleDateString();
    const end = filters.dateRange.end.toLocaleDateString();
    return `${start} - ${end}`;
  };

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Date Range</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getDateRangeText()}</div>
            <p className="text-xs text-muted-foreground">
              Selected reporting period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Financial Year</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userProfile.financial_year_end}</div>
            <p className="text-xs text-muted-foreground">
              Year end date
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tax Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userProfile.tax_rate}%</div>
            <p className="text-xs text-muted-foreground">
              Applied tax rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Currency</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userProfile.currency_preference}</div>
            <p className="text-xs text-muted-foreground">
              Reporting currency
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Report Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {REPORT_TYPES.map((report) => {
          const IconComponent = report.icon;
          return (
            <Card 
              key={report.id} 
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedReport === report.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedReport(selectedReport === report.id ? null : report.id)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${report.color} text-white`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{report.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {report.description}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className="ml-auto">
                    {report.exportFormats.join(", ").toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              
              {selectedReport === report.id && (
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {/* Features List */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Features:</h4>
                      <ul className="space-y-1">
                        {report.features.map((feature, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Export Options */}
                    <div className="flex gap-2 pt-4 border-t">
                      {report.exportFormats.map((format) => (
                        <Button
                          key={format}
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onExportReport(report.id, format as 'csv' | 'pdf');
                          }}
                          className="flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Export {format.toUpperCase()}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Common reporting tasks and shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-start gap-2"
              onClick={() => onExportReport("all", "csv")}
            >
              <Download className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Export All Data</div>
                <div className="text-sm text-gray-500">Complete CSV export</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-start gap-2"
              onClick={() => onExportReport("tax", "pdf")}
            >
              <FileText className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Tax Report</div>
                <div className="text-sm text-gray-500">PDF for accountant</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-start gap-2"
              onClick={() => onExportReport("client", "pdf")}
            >
              <Users className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Client Billing</div>
                <div className="text-sm text-gray-500">Cost allocation report</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filter Summary */}
      {(filters.clientId || filters.category || filters.projectId) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Active Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {filters.clientId && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Client: {filters.clientId}
                  <button
                    onClick={() => onFilterChange({ clientId: undefined })}
                    className="ml-1 hover:text-red-500"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {filters.category && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Category: {filters.category}
                  <button
                    onClick={() => onFilterChange({ category: undefined })}
                    className="ml-1 hover:text-red-500"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {filters.projectId && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Project: {filters.projectId}
                  <button
                    onClick={() => onFilterChange({ projectId: undefined })}
                    className="ml-1 hover:text-red-500"
                  >
                    ×
                  </button>
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
