"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * Demo component showing how dashboard metrics are calculated
 * This demonstrates the currency filtering and calculation logic
 */
export function MetricsCalculationDemo() {
  // Mock data for demonstration
  const mockSubscriptions = [
    {
      id: '1',
      service_name: 'Figma Pro',
      cost: 12,
      billing_cycle: 'monthly',
      status: 'active',
      currency: 'USD',
      next_billing_date: '2024-01-05',
      client: { name: 'Acme Corp' }
    },
    {
      id: '2',
      service_name: 'Adobe Creative Suite',
      cost: 240,
      billing_cycle: 'annual',
      status: 'active',
      currency: 'USD',
      next_billing_date: '2024-01-03',
      client: { name: 'Beta Solutions' }
    },
    {
      id: '3',
      service_name: 'Sketch',
      cost: 99,
      billing_cycle: 'annual',
      status: 'active',
      currency: 'EUR', // Different currency - should be excluded
      next_billing_date: '2024-01-04',
      client: { name: 'Gamma Inc' }
    },
    {
      id: '4',
      service_name: 'Slack Pro',
      cost: 6.67,
      billing_cycle: 'monthly',
      status: 'cancelled', // Cancelled - should be excluded
      currency: 'USD',
      next_billing_date: '2024-01-06',
      client: { name: 'Acme Corp' }
    },
    {
      id: '5',
      service_name: 'GitHub Enterprise',
      cost: 4,
      billing_cycle: 'monthly',
      status: 'active',
      currency: 'USD',
      next_billing_date: '2024-01-10', // Outside 7-day window
      client: { name: 'Beta Solutions' }
    }
  ];

  const userCurrencyPreference = 'USD';

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

  // Filter active subscriptions in user's currency only
  const activeUserCurrencySubscriptions = mockSubscriptions.filter(sub => 
    sub.status === 'active' && sub.currency === userCurrencyPreference
  );

  // Calculate metrics
  const today = new Date('2024-01-01'); // Mock today date
  const nextWeek = new Date('2024-01-08'); // 7 days from today

  const totalMonthly = activeUserCurrencySubscriptions.reduce((sum, sub) => {
    return sum + calculateMonthlyEquivalent(sub.cost, sub.billing_cycle);
  }, 0);

  const activeCount = activeUserCurrencySubscriptions.length;

  const dueThisWeek = activeUserCurrencySubscriptions.filter(sub => {
    const nextBillingDate = new Date(sub.next_billing_date);
    return nextBillingDate >= today && nextBillingDate <= nextWeek;
  }).length;

  const uniqueClients = new Set();
  activeUserCurrencySubscriptions.forEach(sub => {
    if (sub.client?.name) {
      uniqueClients.add(sub.client.name);
    }
  });
  const clientsCount = uniqueClients.size;

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Dashboard Metrics Calculation Demo</h2>
        <p className="text-gray-600">
          Shows how metrics are calculated using currency preference filtering
        </p>
      </div>

      {/* User Settings */}
      <Card>
        <CardHeader>
          <CardTitle>User Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Currency Preference:</span>
            <Badge className="bg-blue-500">{userCurrencyPreference}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Sample Data */}
      <Card>
        <CardHeader>
          <CardTitle>Sample Subscriptions Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockSubscriptions.map((sub, index) => (
              <div key={sub.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{sub.service_name}</span>
                  <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>
                    {sub.status}
                  </Badge>
                  <Badge variant="outline">{sub.currency}</Badge>
                  <Badge variant="outline">{sub.billing_cycle}</Badge>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatCurrency(sub.cost, sub.currency)}</div>
                  <div className="text-xs text-gray-500">Due: {sub.next_billing_date}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filtering Logic */}
      <Card>
        <CardHeader>
          <CardTitle>Filtering Logic</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Active Subscriptions in User Currency ({userCurrencyPreference})</h4>
              <div className="space-y-2">
                {activeUserCurrencySubscriptions.map(sub => (
                  <div key={sub.id} className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
                    <span className="text-sm">{sub.service_name}</span>
                    <span className="text-sm font-medium">{formatCurrency(sub.cost)} ({sub.billing_cycle})</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Excluded: Sketch (EUR currency), Slack Pro (cancelled status)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calculated Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Calculated Dashboard Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-violet-50 border border-violet-200 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Total Monthly</div>
              <div className="text-xl font-bold text-violet-600">{formatCurrency(totalMonthly)}</div>
              <div className="text-xs text-gray-500 mt-1">
                $12 + $20 (240÷12) + $4 = $36
              </div>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Active Count</div>
              <div className="text-xl font-bold text-emerald-600">{activeCount}</div>
              <div className="text-xs text-gray-500 mt-1">
                Active USD subscriptions only
              </div>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Due This Week</div>
              <div className="text-xl font-bold text-amber-600">{dueThisWeek}</div>
              <div className="text-xs text-gray-500 mt-1">
                Due between Jan 1-8, 2024
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Unique Clients</div>
              <div className="text-xl font-bold text-blue-600">{clientsCount}</div>
              <div className="text-xs text-gray-500 mt-1">
                Acme Corp, Beta Solutions
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calculation Details */}
      <Card>
        <CardHeader>
          <CardTitle>Calculation Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-900">1. Total Monthly Calculation</h4>
              <ul className="list-disc list-inside text-gray-600 mt-1 space-y-1">
                <li>Figma Pro: $12 (monthly) → $12</li>
                <li>Adobe Creative Suite: $240 (annual) → $240 ÷ 12 = $20</li>
                <li>GitHub Enterprise: $4 (monthly) → $4</li>
                <li><strong>Total: $12 + $20 + $4 = $36</strong></li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-900">2. Currency Filtering</h4>
              <ul className="list-disc list-inside text-gray-600 mt-1 space-y-1">
                <li>✅ Include: All USD subscriptions</li>
                <li>❌ Exclude: Sketch (EUR currency)</li>
                <li>❌ Exclude: Cancelled subscriptions</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-900">3. Date Range Filtering</h4>
              <ul className="list-disc list-inside text-gray-600 mt-1 space-y-1">
                <li>✅ Adobe (Jan 3): Within 7 days</li>
                <li>✅ Figma (Jan 5): Within 7 days</li>
                <li>❌ GitHub (Jan 10): Outside 7-day window</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
