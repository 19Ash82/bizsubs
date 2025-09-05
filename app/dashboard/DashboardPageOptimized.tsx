// Updated 2024-12-20: Optimized Dashboard with React Query
// Eliminates manual data fetching and implements intelligent caching per PRD

"use client";

import { useState } from "react";
import {
  WelcomeHeader,
  KeyMetricsCards,
  TrialStatusCard,
  ClientFilterBar,
  UpcomingRenewalsWidget,
  RecentActivityFeed,
  QuickActionButtons,
} from "@/components/dashboard";
import { AddSubscriptionModalOptimized } from "@/components/dashboard/AddSubscriptionModalOptimized";
import { useDashboardMetrics, useRecentActivity, useUpcomingRenewals } from "@/lib/react-query/dashboard";
import { useClients } from "@/lib/react-query/clients";
import { useSubscriptions } from "@/lib/react-query/subscriptions";
import { Loader2, AlertCircle } from "lucide-react";

interface DashboardData {
  user: any;
  profile: any;
  metrics: {
    totalMonthlyRecurring: number;
    annualBusinessSpend: number;
    taxDeductibleAmount: number;
    thisMonthRenewals: number;
    currency: string;
  };
  clients: Array<{
    id: string;
    name: string;
    color_hex?: string;
  }>;
  upcomingRenewals: Array<{
    id: string;
    service_name: string;
    cost: number;
    currency: string;
    next_billing_date: string;
    billing_cycle: string;
    client_name?: string;
    client_color?: string;
    status: string;
  }>;
  recentActivity: Array<{
    id: string;
    user_email: string;
    action_type: 'create' | 'update' | 'delete';
    resource_type: string;
    description: string;
    timestamp: string;
  }>;
}

export default function DashboardPageOptimized() {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddSubscriptionModal, setShowAddSubscriptionModal] = useState(false);

  // React Query hooks for data fetching
  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useDashboardMetrics();
  const { data: clients = [], isLoading: clientsLoading, error: clientsError } = useClients();
  const { data: upcomingRenewals = [], isLoading: renewalsLoading, error: renewalsError } = useUpcomingRenewals();
  const { data: recentActivity = [], isLoading: activityLoading, error: activityError } = useRecentActivity();
  const { data: subscriptions = [], isLoading: subscriptionsLoading } = useSubscriptions();

  const isLoading = metricsLoading || clientsLoading || renewalsLoading || activityLoading || subscriptionsLoading;
  const hasError = metricsError || clientsError || renewalsError || activityError;

  // Transform data to match existing component expectations
  const dashboardData: DashboardData | null = isLoading ? null : {
    user: null, // This would come from auth context
    profile: null, // This would come from auth context
    metrics: metrics || {
      totalMonthlyRecurring: 0,
      annualBusinessSpend: 0,
      taxDeductibleAmount: 0,
      thisMonthRenewals: 0,
      currency: 'USD'
    },
    clients: clients.map(client => ({
      id: client.id,
      name: client.name,
      color_hex: client.color_hex
    })),
    upcomingRenewals,
    recentActivity: recentActivity.map(activity => ({
      id: activity.id,
      user_email: activity.user_email,
      action_type: activity.action_type,
      resource_type: activity.resource_type,
      description: activity.description,
      timestamp: activity.timestamp
    }))
  };

  const handleRefreshData = () => {
    // React Query will automatically handle cache invalidation and refetching
    // This could trigger a manual refetch if needed, but optimistic updates should handle most cases
  };

  if (hasError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">
            {hasError instanceof Error ? hasError.message : 'Failed to load dashboard data. Please try again.'}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  return (
    <div className="space-y-8 p-6">
      {/* Welcome Header */}
      <WelcomeHeader 
        userName="User" // This would come from auth context
        companyName="Company" // This would come from auth context
      />

      {/* Key Metrics */}
      <KeyMetricsCards
        totalMonthlyRecurring={dashboardData.metrics.totalMonthlyRecurring}
        annualBusinessSpend={dashboardData.metrics.annualBusinessSpend}
        taxDeductibleAmount={dashboardData.metrics.taxDeductibleAmount}
        thisMonthRenewals={dashboardData.metrics.thisMonthRenewals}
        currency={dashboardData.metrics.currency}
      />

      {/* Trial Status - would need profile data */}
      {/* <TrialStatusCard profile={dashboardData.profile} /> */}

      {/* Client Filter Bar */}
      <ClientFilterBar
        clients={dashboardData.clients}
        selectedClientId={selectedClientId}
        onClientChange={setSelectedClientId}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {/* Quick Actions */}
      <QuickActionButtons
        onAddSubscription={() => setShowAddSubscriptionModal(true)}
        subscriptionCount={subscriptions.length}
      />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upcoming Renewals */}
        <div className="lg:col-span-2">
          <UpcomingRenewalsWidget
            upcomingRenewals={dashboardData.upcomingRenewals}
            selectedClientId={selectedClientId}
            searchTerm={searchTerm}
          />
        </div>

        {/* Recent Activity */}
        <div>
          <RecentActivityFeed
            recentActivity={dashboardData.recentActivity}
          />
        </div>
      </div>

      {/* Add Subscription Modal */}
      <AddSubscriptionModalOptimized
        open={showAddSubscriptionModal}
        onOpenChange={setShowAddSubscriptionModal}
        onSuccess={() => {
          // React Query will automatically update the cache
          setShowAddSubscriptionModal(false);
        }}
        userTier="free" // This would come from profile
        userCurrency="USD" // This would come from profile
        userTaxRate={30.0} // This would come from profile
      />
    </div>
  );
}
