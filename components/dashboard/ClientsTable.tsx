// Updated 2024-12-20: ClientsTable with React Query optimistic updates
// Implements PRD requirements: client cost tracking, color coding, export functionality

"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TableBody,
} from '@/components/ui/table';
import {
  StandardizedTable,
  StandardizedTableHeader,
  StandardizedTableRow,
  StandardizedTableHead,
  StandardizedTableCell,
  StandardizedCheckboxCell,
  StandardizedActionCell,
  StandardizedBulkToolbar,
  STANDARDIZED_STYLES,
} from './StandardizedTable';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Copy, 
  Trash2, 
  Users,
  DollarSign,
  Building,
  Mail,
  Loader2,
  AlertCircle,
  Plus,
  Download,
  Star
} from 'lucide-react';
import { useClientsWithCosts, useDeleteClient, useExportClients, type Client } from '@/lib/react-query/clients';
import { useDataContainerBlur } from '@/lib/hooks/useDataContainerBlur';
import { cn } from '@/lib/utils';

// Types
type SortField = 'name' | 'email' | 'status' | 'monthly_cost' | 'annual_cost' | 'subscription_count' | 'lifetime_deal_count' | 'created_at';
type SortDirection = 'asc' | 'desc';

interface ClientsTableProps {
  userTier?: string;
  userRole?: 'admin' | 'member';
  onEditClient?: (client: Client) => void;
  onDeleteClient?: (clientId: string) => void;
  onAddClient?: () => void;
  onDuplicateClient?: (client: Client) => void;
  onDataLoaded?: (data: { clients: Client[]; clientCount: number }) => void;
}

// Helper function to format currency
const formatCurrency = (amount: number, currency: string = 'USD') => {
  const currencySymbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    CAD: 'C$',
  };
  
  const symbol = currencySymbols[currency] || '$';
  return `${symbol}${amount.toFixed(2)}`;
};

// Helper function to get status color
const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-emerald-500/10 text-emerald-600 border-emerald-200';
    case 'inactive':
      return 'bg-slate-500/10 text-slate-600 border-slate-200';
    default:
      return 'bg-slate-500/10 text-slate-600 border-slate-200';
  }
};

