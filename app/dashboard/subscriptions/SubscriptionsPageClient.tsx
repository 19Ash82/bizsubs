"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { SubscriptionsTable, EditSubscriptionModal, AddSubscriptionModal } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, DollarSign, TrendingUp, Calendar, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useUserPreferences } from '@/lib/react-query/user-preferences';

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

interface Subscription {
  id: string;
  service_name: string;
  cost: number;
  billing_cycle: 'weekly' | 'monthly' | 'quarterly' | 'annual';
  start_date: string;
  next_billing_date: string;
  category: string;
  status: 'active' | 'cancelled' | 'paused';
  currency: string;
  client_id?: string;
  project_id?: string;
  business_expense: boolean;
  tax_deductible: boolean;
  notes?: string;
  tax_rate?: number;
  created_at: string;
  updated_at: string;
  client?: {
    id: string;
    name: string;
    color_hex: string;
  };
  project?: {
    id: string;
    name: string;
  };
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
  const [refreshKey, setRefreshKey] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState<string | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [subscriptionsToDelete, setSubscriptionsToDelete] = useState<string[]>([]);
  const [subscriptionNamesToDelete, setSubscriptionNamesToDelete] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalMonthly: 0,
    activeCount: 0,
    dueThisWeek: 0,
    clientsCount: 0
  });
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [tableData, setTableData] = useState<{
    clients: Array<{ id: string; name: string; color_hex: string; status: string }>;
    projects: Array<{ id: string; name: string; client_id: string }>;
    subscriptionCount: number;
  } | null>(null);

  // Load user preferences for date format
  const { data: userPreferences } = useUserPreferences();

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

  // Calculate dashboard metrics
  const calculateMetrics = (subscriptions: Subscription[]) => {
    const userCurrency = profile.currency_preference;
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    // Filter active subscriptions in user's currency only
    const activeUserCurrencySubscriptions = subscriptions.filter(sub => 
      sub.status === 'active' && sub.currency === userCurrency
    );

    // 1. Total Monthly: Sum monthly equivalents for active subscriptions in user's currency
    const totalMonthly = activeUserCurrencySubscriptions.reduce((sum, sub) => {
      return sum + calculateMonthlyEquivalent(sub.cost, sub.billing_cycle);
    }, 0);

    // 2. Active: Count active subscriptions in user's currency
    const activeCount = activeUserCurrencySubscriptions.length;

    // 3. Due This Week: Count active subscriptions due within 7 days
    const dueThisWeek = activeUserCurrencySubscriptions.filter(sub => {
      const nextBillingDate = new Date(sub.next_billing_date);
      return nextBillingDate >= today && nextBillingDate <= nextWeek;
    }).length;

    // 4. Clients: Count distinct clients from active subscriptions in user's currency
    const uniqueClients = new Set();
    activeUserCurrencySubscriptions.forEach(sub => {
      if (sub.client?.name) {
        uniqueClients.add(sub.client.name);
      }
    });
    const clientsCount = uniqueClients.size;

    const result = {
      totalMonthly,
      activeCount,
      dueThisWeek,
      clientsCount
    };

    return result;
  };

  // Fetch and calculate metrics
  const fetchMetrics = async () => {
    try {
      setMetricsLoading(true);
      const supabase = createClient();
      
      // Fetch subscriptions with client data
      const { data: subscriptions, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          client:clients(id, name, color_hex)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate metrics from fetched data
      const calculatedMetrics = calculateMetrics(subscriptions || []);
      setMetrics(calculatedMetrics);
      
    } catch (err) {
      console.error('Error fetching metrics:', err);
    } finally {
      setMetricsLoading(false);
    }
  };

  // Fetch metrics on component mount and when refreshKey changes
  React.useEffect(() => {
    fetchMetrics();
  }, [refreshKey, profile.currency_preference]);


  const handleEditSubscription = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setShowEditModal(true);
  };

  const handleDeleteSubscription = async (subscriptionId: string | string[], subscriptionNames?: string[]) => {
    // Handle both single and bulk deletion
    if (Array.isArray(subscriptionId)) {
      // Bulk delete - show beautiful confirmation modal
      setSubscriptionsToDelete(subscriptionId);
      setSubscriptionNamesToDelete(subscriptionNames || []);
      setShowBulkDeleteConfirm(true);
    } else {
      // Single delete - show confirmation dialog
      setSubscriptionToDelete(subscriptionId);
      setShowDeleteConfirm(true);
    }
  };

  // Handle bulk delete confirmation
  const confirmBulkDelete = async () => {
    try {
      const supabase = createClient();
      
      // Get subscription details for logging
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('id, service_name')
        .in('id', subscriptionsToDelete);

      // Delete all subscriptions in a single query for efficiency
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .in('id', subscriptionsToDelete);

      if (error) throw error;

      // Log the activities
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user && subscriptions) {
        const activityLogs = subscriptions.map(subscription => ({
          user_id: userData.user.id,
          user_email: userData.user.email!,
          action_type: 'delete' as const,
          resource_type: 'subscription' as const,
          resource_id: subscription.id,
          description: `Deleted subscription: ${subscription.service_name}`,
        }));

        await supabase.from('activity_logs').insert(activityLogs);
      }

      // Refresh the table and metrics
      setRefreshKey(prev => prev + 1);
      
    } catch (error) {
      console.error('Error deleting subscriptions:', error);
      // TODO: Show error toast
      alert('Failed to delete subscriptions. Please try again.');
    } finally {
      setShowBulkDeleteConfirm(false);
      setSubscriptionsToDelete([]);
      setSubscriptionNamesToDelete([]);
    }
  };

  const confirmDelete = async () => {
    if (!subscriptionToDelete) return;

    try {
      const supabase = createClient();
      
      // Get subscription details for logging
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('service_name')
        .eq('id', subscriptionToDelete)
        .single();

      // Delete the subscription
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', subscriptionToDelete);

      if (error) throw error;

      // Log the activity
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user && subscription) {
        await supabase.from('activity_logs').insert({
          user_id: userData.user.id,
          user_email: userData.user.email!,
          action_type: 'delete',
          resource_type: 'subscription',
          resource_id: subscriptionToDelete,
          description: `Deleted subscription: ${subscription.service_name}`,
        });
      }

      // Refresh the table and metrics - useEffect will handle fetchMetrics
      setRefreshKey(prev => prev + 1);
      
    } catch (error) {
      console.error('Error deleting subscription:', error);
      // TODO: Show error toast
    } finally {
      setShowDeleteConfirm(false);
      setSubscriptionToDelete(null);
    }
  };

  const handleAddSubscription = () => {
    setShowAddModal(true);
  };

  const handleDuplicateSubscription = async (subscription: Subscription) => {
    try {
      const supabase = createClient();
      
      // Get the current user for user_id
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new Error('User not authenticated');
      }

      // Create a copy of the subscription with modified fields
      const duplicatedSubscription = {
        user_id: userData.user.id, // Required field for RLS
        service_name: `${subscription.service_name} (Copy)`,
        cost: subscription.cost,
        billing_cycle: subscription.billing_cycle,
        next_billing_date: subscription.next_billing_date,
        category: subscription.category,
        status: subscription.status,
        currency: subscription.currency,
        client_id: subscription.client_id,
        project_id: subscription.project_id,
        business_expense: subscription.business_expense,
        tax_deductible: subscription.tax_deductible,
        notes: subscription.notes ? `${subscription.notes} (Duplicated)` : null,
        tax_rate: subscription.tax_rate || profile.tax_rate || 30.0, // Use subscription tax rate or user default
      };

      // Insert the duplicated subscription
      const { data: newSubscription, error } = await supabase
        .from('subscriptions')
        .insert(duplicatedSubscription)
        .select()
        .single();

      if (error) {
        console.error('Database error details:', error);
        throw error;
      }

      // Log the activity
      if (newSubscription) {
        await supabase.from('activity_logs').insert({
          user_id: userData.user.id,
          user_email: userData.user.email!,
          action_type: 'create',
          resource_type: 'subscription',
          resource_id: newSubscription.id,
          description: `Duplicated subscription: ${subscription.service_name} → ${duplicatedSubscription.service_name}`,
        });
      }

      // Refresh the table and metrics
      setRefreshKey(prev => prev + 1);
      
    } catch (error) {
      console.error('Error duplicating subscription:', error);
      
      // Show user-friendly error message
      let errorMessage = 'Failed to duplicate subscription. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('not authenticated')) {
          errorMessage = 'Please log in to duplicate subscriptions.';
        } else if (error.message.includes('permission')) {
          errorMessage = 'You don\'t have permission to create subscriptions.';
        }
      }
      
      // For now using alert, but this should be replaced with a proper toast notification
      alert(errorMessage);
    }
  };

  const handleTableDataLoaded = useCallback((data: { clients: any[]; projects: any[]; subscriptionCount: number }) => {
    setTableData(data);
  }, []);

  const handleModalSuccess = () => {
    // Refresh the table data and metrics - useEffect will handle fetchMetrics
    setRefreshKey(prev => prev + 1);
  };

  // Get tier badge color
  const getTierBadgeVariant = (tier: string) => {
    switch (tier) {
      case 'business':
      case 'business_premium':
        return 'default';
      case 'trial':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // Format tier display name
  const formatTierName = (tier: string) => {
    switch (tier) {
      case 'business':
        return 'Business';
      case 'business_premium':
        return 'Business Premium';
      case 'trial':
        return 'Trial';
      case 'free':
        return 'Free';
      default:
        return tier;
    }
  };

  return (
    <div className="flex-1 w-full p-4 sm:p-6 max-w-full overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">Subscriptions</h1>
              <Badge variant={getTierBadgeVariant(profile.subscription_tier)} className="w-fit">
                {formatTierName(profile.subscription_tier)}
              </Badge>
            </div>
            <p className="text-gray-600 text-sm sm:text-base">
              Manage your recurring subscriptions and track costs for {profile.company_name}
            </p>
          </div>
          
          {userRole === 'admin' && (
            <div className="flex-shrink-0">
              <Button 
                onClick={handleAddSubscription}
                className="bg-violet-600 hover:bg-violet-700 w-full sm:w-auto"
                size="lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Subscription
              </Button>
            </div>
          )}
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          <Card className="min-w-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-5 h-5 text-violet-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600">Total Monthly</p>
                  <p className="text-lg font-bold text-gray-900 truncate">
                    {metricsLoading ? 'Loading...' : formatCurrency(metrics.totalMonthly)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="min-w-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-lg font-bold text-gray-900 truncate">
                    {metricsLoading ? 'Loading...' : metrics.activeCount.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="min-w-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-amber-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600">Due This Week</p>
                  <p className="text-lg font-bold text-gray-900 truncate">
                    {metricsLoading ? 'Loading...' : metrics.dueThisWeek.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="min-w-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600">Clients</p>
                  <p className="text-lg font-bold text-gray-900 truncate">
                    {metricsLoading ? 'Loading...' : metrics.clientsCount.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Subscriptions Table */}
        <div className="w-full min-w-0">
          <SubscriptionsTable
            key={refreshKey} // Force refresh when key changes
            userTier={profile.subscription_tier}
            userRole={userRole}
            userDateFormat={userPreferences?.date_format_preference || 'US'}
            onEditSubscription={handleEditSubscription}
            onDeleteSubscription={handleDeleteSubscription}
            onAddSubscription={handleAddSubscription}
            onDuplicateSubscription={handleDuplicateSubscription}
            onDataLoaded={handleTableDataLoaded}
          />
        </div>

        {/* Add Subscription Modal */}
        <AddSubscriptionModal
          open={showAddModal}
          onOpenChange={setShowAddModal}
          onSuccess={handleModalSuccess}
          userTier={profile.subscription_tier}
          userCurrency={profile.currency_preference}
          userTaxRate={profile.tax_rate}
          userDateFormat={userPreferences?.date_format_preference || 'US'}
          preloadedClients={tableData?.clients}
          preloadedProjects={tableData?.projects}
          preloadedSubscriptionCount={tableData?.subscriptionCount}
        />

        {/* Edit Subscription Modal */}
        <EditSubscriptionModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          subscription={selectedSubscription}
          onSuccess={handleModalSuccess}
          userTaxRate={profile.tax_rate}
          userCurrency={profile.currency_preference}
          userDateFormat={userPreferences?.date_format_preference || 'US'}
        />

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-red-600">Delete Subscription</CardTitle>
                <CardDescription>
                  Are you sure you want to delete this subscription? This action cannot be undone.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setSubscriptionToDelete(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDelete}
                >
                  Delete
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Bulk Delete Confirmation Dialog */}
        {showBulkDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-red-600">Delete Subscriptions</CardTitle>
                <CardDescription>
                  Are you sure you want to delete {subscriptionsToDelete.length} subscription{subscriptionsToDelete.length > 1 ? 's' : ''}? This action cannot be undone.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {subscriptionNamesToDelete.length > 0 && (
                  <div className="max-h-32 overflow-y-auto">
                    <p className="text-sm font-medium text-gray-700 mb-2">Subscriptions to delete:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {subscriptionNamesToDelete.map((name, index) => (
                        <li key={index} className="flex items-center">
                          <span className="w-2 h-2 bg-red-400 rounded-full mr-2 flex-shrink-0"></span>
                          {name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowBulkDeleteConfirm(false);
                      setSubscriptionsToDelete([]);
                      setSubscriptionNamesToDelete([]);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={confirmBulkDelete}
                  >
                    Delete {subscriptionsToDelete.length} Subscription{subscriptionsToDelete.length > 1 ? 's' : ''}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
