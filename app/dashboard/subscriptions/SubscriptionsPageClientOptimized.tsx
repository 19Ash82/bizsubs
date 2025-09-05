// Updated 2024-12-20: Optimized SubscriptionsPageClient with React Query
// Eliminates page refreshes and implements PRD performance requirements

"use client";

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, DollarSign, TrendingUp, Calendar, Users, Loader2 } from 'lucide-react';
import { SubscriptionsTableOptimized } from '@/components/dashboard/SubscriptionsTableOptimized';
import { EditSubscriptionModalOptimized } from '@/components/dashboard/EditSubscriptionModalOptimized';
import { AddSubscriptionModalOptimized } from '@/components/dashboard/AddSubscriptionModalOptimized';
import { useSubscriptions, type Subscription } from '@/lib/react-query/subscriptions';
import { useClients } from '@/lib/react-query/clients';

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  company_name: string;
  subscription_tier: string;
  trial_ends_at?: string;
  currency_preference: string;
  tax_rate: number;
}

interface DashboardMetrics {
  totalMonthly: number;
  activeCount: number;
  dueThisWeek: number;
  clientsCount: number;
}

interface SubscriptionsPageClientProps {
  profile: UserProfile;
  userRole: 'admin' | 'member';
}

export function SubscriptionsPageClient({ profile, userRole }: SubscriptionsPageClientProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);

  // React Query hooks for data
  const { data: subscriptions = [], isLoading: subscriptionsLoading } = useSubscriptions();
  const { data: clients = [], isLoading: clientsLoading } = useClients();

  // Calculate metrics from React Query data
  const metrics: DashboardMetrics = useMemo(() => {
    if (subscriptionsLoading || clientsLoading) {
      return { totalMonthly: 0, activeCount: 0, dueThisWeek: 0, clientsCount: 0 };
    }

    const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active');
    
    const totalMonthly = activeSubscriptions.reduce((sum, sub) => {
      const monthlyAmount = calculateMonthlyEquivalent(sub.cost, sub.billing_cycle);
      return sum + monthlyAmount;
    }, 0);

    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
    
    const dueThisWeek = activeSubscriptions.filter(sub => {
      const nextBilling = new Date(sub.next_billing_date);
      return nextBilling <= oneWeekFromNow;
    }).length;

    return {
      totalMonthly,
      activeCount: activeSubscriptions.length,
      dueThisWeek,
      clientsCount: clients.length
    };
  }, [subscriptions, clients, subscriptionsLoading, clientsLoading]);

  // Currency formatting helper
  const formatCurrency = (amount: number, currency: string = profile.currency_preference) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  // Calculate monthly equivalent from billing cycle
  const calculateMonthlyEquivalent = (cost: number, billingCycle: string) => {
    switch (billingCycle) {
      case 'annual':
        return cost / 12;
      case 'quarterly':
        return cost / 3;
      case 'weekly':
        return cost * 4.33;
      case 'monthly':
      default:
        return cost;
    }
  };

  const handleEditSubscription = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setShowEditModal(true);
  };

  const handleDuplicateSubscription = (subscription: Subscription) => {
    // For now, just open the add modal - could be enhanced to pre-populate with subscription data
    setShowAddModal(true);
  };

  const handleModalSuccess = () => {
    // React Query will automatically update the data via cache invalidation
    // No need to manually refresh or refetch
  };

  const isLoading = subscriptionsLoading || clientsLoading;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
          <p className="text-gray-600">
            Manage your business subscriptions and track recurring costs.
          </p>
        </div>
        {userRole === 'admin' && (
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Subscription
          </Button>
        )}
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Recurring</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                formatCurrency(metrics.totalMonthly)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Total monthly recurring revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                metrics.activeCount
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently active services
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                metrics.dueThisWeek
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Renewals in next 7 days
            </p>
            {metrics.dueThisWeek > 0 && !isLoading && (
              <Badge variant="secondary" className="mt-1">
                Action needed
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                metrics.clientsCount
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Clients with subscriptions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trial Status Card */}
      {profile.subscription_tier === 'free' && profile.trial_ends_at && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-800">Free Trial</CardTitle>
            <CardDescription className="text-amber-700">
              Your free trial ends on {new Date(profile.trial_ends_at).toLocaleDateString()}.
              Upgrade to continue tracking unlimited subscriptions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="default" className="bg-amber-600 hover:bg-amber-700">
              Upgrade Now
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Subscriptions</CardTitle>
          <CardDescription>
            View and manage all your business subscriptions with real-time updates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SubscriptionsTableOptimized
            userTier={profile.subscription_tier as 'free' | 'pro' | 'team'}
            userRole={userRole}
            onEditSubscription={handleEditSubscription}
            onAddSubscription={() => setShowAddModal(true)}
            onDuplicateSubscription={handleDuplicateSubscription}
          />
        </CardContent>
      </Card>

      {/* Modals */}
      <AddSubscriptionModalOptimized
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSuccess={handleModalSuccess}
        userTier={profile.subscription_tier as 'free' | 'pro' | 'team'}
        userCurrency={profile.currency_preference}
        userTaxRate={profile.tax_rate}
      />

      <EditSubscriptionModalOptimized
        open={showEditModal}
        onOpenChange={setShowEditModal}
        subscription={selectedSubscription}
        onSuccess={handleModalSuccess}
        userTaxRate={profile.tax_rate}
        userCurrency={profile.currency_preference}
      />
    </div>
  );
}
