// Updated 2024-12-19: Complete dashboard with modular components following PRD requirements

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
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

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddSubscriptionModal, setShowAddSubscriptionModal] = useState(false);

  useEffect(() => {
    async function loadDashboardData() {
      const supabase = createClient();
      
      try {
        // Get user profile
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        // Get clients
        const { data: clients } = await supabase
          .from("clients")
          .select("id, name, color_hex")
          .eq("user_id", user.id)
          .eq("status", "active")
          .order("name");

        // Get subscriptions for metrics and upcoming renewals
        const { data: subscriptions } = await supabase
          .from("subscriptions")
          .select(`
            *,
            clients (name, color_hex)
          `)
          .eq("user_id", user.id)
          .eq("status", "active");

        // Get recent activity
        const { data: activities } = await supabase
          .from("activity_logs")
          .select("*")
          .eq("user_id", user.id)
          .order("timestamp", { ascending: false })
          .limit(10);

        // Calculate metrics
        const totalMonthlyRecurring = subscriptions?.reduce((sum, sub) => {
          const monthlyAmount = sub.billing_cycle === 'monthly' ? sub.cost :
                               sub.billing_cycle === 'annual' ? sub.cost / 12 :
                               sub.billing_cycle === 'quarterly' ? sub.cost / 3 :
                               sub.billing_cycle === 'weekly' ? sub.cost * 4.33 : sub.cost;
          return sum + monthlyAmount;
        }, 0) || 0;

        const annualBusinessSpend = subscriptions?.reduce((sum, sub) => {
          const annualAmount = sub.billing_cycle === 'annual' ? sub.cost :
                              sub.billing_cycle === 'monthly' ? sub.cost * 12 :
                              sub.billing_cycle === 'quarterly' ? sub.cost * 4 :
                              sub.billing_cycle === 'weekly' ? sub.cost * 52 : sub.cost * 12;
          return sum + (sub.business_expense ? annualAmount : 0);
        }, 0) || 0;

        const taxDeductibleAmount = subscriptions?.reduce((sum, sub) => {
          const annualAmount = sub.billing_cycle === 'annual' ? sub.cost :
                              sub.billing_cycle === 'monthly' ? sub.cost * 12 :
                              sub.billing_cycle === 'quarterly' ? sub.cost * 4 :
                              sub.billing_cycle === 'weekly' ? sub.cost * 52 : sub.cost * 12;
          return sum + (sub.tax_deductible ? annualAmount : 0);
        }, 0) || 0;

        // Get renewals for this month
        const now = new Date();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const thisMonthRenewals = subscriptions?.reduce((sum, sub) => {
          const renewalDate = new Date(sub.next_billing_date);
          if (renewalDate >= now && renewalDate <= endOfMonth) {
            return sum + sub.cost;
          }
          return sum;
        }, 0) || 0;

        // Get upcoming renewals (next 30 days)
        const next30Days = new Date();
        next30Days.setDate(next30Days.getDate() + 30);
        
        const upcomingRenewals = subscriptions?.filter(sub => {
          const renewalDate = new Date(sub.next_billing_date);
          return renewalDate >= now && renewalDate <= next30Days;
        }).map(sub => ({
          id: sub.id,
          service_name: sub.service_name,
          cost: sub.cost,
          currency: sub.currency,
          next_billing_date: sub.next_billing_date,
          billing_cycle: sub.billing_cycle,
          client_name: sub.clients?.name,
          client_color: sub.clients?.color_hex,
          status: sub.status,
        })).sort((a, b) => new Date(a.next_billing_date).getTime() - new Date(b.next_billing_date).getTime()) || [];

        setData({
          user,
          profile,
          metrics: {
            totalMonthlyRecurring,
            annualBusinessSpend,
            taxDeductibleAmount,
            thisMonthRenewals,
            currency: profile?.currency_preference || 'USD',
          },
          clients: clients || [],
          upcomingRenewals,
          recentActivity: activities || [],
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const handleRefreshData = () => {
    setLoading(true);
    const supabase = createClient();
    
    async function refreshData() {
      try {
        // Get user profile
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        // Get clients
        const { data: clients } = await supabase
          .from("clients")
          .select("id, name, color_hex")
          .eq("user_id", user.id)
          .eq("status", "active")
          .order("name");

        // Get subscriptions for metrics and upcoming renewals
        const { data: subscriptions } = await supabase
          .from("subscriptions")
          .select(`
            *,
            clients (name, color_hex)
          `)
          .eq("user_id", user.id)
          .eq("status", "active");

        // Get recent activity
        const { data: activities } = await supabase
          .from("activity_logs")
          .select("*")
          .eq("user_id", user.id)
          .order("timestamp", { ascending: false })
          .limit(10);

        // Calculate metrics
        const totalMonthlyRecurring = subscriptions?.reduce((sum, sub) => {
          const monthlyAmount = sub.billing_cycle === 'monthly' ? sub.cost :
                               sub.billing_cycle === 'annual' ? sub.cost / 12 :
                               sub.billing_cycle === 'quarterly' ? sub.cost / 3 :
                               sub.billing_cycle === 'weekly' ? sub.cost * 4.33 : sub.cost;
          return sum + monthlyAmount;
        }, 0) || 0;

        const annualBusinessSpend = subscriptions?.reduce((sum, sub) => {
          const annualAmount = sub.billing_cycle === 'annual' ? sub.cost :
                              sub.billing_cycle === 'monthly' ? sub.cost * 12 :
                              sub.billing_cycle === 'quarterly' ? sub.cost * 4 :
                              sub.billing_cycle === 'weekly' ? sub.cost * 52 : sub.cost * 12;
          return sum + (sub.business_expense ? annualAmount : 0);
        }, 0) || 0;

        const taxDeductibleAmount = subscriptions?.reduce((sum, sub) => {
          const annualAmount = sub.billing_cycle === 'annual' ? sub.cost :
                              sub.billing_cycle === 'monthly' ? sub.cost * 12 :
                              sub.billing_cycle === 'quarterly' ? sub.cost * 4 :
                              sub.billing_cycle === 'weekly' ? sub.cost * 52 : sub.cost * 12;
          return sum + (sub.tax_deductible ? annualAmount : 0);
        }, 0) || 0;

        // Get renewals for this month
        const now = new Date();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const thisMonthRenewals = subscriptions?.reduce((sum, sub) => {
          const renewalDate = new Date(sub.next_billing_date);
          if (renewalDate >= now && renewalDate <= endOfMonth) {
            return sum + sub.cost;
          }
          return sum;
        }, 0) || 0;

        // Get upcoming renewals (next 30 days)
        const next30Days = new Date();
        next30Days.setDate(next30Days.getDate() + 30);
        
        const upcomingRenewals = subscriptions?.filter(sub => {
          const renewalDate = new Date(sub.next_billing_date);
          return renewalDate >= now && renewalDate <= next30Days;
        }).map(sub => ({
          id: sub.id,
          service_name: sub.service_name,
          cost: sub.cost,
          currency: sub.currency,
          next_billing_date: sub.next_billing_date,
          billing_cycle: sub.billing_cycle,
          client_name: sub.clients?.name,
          client_color: sub.clients?.color_hex,
          status: sub.status,
        })).sort((a, b) => new Date(a.next_billing_date).getTime() - new Date(b.next_billing_date).getTime()) || [];

        setData({
          user,
          profile,
          metrics: {
            totalMonthlyRecurring,
            annualBusinessSpend,
            taxDeductibleAmount,
            thisMonthRenewals,
            currency: profile?.currency_preference || 'USD',
          },
          clients: clients || [],
          upcomingRenewals,
          recentActivity: activities || [],
        });
      } catch (error) {
        console.error('Error refreshing dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    refreshData();
  };

  if (loading) {
    return (
      <div className="flex-1 w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 w-full flex items-center justify-center">
        <p className="text-gray-500">Failed to load dashboard data</p>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-8 p-6">
      <WelcomeHeader firstName={data.profile?.first_name} />

      {/* Trial Status */}
      <TrialStatusCard
        trialEndsAt={data.profile?.trial_ends_at}
        subscriptionTier={data.profile?.subscription_tier}
      />

      {/* Key Metrics */}
      <KeyMetricsCards metrics={data.metrics} />

      {/* Client Filter Bar */}
      <ClientFilterBar
        clients={data.clients}
        selectedClientId={selectedClientId}
        onClientChange={setSelectedClientId}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {/* Quick Actions */}
      <QuickActionButtons
        userTier={data.profile?.subscription_tier}
        onAddSubscription={() => setShowAddSubscriptionModal(true)}
        onAddLifetimeDeal={() => console.log('Add lifetime deal')}
        onExportReport={() => console.log('Export report')}
        onInviteTeamMember={() => console.log('Invite team member')}
      />

      {/* Main Content Grid */}
      <div className="grid gap-8 lg:grid-cols-2">
        <UpcomingRenewalsWidget
          subscriptions={data.upcomingRenewals}
          onViewAll={() => console.log('View all renewals')}
          onMarkAsPaid={(id) => console.log('Mark as paid:', id)}
        />
        
        <RecentActivityFeed
          activities={data.recentActivity}
          maxItems={8}
        />
      </div>

      {/* Add Subscription Modal */}
      <AddSubscriptionModal
        open={showAddSubscriptionModal}
        onOpenChange={setShowAddSubscriptionModal}
        onSuccess={handleRefreshData}
        userTier={data.profile?.subscription_tier}
        userCurrency={data.profile?.currency_preference}
        userTaxRate={data.profile?.tax_rate}
      />
    </div>
  );
}
