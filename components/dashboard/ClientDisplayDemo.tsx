"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Client display component with "Client A +3 more" pattern
const ClientDisplay = ({ 
  clients, 
  maxDisplay = 1 
}: { 
  clients: Array<{ id: string; name: string; color_hex: string }>;
  maxDisplay?: number;
}) => {
  if (!clients || clients.length === 0) {
    return <span className="text-gray-400 text-sm">-</span>;
  }

  const displayClients = clients.slice(0, maxDisplay);
  const remainingCount = clients.length - maxDisplay;

  return (
    <div className="flex items-center gap-2 min-w-0">
      {displayClients.map((client, index) => (
        <div key={client.id} className="flex items-center gap-1.5 min-w-0">
          <div 
            className="w-3 h-3 rounded-full flex-shrink-0" 
            style={{ backgroundColor: client.color_hex }}
          />
          <span className="text-sm truncate">{client.name}</span>
        </div>
      ))}
      {remainingCount > 0 && (
        <span className="text-sm text-gray-500 flex-shrink-0">
          +{remainingCount} more
        </span>
      )}
    </div>
  );
};

/**
 * Demo component showing the client display patterns
 * This demonstrates how the "Client A +3 more" pattern works
 */
export function ClientDisplayDemo() {
  const mockClients = [
    { id: '1', name: 'Acme Corp', color_hex: '#ef4444' },
    { id: '2', name: 'Beta Solutions', color_hex: '#3b82f6' },
    { id: '3', name: 'Gamma Industries', color_hex: '#10b981' },
    { id: '4', name: 'Delta Enterprises', color_hex: '#f59e0b' },
    { id: '5', name: 'Epsilon Technologies', color_hex: '#8b5cf6' },
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Client Display Pattern Examples</h2>
        <p className="text-gray-600">
          Demonstrates how clients are displayed in the subscriptions table
        </p>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Single Client</CardTitle>
          </CardHeader>
          <CardContent>
            <ClientDisplay clients={[mockClients[0]]} maxDisplay={1} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Multiple Clients (2 total)</CardTitle>
          </CardHeader>
          <CardContent>
            <ClientDisplay clients={mockClients.slice(0, 2)} maxDisplay={1} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Multiple Clients (3 total)</CardTitle>
          </CardHeader>
          <CardContent>
            <ClientDisplay clients={mockClients.slice(0, 3)} maxDisplay={1} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Multiple Clients (5 total)</CardTitle>
          </CardHeader>
          <CardContent>
            <ClientDisplay clients={mockClients} maxDisplay={1} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Show First 2 Clients (5 total)</CardTitle>
          </CardHeader>
          <CardContent>
            <ClientDisplay clients={mockClients} maxDisplay={2} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">No Clients Assigned</CardTitle>
          </CardHeader>
          <CardContent>
            <ClientDisplay clients={[]} maxDisplay={1} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