// Mobile client card component
const MobileClientCard = ({ 
  client, 
  onEdit, 
  onDelete, 
  onDuplicate,
  userRole,
  isSelected,
  onSelect
}: {
  client: Client;
  onEdit?: (client: Client) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (client: Client) => void;
  userRole?: 'admin' | 'member';
  isSelected: boolean;
  onSelect: (id: string, selected: boolean) => void;
}) => {
  const deleteClientMutation = useDeleteClient();

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${client.name}"? This will remove the client from all subscriptions and lifetime deals.`)) {
      try {
        await deleteClientMutation.mutateAsync(client.id);
        onDelete?.(client.id);
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            {userRole === 'admin' && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onSelect(client.id, !!checked)}
                onClick={(e) => e.stopPropagation()}
              />
            )}
            <div 
              className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: client.color_hex }}
              title="Client color"
            />
            <div>
              <h3 className="font-semibold text-slate-900">{client.name}</h3>
              {client.email && (
                <p className="text-sm text-slate-600 flex items-center mt-1">
                  <Mail className="w-3 h-3 mr-1" />
                  {client.email}
                </p>
              )}
            </div>
          </div>
          
          {userRole === 'admin' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(client)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate?.(client)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-red-600"
                  disabled={deleteClientMutation.isPending}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {deleteClientMutation.isPending ? 'Deleting...' : 'Delete'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-500">Status</span>
            <Badge className={cn("ml-2", getStatusColor(client.status))}>
              {client.status}
            </Badge>
          </div>
          <div>
            <span className="text-slate-500">Subscriptions</span>
            <span className="ml-2 font-medium">{client.subscription_count || 0}</span>
          </div>
          <div>
            <span className="text-slate-500">Lifetime Deals</span>
            <span className="ml-2 font-medium">{client.lifetime_deal_count || 0}</span>
          </div>
          <div>
            <span className="text-slate-500">Monthly Cost</span>
            <span className="ml-2 font-medium text-violet-600">
              {formatCurrency(client.monthly_cost || 0)}
            </span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-200">
          <div className="text-sm">
            <span className="text-slate-500">Annual Cost: </span>
            <span className="font-medium text-violet-600">
              {formatCurrency(client.annual_cost || 0)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export function ClientsTable({
  userTier = 'free',
  userRole = 'admin',
  onEditClient,
  onDeleteClient,
  onAddClient,
  onDuplicateClient,
  onDataLoaded = () => {}
}: ClientsTableProps) {
  // Table state
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const hasNotifiedParent = useRef(false);

  // React Query hooks for data fetching
  const { data: clients = [], isLoading, error } = useClientsWithCosts({
    status: statusFilter,
  });
  
  // Set up blur overlay for table data
  const { dataBlurClass } = useDataContainerBlur({
    queryKeys: ['clients'],
    intensity: 'medium'
  });
  
  // Delete mutation
  const deleteClientMutation = useDeleteClient();
  const exportClientsMutation = useExportClients();

  // Notify parent when data is loaded
  useEffect(() => {
    if (!isLoading && clients.length >= 0 && !hasNotifiedParent.current) {
      hasNotifiedParent.current = true;
      const tableData = {
        clients,
        clientCount: clients.length
      };
      onDataLoaded(tableData);
    }
  }, [isLoading, clients, onDataLoaded]);

  // Reset notification flag when component mounts
  useEffect(() => {
    hasNotifiedParent.current = false;
  }, []);

  // Filter and sort clients
  const filteredAndSortedClients = React.useMemo(() => {
    let filtered = clients.filter(client => {
      const matchesSearch = searchQuery === '' || 
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (client.email && client.email.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';

      // Convert to comparable types
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toString().toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [clients, searchQuery, statusFilter, sortField, sortDirection]);

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle selection
  const handleSelectClient = (clientId: string, selected: boolean) => {
    const newSelected = new Set(selectedClients);
    if (selected) {
      newSelected.add(clientId);
    } else {
      newSelected.delete(clientId);
    }
    setSelectedClients(newSelected);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedClients(new Set(filteredAndSortedClients.map(client => client.id)));
    } else {
      setSelectedClients(new Set());
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedClients.size === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedClients.size} client(s)? This will remove them from all subscriptions and lifetime deals.`)) {
      try {
        await Promise.all(
          Array.from(selectedClients).map(id => deleteClientMutation.mutateAsync(id))
        );
        setSelectedClients(new Set());
      } catch (error) {
        console.error('Bulk delete failed:', error);
      }
    }
  };

  // Handle delete
  const handleDelete = async (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (window.confirm(`Are you sure you want to delete "${client?.name}"? This will remove the client from all subscriptions and lifetime deals.`)) {
      try {
        await deleteClientMutation.mutateAsync(clientId);
        onDeleteClient?.(clientId);
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
  };

  // Handle export
  const handleExport = (format: 'csv' | 'json' = 'csv') => {
    exportClientsMutation.mutate(format);
  };


  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Failed to load clients</h3>
        <p className="text-slate-600 text-center mb-4">
          {error instanceof Error ? error.message : 'An unexpected error occurred'}
        </p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Clients</h2>
          <p className="text-slate-600">Manage your clients and track their costs</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('csv')}
            disabled={exportClientsMutation.isPending}
            className="hidden sm:flex"
          >
            {exportClientsMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export
          </Button>
          
          {userRole === 'admin' && (
            <Button onClick={onAddClient} className="bg-violet-600 hover:bg-violet-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk actions */}
      {userRole === 'admin' && selectedClients.size > 0 && (
        <StandardizedBulkToolbar
          selectedCount={selectedClients.size}
          onClearSelection={() => setSelectedClients(new Set())}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkDelete}
            disabled={deleteClientMutation.isPending}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Selected
          </Button>
        </StandardizedBulkToolbar>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredAndSortedClients.length === 0 && searchQuery === '' && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No clients yet</h3>
          <p className="text-slate-600 mb-4">
            Start by adding your first client to organize your subscriptions and track costs.
          </p>
          {userRole === 'admin' && (
            <Button onClick={onAddClient} className="bg-violet-600 hover:bg-violet-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Client
            </Button>
          )}
        </div>
      )}

      {/* No Search Results */}
      {!isLoading && filteredAndSortedClients.length === 0 && searchQuery !== '' && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No clients found</h3>
          <p className="text-slate-600 mb-4">
            Try adjusting your search or filter criteria.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}

      {/* Desktop Table */}
      {!isLoading && filteredAndSortedClients.length > 0 && (
        <>
          <div className="hidden md:block">
            <StandardizedTable>
              <StandardizedTableHeader>
                <StandardizedTableRow>
                  {userRole === 'admin' && (
                    <StandardizedTableHead width="checkbox">
                      <Checkbox
                        checked={selectedClients.size === filteredAndSortedClients.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </StandardizedTableHead>
                  )}
                  <StandardizedTableHead
                    width="large"
                    sortable
                    sortDirection={sortField === 'name' ? sortDirection : null}
                    onSort={() => handleSort('name')}
                  >
                    Client
                  </StandardizedTableHead>
                  <StandardizedTableHead
                    width="medium"
                    sortable
                    sortDirection={sortField === 'email' ? sortDirection : null}
                    onSort={() => handleSort('email')}
                  >
                    Email
                  </StandardizedTableHead>
                  <StandardizedTableHead
                    width="small"
                    sortable
                    sortDirection={sortField === 'status' ? sortDirection : null}
                    onSort={() => handleSort('status')}
                  >
                    Status
                  </StandardizedTableHead>
                  <StandardizedTableHead
                    width="small"
                    sortable
                    sortDirection={sortField === 'subscription_count' ? sortDirection : null}
                    onSort={() => handleSort('subscription_count')}
                  >
                    Subscriptions
                  </StandardizedTableHead>
                  <StandardizedTableHead
                    width="small"
                    sortable
                    sortDirection={sortField === 'lifetime_deal_count' ? sortDirection : null}
                    onSort={() => handleSort('lifetime_deal_count')}
                  >
                    Lifetime Deals
                  </StandardizedTableHead>
                  <StandardizedTableHead
                    width="medium"
                    sortable
                    sortDirection={sortField === 'monthly_cost' ? sortDirection : null}
                    onSort={() => handleSort('monthly_cost')}
                  >
                    Monthly Cost
                  </StandardizedTableHead>
                  <StandardizedTableHead
                    width="medium"
                    sortable
                    sortDirection={sortField === 'annual_cost' ? sortDirection : null}
                    onSort={() => handleSort('annual_cost')}
                  >
                    Annual Cost
                  </StandardizedTableHead>
                  {userRole === 'admin' && <StandardizedTableHead width="action"></StandardizedTableHead>}
                </StandardizedTableRow>
              </StandardizedTableHeader>
              <TableBody className={dataBlurClass}>
                {filteredAndSortedClients.map((client) => (
                  <StandardizedTableRow key={client.id}>
                    {userRole === 'admin' && (
                      <StandardizedCheckboxCell
                        checked={selectedClients.has(client.id)}
                        onCheckedChange={(checked) => handleSelectClient(client.id, !!checked)}
                      />
                    )}
                    <StandardizedTableCell>
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: client.color_hex }}
                          title="Client color"
                        />
                        <div className="font-semibold">{client.name}</div>
                      </div>
                    </StandardizedTableCell>
                    <StandardizedTableCell>
                      {client.email ? (
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 mr-2" />
                          {client.email}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </StandardizedTableCell>
                    <StandardizedTableCell>
                      <Badge className={cn(getStatusColor(client.status))}>
                        {client.status}
                      </Badge>
                    </StandardizedTableCell>
                    <StandardizedTableCell>
                      <div className="flex items-center">
                        <Building className="w-4 h-4 mr-2 text-muted-foreground" />
                        {client.subscription_count || 0}
                      </div>
                    </StandardizedTableCell>
                    <StandardizedTableCell>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 mr-2 text-muted-foreground" />
                        {client.lifetime_deal_count || 0}
                      </div>
                    </StandardizedTableCell>
                    <StandardizedTableCell variant="numeric">
                      <div className="flex items-center justify-end font-medium text-violet-600">
                        <DollarSign className="w-4 h-4 mr-1" />
                        {formatCurrency(client.monthly_cost || 0)}
                      </div>
                    </StandardizedTableCell>
                    <StandardizedTableCell variant="numeric">
                      <div className="flex items-center justify-end font-medium text-violet-600">
                        <DollarSign className="w-4 h-4 mr-1" />
                        {formatCurrency(client.annual_cost || 0)}
                      </div>
                    </StandardizedTableCell>
                    {userRole === 'admin' && (
                      <StandardizedActionCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className={STANDARDIZED_STYLES.ACTION_BUTTON}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEditClient?.(client)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDuplicateClient?.(client)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(client.id)}
                              className="text-red-600"
                              disabled={deleteClientMutation.isPending}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </StandardizedActionCell>
                    )}
                  </StandardizedTableRow>
                ))}
              </TableBody>
            </StandardizedTable>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden">
            {filteredAndSortedClients.map((client) => (
              <MobileClientCard
                key={client.id}
                client={client}
                onEdit={onEditClient}
                onDelete={onDeleteClient}
                onDuplicate={onDuplicateClient}
                userRole={userRole}
                isSelected={selectedClients.has(client.id)}
                onSelect={handleSelectClient}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
