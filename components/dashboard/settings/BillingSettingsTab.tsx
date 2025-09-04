// Updated 2024-12-19: Created BillingSettingsTab component for subscription and billing management

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  company_name: string;
  subscription_tier: string;
  currency_preference: string;
  financial_year_end: string;
  tax_rate: number;
}

interface BillingHistory {
  id: string;
  amount: number;
  currency: string;
  description: string;
  status: 'paid' | 'pending' | 'failed';
  created_at: string;
}

interface BillingSettingsTabProps {
  profile: UserProfile;
}

export function BillingSettingsTab({ profile }: BillingSettingsTabProps) {
  const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadBillingHistory();
  }, []);

  const loadBillingHistory = async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      // This would typically fetch from a billing_history table
      // For now, we'll create mock data
      const mockBillingHistory: BillingHistory[] = [
        {
          id: '1',
          amount: 29.99,
          currency: 'USD',
          description: 'BizSubs Business Plan - Monthly',
          status: 'paid',
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          amount: 29.99,
          currency: 'USD',
          description: 'BizSubs Business Plan - Monthly',
          status: 'paid',
          created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      setBillingHistory(mockBillingHistory);
    } catch (error: any) {
      console.error('Error loading billing history:', error);
      setMessage({
        type: 'error',
        text: 'Failed to load billing history.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePaymentMethod = () => {
    // This would integrate with Stripe or another payment processor
    setMessage({
      type: 'success',
      text: 'Payment method update feature coming soon!'
    });
  };

  const handleCancelSubscription = () => {
    if (!confirm('Are you sure you want to cancel your subscription? This action cannot be undone.')) {
      return;
    }

    // This would handle subscription cancellation
    setMessage({
      type: 'success',
      text: 'Subscription cancellation feature coming soon!'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-100 text-green-800">Paid</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getPlanName = (tier: string) => {
    switch (tier) {
      case 'free':
        return 'Free Plan';
      case 'business':
        return 'Business Plan';
      case 'business_premium':
        return 'Business Premium Plan';
      default:
        return 'Unknown Plan';
    }
  };

  const getPlanPrice = (tier: string) => {
    switch (tier) {
      case 'free':
        return '$0/month';
      case 'business':
        return '$29.99/month';
      case 'business_premium':
        return '$49.99/month';
      default:
        return 'Contact us';
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            Your current subscription details and billing information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-semibold text-lg">{getPlanName(profile.subscription_tier)}</h3>
                <p className="text-gray-600">{getPlanPrice(profile.subscription_tier)}</p>
                <Badge variant="default" className="mt-2">Active</Badge>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Next billing date</p>
                <p className="font-medium">
                  {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </p>
              </div>
            </div>

            {profile.subscription_tier !== 'free' && (
              <div className="flex gap-3">
                <Button onClick={handleUpdatePaymentMethod} variant="outline">
                  Update Payment Method
                </Button>
                <Button 
                  onClick={handleCancelSubscription} 
                  variant="outline"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Cancel Subscription
                </Button>
              </div>
            )}

            {profile.subscription_tier === 'free' && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Upgrade to Business</h4>
                <p className="text-sm text-blue-700 mb-3">
                  Unlock unlimited subscriptions, team features, and advanced reporting.
                </p>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Upgrade Now
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>
            Manage your payment methods and billing information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {profile.subscription_tier === 'free' ? (
            <p className="text-gray-500">No payment method required for free plan.</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-600">CARD</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium">•••• •••• •••• 4242</p>
                  <p className="text-sm text-gray-500">Expires 12/2025</p>
                </div>
                <Badge variant="default">Default</Badge>
              </div>
              <Button variant="outline" onClick={handleUpdatePaymentMethod}>
                Update Payment Method
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>
            View your past invoices and payment history.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : billingHistory.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No billing history available.
            </p>
          ) : (
            <div className="space-y-3">
              {billingHistory.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{item.description}</p>
                    <p className="text-sm text-gray-500">{formatDate(item.created_at)}</p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <p className="font-medium">{formatCurrency(item.amount, item.currency)}</p>
                      {getStatusBadge(item.status)}
                    </div>
                    <Button variant="outline" size="sm">
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {message && (
        <div className={`p-3 rounded-md text-sm ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}
    </div>
  );
}
