// Updated 2024-12-19: Comprehensive reports management page with full functionality

"use client";

import { useState } from "react";
import { useUser } from "@/lib/react-query/user";
import { useDataContainerBlur } from "@/lib/hooks/useDataContainerBlur";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Filter,
  Settings,
  Download,
  FileText,
  Users,
  FolderOpen,
  BarChart3
} from "lucide-react";

// Import all report components
import {
  ReportsOverview,
  MonthlyExpenseReport,
  TaxYearSummary,
  ClientCostReport,
  CategoryBreakdown,
  ExportModal,
  DateRangePicker
} from "@/components/dashboard/reports";

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

export default function ReportsPage() {
  // Use React Query for user data
  const { user, profile, isLoading: userLoading, error: userError } = useUser();
  
  const [activeTab, setActiveTab] = useState("overview");
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportReportType, setExportReportType] = useState("overview");
  
  // Initialize with current month
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: {
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
    }
  });

  // Convert profile to expected format
  const userProfile: UserProfile | null = profile ? {
    id: profile.id,
    first_name: profile.first_name || '',
    last_name: profile.last_name || '',
    company_name: profile.company_name || '',
    currency_preference: profile.currency_preference || 'USD',
    financial_year_end: profile.financial_year_end || '12-31',
    tax_rate: profile.tax_rate || 30,
    subscription_tier: profile.subscription_tier || 'free'
  } : null;

  // Calculate loading and error states from React Query
  const loading = userLoading;
  const error = userError?.message || null;
  const setupRequired = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY;

  // Set up blur overlays for different report sections
  const { dataBlurClass: overviewBlurClass } = useDataContainerBlur({
    queryKeys: ['monthly-expense-report', 'tax-year-summary'],
    intensity: 'medium'
  });

  const { dataBlurClass: monthlyBlurClass } = useDataContainerBlur({
    queryKeys: ['monthly-expense-report'],
    intensity: 'medium'
  });

  const { dataBlurClass: taxYearBlurClass } = useDataContainerBlur({
    queryKeys: ['tax-year-summary'],
    intensity: 'medium'
  });

  const { dataBlurClass: clientBlurClass } = useDataContainerBlur({
    queryKeys: ['client-cost-report'],
    intensity: 'medium'
  });

  const { dataBlurClass: categoryBlurClass } = useDataContainerBlur({
    queryKeys: ['category-breakdown'],
    intensity: 'medium'
  });

  const handleFilterChange = (newFilters: Partial<ReportFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleExportReport = (reportType: string, format: 'csv' | 'pdf') => {
    setExportReportType(reportType);
    setShowExportModal(true);
  };

  if (loading) {
    return (
      <div className="flex-1 w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (setupRequired) {
    return (
      <div className="flex-1 w-full flex items-center justify-center">
        <div className="max-w-2xl mx-auto p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-yellow-800 mb-4">Supabase Setup Required</h2>
            <p className="text-yellow-700 mb-4">
              To use the reports feature, you need to set up your Supabase project and configure environment variables.
            </p>
            <div className="space-y-3 text-sm text-yellow-700">
              <p><strong>1. Create a .env.local file in your project root with:</strong></p>
              <div className="bg-yellow-100 p-3 rounded font-mono text-xs">
                NEXT_PUBLIC_SUPABASE_URL=your_supabase_url<br/>
                NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your_supabase_anon_key
              </div>
              <p><strong>2. Run the database schema:</strong></p>
              <p>Copy the contents of <code className="bg-yellow-100 px-1 rounded">supabase_schema.sql</code> and run it in your Supabase SQL Editor.</p>
              <p><strong>3. Restart your development server:</strong></p>
              <p>Run <code className="bg-yellow-100 px-1 rounded">npm run dev</code> again after setting up the environment variables.</p>
            </div>
            <div className="mt-4">
              <a 
                href="/SUPABASE_SETUP.md" 
                className="text-blue-600 hover:text-blue-800 underline"
                target="_blank"
              >
                View detailed setup instructions →
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 w-full flex items-center justify-center">
        <div className="max-w-2xl mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-4">Error Loading Reports</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <div className="text-sm text-red-600">
              <p>This could be due to:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Supabase environment variables not configured</li>
                <li>Database schema not set up</li>
                <li>User not authenticated</li>
                <li>Database connection issues</li>
              </ul>
            </div>
            <div className="mt-4">
              <a 
                href="/SUPABASE_SETUP.md" 
                className="text-blue-600 hover:text-blue-800 underline"
                target="_blank"
              >
                View setup instructions →
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex-1 w-full flex items-center justify-center">
        <p className="text-gray-500">No user profile found</p>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Business Reports</h1>
          <p className="text-gray-600 mt-1">
            Generate comprehensive reports for tax preparation and business analysis
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangePicker
            dateRange={filters.dateRange}
            onDateRangeChange={(dateRange) => handleFilterChange({ dateRange })}
          />
          <Button
            variant="outline"
            onClick={() => handleExportReport(activeTab, 'csv')}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Business Context Cards - Static UI, no blur needed */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Company</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{userProfile.company_name}</div>
            <p className="text-xs text-muted-foreground">
              {userProfile.first_name} {userProfile.last_name}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Financial Year End</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{userProfile.financial_year_end}</div>
            <p className="text-xs text-muted-foreground">
              Tax year configuration
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Default Tax Rate</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{userProfile.tax_rate}%</div>
            <p className="text-xs text-muted-foreground">
              Default for new items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Currency</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{userProfile.currency_preference}</div>
            <p className="text-xs text-muted-foreground">
              Report currency
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reports Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="monthly" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Monthly
          </TabsTrigger>
          <TabsTrigger value="tax" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Tax Summary
          </TabsTrigger>
          <TabsTrigger value="client" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Client Costs
          </TabsTrigger>
          <TabsTrigger value="category" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Categories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className={overviewBlurClass}>
            <ReportsOverview
              userProfile={userProfile}
              filters={filters}
              onFilterChange={handleFilterChange}
              onExportReport={handleExportReport}
            />
          </div>
        </TabsContent>

        <TabsContent value="monthly" className="mt-6">
          <div className={monthlyBlurClass}>
            <MonthlyExpenseReport
              userProfile={userProfile}
              filters={filters}
              onFilterChange={handleFilterChange}
            />
          </div>
        </TabsContent>

        <TabsContent value="tax" className="mt-6">
          <div className={taxYearBlurClass}>
            <TaxYearSummary
              userProfile={userProfile}
              filters={filters}
              onFilterChange={handleFilterChange}
            />
          </div>
        </TabsContent>

        <TabsContent value="client" className="mt-6">
          <div className={clientBlurClass}>
            <ClientCostReport
              userProfile={userProfile}
              filters={filters}
              onFilterChange={handleFilterChange}
            />
          </div>
        </TabsContent>

        <TabsContent value="category" className="mt-6">
          <div className={categoryBlurClass}>
            <CategoryBreakdown
              userProfile={userProfile}
              filters={filters}
              onFilterChange={handleFilterChange}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Export Modal */}
      <ExportModal
        open={showExportModal}
        onOpenChange={setShowExportModal}
        reportType={exportReportType}
        userProfile={userProfile}
        filters={filters}
      />
    </div>
  );
}