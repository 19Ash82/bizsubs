"use client";

import React, { useState } from 'react';
import { SubscriptionsTable } from './SubscriptionsTable';
import { EditSubscriptionModal } from './EditSubscriptionModal';
import { AddSubscriptionModal } from './AddSubscriptionModal';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface Subscription {
  id: string;
  service_name: string;
  cost: number;
  billing_cycle: 'weekly' | 'monthly' | 'quarterly' | 'annual';
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

interface SubscriptionsTableDemoProps {
  userTier?: string;
  userRole?: 'admin' | 'member';
  userCurrency?: string;
  userTaxRate?: number;
}

/**
 * Demo component showing how to use the SubscriptionsTable with modals
 * This demonstrates the complete subscription management workflow
 */
export function SubscriptionsTableDemo({
  userTier = 'free',
  userRole = 'admin',
  userCurrency = 'USD',
  userTaxRate = 30.0
}: SubscriptionsTableDemoProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEditSubscription = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setShowEditModal(true);
  };

  const handleDeleteSubscription = (subscriptionId: string) => {
    // TODO: Implement delete confirmation dialog
    console.log('Delete subscription:', subscriptionId);
  };

  const handleAddSubscription = () => {
    setShowAddModal(true);
  };

  const handleModalSuccess = () => {
    // Refresh the table data
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
          <p className="text-gray-600">Manage your recurring subscriptions and track costs</p>
        </div>
        
        {userRole === 'admin' && (
          <Button 
            onClick={handleAddSubscription}
            className="bg-violet-600 hover:bg-violet-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Subscription
          </Button>
        )}
      </div>

      {/* Subscriptions Table */}
      <SubscriptionsTable
        key={refreshKey} // Force refresh when key changes
        userTier={userTier}
        userRole={userRole}
        onEditSubscription={handleEditSubscription}
        onDeleteSubscription={handleDeleteSubscription}
        onAddSubscription={handleAddSubscription}
      />

      {/* Add Subscription Modal */}
      <AddSubscriptionModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSuccess={handleModalSuccess}
        userTier={userTier}
        userCurrency={userCurrency}
        userTaxRate={userTaxRate}
      />

      {/* Edit Subscription Modal */}
      <EditSubscriptionModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        subscription={selectedSubscription}
        onSuccess={handleModalSuccess}
        userTaxRate={userTaxRate}
        userCurrency={userCurrency}
      />
    </div>
  );
}
