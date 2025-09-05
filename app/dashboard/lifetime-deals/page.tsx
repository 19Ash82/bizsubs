// Updated 2024-12-20: Lifetime Deals Dashboard Page with Portfolio Overview
// Implements PRD specifications with optimistic updates and real-time calculations

"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Package,
  BarChart3,
  PieChart,
  Calendar,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { LifetimeDealsTable } from '@/components/dashboard/LifetimeDealsTable';
import { AddLifetimeDealModal } from '@/components/dashboard/AddLifetimeDealModal';
import { EditLifetimeDealModal } from '@/components/dashboard/EditLifetimeDealModal';
import { useLifetimeDealsPortfolio, type LifetimeDeal } from '@/lib/react-query/lifetime-deals';
import { createClient } from '@/lib/supabase/client';

interface PortfolioMetricsProps {
  totalInvested: number;
  totalResold: number;
  realizedGains: number;
  activeDealsValue: number;
  totalDeals: number;
  activeDeals: number;
  resoldDeals: number;
  currency: string;
}

const PortfolioMetrics = ({
  totalInvested,
  totalResold,
  realizedGains,
  activeDealsValue,
  totalDeals,
  activeDeals,
  resoldDeals,
  currency
}: PortfolioMetricsProps) => {
  const formatCurrency = (amount: number) => {
    const symbols: Record<string, string> = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'CAD': '$'
    };
    return `${symbols[currency] || '$'}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const realizedROI = totalInvested > 0 ? ((realizedGains / totalInvested) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total Invested */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalInvested)}</div>
          <p className="text-xs text-muted-foreground">
            {totalDeals} lifetime {totalDeals === 1 ? 'deal' : 'deals'}
          </p>
        </CardContent>
      </Card>

      {/* Active Deals Value */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Portfolio</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(activeDealsValue)}</div>
          <p className="text-xs text-muted-foreground">
            {activeDeals} active {activeDeals === 1 ? 'deal' : 'deals'}
          </p>
        </CardContent>
      </Card>

      {/* Realized Gains */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Realized P&L</CardTitle>
          {realizedGains >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${realizedGains >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {realizedGains >= 0 ? '+' : ''}{formatCurrency(realizedGains)}
          </div>
          <p className="text-xs text-muted-foreground">
            {resoldDeals} resold {resoldDeals === 1 ? 'deal' : 'deals'}
          </p>
        </CardContent>
      </Card>

      {/* ROI */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Realized ROI</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${realizedROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {realizedROI >= 0 ? '+' : ''}{realizedROI.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">
            From resold deals only
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default function LifetimeDealsPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedLifetimeDeal, setSelectedLifetimeDeal] = useState<LifetimeDeal | null>(null);
  const [userTier, setUserTier] = useState<'free' | 'pro' | 'team'>('free');
  const [userRole, setUserRole] = useState<'admin' | 'member'>('admin');
  const [userCurrency, setUserCurrency] = useState('USD');
  const [userTaxRate, setUserTaxRate] = useState(30.0);
  const [tableData, setTableData] = useState<{
    clients: any[];
    projects: any[];
    lifetimeDealCount: number;
  } | null>(null);

  // Portfolio data
  const { 
    data: portfolioData, 
    isLoading: portfolioLoading, 
    error: portfolioError 
  } = useLifetimeDealsPortfolio();

  // Load user data
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('subscription_tier, currency_preference, tax_rate')
        .eq('id', user.id)
        .single();

      if (userData) {
        setUserTier(userData.subscription_tier || 'free');
        setUserCurrency(userData.currency_preference || 'USD');
        setUserTaxRate(userData.tax_rate || 30.0);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleAddLifetimeDeal = () => {
    setShowAddModal(true);
  };

  const handleEditLifetimeDeal = (lifetimeDeal: LifetimeDeal) => {
    setSelectedLifetimeDeal(lifetimeDeal);
    setShowEditModal(true);
  };

  const handleDuplicateLifetimeDeal = (lifetimeDeal: LifetimeDeal) => {
    // For now, just open add modal - could pre-populate with deal data
    setShowAddModal(true);
  };

  const handleDataLoaded = (data: { clients: any[], projects: any[], lifetimeDealCount: number }) => {
    setTableData(data);
  };

  const handleAddSuccess = () => {
    // Modal will close automatically, data will refresh via React Query
  };

  const handleEditSuccess = () => {
    // Modal will close automatically, data will refresh via React Query
  };

  if (portfolioError) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Portfolio</h3>
            <p className="text-gray-600">
              Failed to load portfolio data. Please try again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lifetime Deals</h1>
          <p className="text-muted-foreground">
            Track your lifetime deal purchases and portfolio performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          {userTier === 'free' && tableData && (
            <Badge variant="secondary" className="text-xs">
              {tableData.lifetimeDealCount}/3 Free Plan
            </Badge>
          )}
          <Button onClick={handleAddLifetimeDeal} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Lifetime Deal
          </Button>
        </div>
      </div>

      {/* Portfolio Overview */}
      {portfolioLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse w-20 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : portfolioData ? (
        <PortfolioMetrics
          totalInvested={portfolioData.totalInvested}
          totalResold={portfolioData.totalResold}
          realizedGains={portfolioData.realizedGains}
          activeDealsValue={portfolioData.activeDealsValue}
          totalDeals={portfolioData.totalDeals}
          activeDeals={portfolioData.activeDeals}
          resoldDeals={portfolioData.resoldDeals}
          currency={userCurrency}
        />
      ) : null}

      {/* Lifetime Deals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Lifetime Deals</CardTitle>
        </CardHeader>
        <CardContent>
          <LifetimeDealsTable
            key={tableData?.lifetimeDealCount} // Force re-render when count changes
            userTier={userTier}
            userRole={userRole}
            onEditLifetimeDeal={handleEditLifetimeDeal}
            onAddLifetimeDeal={handleAddLifetimeDeal}
            onDuplicateLifetimeDeal={handleDuplicateLifetimeDeal}
            onDataLoaded={handleDataLoaded}
          />
        </CardContent>
      </Card>

      {/* Modals */}
      <AddLifetimeDealModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSuccess={handleAddSuccess}
        userTier={userTier}
        userCurrency={userCurrency}
        userTaxRate={userTaxRate}
        preloadedClients={tableData?.clients}
        preloadedProjects={tableData?.projects}
        preloadedLifetimeDealCount={tableData?.lifetimeDealCount}
      />

      <EditLifetimeDealModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        lifetimeDeal={selectedLifetimeDeal}
        onSuccess={handleEditSuccess}
        userCurrency={userCurrency}
        userTaxRate={userTaxRate}
      />
    </div>
  );
}
