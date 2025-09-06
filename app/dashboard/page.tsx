// Updated 2024-12-21: Complete dashboard with stale-while-revalidate pattern and selective blur overlay

"use client";

import { useState } from "react";
import { useUser } from "@/lib/react-query/user";
import { useDashboardMetrics, useUpcomingRenewals, useRecentActivity } from "@/lib/react-query/dashboard";
import { useClients } from "@/lib/react-query/clients";
import { useUserPreferences } from "@/lib/react-query/user-preferences";
import { useDataContainerBlur } from "@/lib/hooks/useDataContainerBlur";
import {
  WelcomeHeader,
  KeyMetricsCards,
  TrialStatusCard,
  ClientFilterBar,
  UpcomingRenewalsWidget,
  RecentActivityFeed,
  QuickActionButtons,
} from "@/components/dashboard";
import { AddSubscriptionModal } from "@/components/dashboard/AddSubscriptionModal";

export default function DashboardPage() {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddSubscriptionModal, setShowAddSubscriptionModal] = useState(false);

  // Load data using React Query hooks
  const { user, profile, isLoading: userLoading, error: userError } = useUser();
  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useDashboardMetrics();
  const { data: clients = [], isLoading: clientsLoading } = useClients();
  const { data: upcomingRenewals = [], isLoading: renewalsLoading } = useUpcomingRenewals();
  const { data: recentActivity = [], isLoading: activityLoading } = useRecentActivity();
  const { data: userPreferences } = useUserPreferences();

  // Set up blur overlay for dynamic data
  const { dataBlurClass: metricsBlurClass } = useDataContainerBlur({
    queryKeys: ['dashboard', 'metrics'],
    intensity: 'medium'
  });

  const { dataBlurClass: renewalsBlurClass } = useDataContainerBlur({
    queryKeys: ['dashboard', 'renewals'],
    intensity: 'medium'
  });

  const { dataBlurClass: activityBlurClass } = useDataContainerBlur({
    queryKeys: ['dashboard', 'activity'],
    intensity: 'medium'
  });

  // Calculate loading and error states
  const isLoading = userLoading || metricsLoading || clientsLoading || renewalsLoading || activityLoading;
  const hasError = userError || metricsError;

  // Show initial loading state only when no data exists yet
  if (isLoading && !metrics && !user) {
    return (
      <div className="flex-1 w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (hasError && !metrics && !user) {
    return (
      <div className="flex-1 w-full flex items-center justify-center">
        <p className="text-gray-500">Failed to load dashboard data</p>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-8 p-6">
      {/* Static UI Elements - Always Crisp */}
      <WelcomeHeader firstName={profile?.first_name} />

      {/* Trial Status - Static Structure */}
      <TrialStatusCard
        trialEndsAt={profile?.trial_ends_at}
        subscriptionTier={profile?.subscription_tier}
      />

      {/* Key Metrics with Blur Overlay on Data */}
      <div className={metricsBlurClass}>
        {metrics && <KeyMetricsCards metrics={metrics} />}
      </div>

      {/* Client Filter Bar - Static UI */}
      <ClientFilterBar
        clients={clients}
        selectedClientId={selectedClientId}
        onClientChange={setSelectedClientId}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {/* Quick Actions - Static UI */}
      <QuickActionButtons
        userTier={profile?.subscription_tier}
        onAddSubscription={() => setShowAddSubscriptionModal(true)}
        onAddLifetimeDeal={() => console.log('Add lifetime deal')}
        onExportReport={() => console.log('Export report')}
        onInviteTeamMember={() => console.log('Invite team member')}
      />

      {/* Main Content Grid with Selective Blur */}
      <div className="grid gap-8 lg:grid-cols-2">
        <div className={renewalsBlurClass}>
          <UpcomingRenewalsWidget
            subscriptions={upcomingRenewals}
            onViewAll={() => console.log('View all renewals')}
            onMarkAsPaid={(id) => console.log('Mark as paid:', id)}
          />
        </div>
        
        <div className={activityBlurClass}>
          <RecentActivityFeed
            activities={recentActivity}
            maxItems={8}
          />
        </div>
      </div>

      {/* Add Subscription Modal - Static UI */}
      <AddSubscriptionModal
        open={showAddSubscriptionModal}
        onOpenChange={setShowAddSubscriptionModal}
        onSuccess={() => {
          // React Query will automatically refresh data
          setShowAddSubscriptionModal(false);
        }}
        userTier={profile?.subscription_tier}
        userCurrency={profile?.currency_preference}
        userTaxRate={profile?.tax_rate}
        userDateFormat={userPreferences?.date_format_preference || 'US'}
      />
    </div>
  );
}
