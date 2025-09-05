// Updated 2024-12-20: Clients dashboard page with full CRUD functionality
// Implements PRD requirements: client management, cost tracking, export functionality

"use client";

import React, { useState } from 'react';
import { ClientsTable } from '@/components/dashboard/ClientsTable';
import { AddClientModal } from '@/components/dashboard/AddClientModal';
import { EditClientModal } from '@/components/dashboard/EditClientModal';
import { type Client } from '@/lib/react-query/clients';

export default function ClientsPage() {
  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // User role - this would come from auth context in real app
  const userRole = 'admin'; // TODO: Get from auth context
  const userTier = 'business'; // TODO: Get from auth context

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setEditModalOpen(true);
  };

  const handleDuplicateClient = (client: Client) => {
    // Pre-fill the add modal with client data
    setSelectedClient({
      ...client,
      id: '', // Clear ID for duplication
      name: `${client.name} (Copy)`,
    });
    setAddModalOpen(true);
  };

  const handleDeleteClient = (clientId: string) => {
    // The table handles the deletion, we just need to handle any cleanup
    console.log('Client deleted:', clientId);
  };

  const handleModalClose = () => {
    setSelectedClient(null);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <ClientsTable
        userTier={userTier}
        userRole={userRole}
        onEditClient={handleEditClient}
        onDeleteClient={handleDeleteClient}
        onAddClient={() => setAddModalOpen(true)}
        onDuplicateClient={handleDuplicateClient}
        onDataLoaded={(data) => {
          // Handle data loaded for analytics or other purposes
          console.log('Clients loaded:', data);
        }}
      />

      {/* Add Client Modal */}
      <AddClientModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onSuccess={handleModalClose}
      />

      {/* Edit Client Modal */}
      <EditClientModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        client={selectedClient}
        onSuccess={handleModalClose}
      />
    </div>
  );
}
