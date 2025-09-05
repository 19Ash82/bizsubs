// Updated 2024-12-20: Optimized SubscriptionsTable with React Query
// Eliminates manual data fetching and implements intelligent caching per PRD

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Copy, 
  Trash2, 
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  DollarSign,
  Building,
  Tag,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useSubscriptions, useDeleteSubscription, type Subscription } from '@/lib/react-query/subscriptions';
import { useClients } from '@/lib/react-query/clients';
import { useProjects } from '@/lib/react-query/projects';

// Types
type SortField = 'service_name' | 'cost' | 'next_billing_date' | 'status' | 'category';
type SortDirection = 'asc' | 'desc';

interface SubscriptionsTableProps {
  userTier?: 'free' | 'pro' | 'team';
  userRole?: 'admin' | 'member';
  onEditSubscription?: (subscription: Subscription) => void;
  onDeleteSubscription?: (id: string) => void;
  onAddSubscription?: () => void;
  onDuplicateSubscription?: (subscription: Subscription) => void;
  onDataLoaded?: (data: { clients: any[], projects: any[], subscriptionCount: number }) => void;
}

const SUBSCRIPTION_STATUSES = [
  { value: 'active', label: 'Active', color: 'bg-emerald-500' },
  { value: 'paused', label: 'Paused', color: 'bg-amber-500' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500' },
];

const CATEGORIES = [
  'software',
  'marketing',
  'design',
  'infrastructure',
  'analytics',
  'productivity',
  'communication',
  'security',
  'hosting',
  'other'
];

const MobileSubscriptionCard = ({ 
  subscription, 
  onEdit, 
  onDelete, 
  onDuplicate, 
  userRole,
  clients,
  projects
}: {
  subscription: Subscription;
  onEdit: (sub: Subscription) => void;
  onDelete: (id: string) => void;
  onDuplicate: (sub: Subscription) => void;
  userRole: string;
  clients: any[];
  projects: any[];
}) => {
  const client = clients.find(c => c.id === subscription.client_id);
  const project = projects.find(p => p.id === subscription.project_id);
  
  const statusConfig = SUBSCRIPTION_STATUSES.find(s => s.value === subscription.status);
  
  const formatCurrency = (amount: number, currency: string) => {
    const symbols: Record<string, string> = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'CAD': '$'
    };
    return `${symbols[currency] || '$'}${amount.toFixed(2)}`;
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold">{subscription.service_name}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge 
                variant="secondary" 
                className={`${statusConfig?.color} text-white`}
              >
                {statusConfig?.label}
              </Badge>
              <Badge variant="outline">
                {subscription.category.charAt(0).toUpperCase() + subscription.category.slice(1)}
              </Badge>
            </div>
          </div>
          {userRole === 'admin' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(subscription)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate(subscription)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(subscription.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-gray-500" />
              <span className="font-medium">
                {formatCurrency(subscription.cost, subscription.currency)}
              </span>
              <span className="text-sm text-gray-500">
                / {subscription.billing_cycle}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm">
              Next billing: {new Date(subscription.next_billing_date).toLocaleDateString()}
            </span>
          </div>

          {client && (
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-gray-500" />
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: client.color_hex }}
                />
                <span className="text-sm">{client.name}</span>
                {project && (
                  <span className="text-sm text-gray-500">• {project.name}</span>
                )}
              </div>
            </div>
          )}
          
          {subscription.notes && (
            <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
              {subscription.notes}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export function SubscriptionsTable({
  userTier = 'free',
  userRole = 'admin',
  onEditSubscription,
  onDeleteSubscription,
  onAddSubscription,
  onDuplicateSubscription,
  onDataLoaded = () => {}
}: SubscriptionsTableProps) {
  // Table state
  const [sortField, setSortField] = useState<SortField>('next_billing_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedSubscriptions, setSelectedSubscriptions] = useState<Set<string>>(new Set());
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const hasNotifiedParent = useRef(false);

  // React Query hooks for data fetching
  const { data: subscriptions = [], isLoading: subscriptionsLoading, error: subscriptionsError } = useSubscriptions({
    status: statusFilter,
    client_id: clientFilter,
    category: categoryFilter
  });
  
  const { data: clients = [], isLoading: clientsLoading } = useClients();
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  
  // Delete mutation
  const deleteSubscriptionMutation = useDeleteSubscription();

  const isLoading = subscriptionsLoading || clientsLoading || projectsLoading;
  const hasError = subscriptionsError;

  // Notify parent when data is loaded - consistent dependency array
  useEffect(() => {
    if (!isLoading && clients.length >= 0 && projects.length >= 0 && subscriptions.length >= 0 && !hasNotifiedParent.current) {
      hasNotifiedParent.current = true;
      const tableData = {
        clients,
        projects,
        subscriptionCount: subscriptions.length
      };
      onDataLoaded(tableData);
    }
  }, [isLoading, clients, projects, subscriptions, onDataLoaded]);

  // Reset notification flag when component mounts (due to key prop change)
  useEffect(() => {
    hasNotifiedParent.current = false;
  }, []);

  // Filter and sort subscriptions
  const filteredAndSortedSubscriptions = React.useMemo(() => {
    let filtered = subscriptions;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(sub =>
        sub.service_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        clients.find(c => c.id === sub.client_id)?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        projects.find(p => p.id === sub.project_id)?.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'cost') {
        aValue = Number(aValue);
        bValue = Number(bValue);
      } else if (sortField === 'next_billing_date') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [subscriptions, searchQuery, sortField, sortDirection, clients, projects]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this subscription?')) {
      try {
        await deleteSubscriptionMutation.mutateAsync(id);
        onDeleteSubscription?.(id);
      } catch (error) {
        // Error handling is done by the mutation
      }
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSubscriptions(new Set(filteredAndSortedSubscriptions.map(sub => sub.id)));
    } else {
      setSelectedSubscriptions(new Set());
    }
  };

  const handleSelectSubscription = (id: string, checked: boolean) => {
    const newSelection = new Set(selectedSubscriptions);
    if (checked) {
      newSelection.add(id);
    } else {
      newSelection.delete(id);
    }
    setSelectedSubscriptions(newSelection);
  };

  const formatCurrency = (amount: number, currency: string) => {
    const symbols: Record<string, string> = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'CAD': '$'
    };
    return `${symbols[currency] || '$'}${amount.toFixed(2)}`;
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  if (hasError) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Subscriptions</h3>
          <p className="text-gray-600">
            {hasError instanceof Error ? hasError.message : 'Failed to load subscriptions. Please try again.'}
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading subscriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search subscriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {SUBSCRIPTION_STATUSES.map(status => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              <SelectItem value="internal">Internal</SelectItem>
              {clients.map(client => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(category => (
                <SelectItem key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectedSubscriptions.size === filteredAndSortedSubscriptions.length && filteredAndSortedSubscriptions.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('service_name')}
                    className="h-auto p-0 font-medium"
                  >
                    Service
                    {getSortIcon('service_name')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('cost')}
                    className="h-auto p-0 font-medium"
                  >
                    Cost
                    {getSortIcon('cost')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('next_billing_date')}
                    className="h-auto p-0 font-medium"
                  >
                    Next Billing
                    {getSortIcon('next_billing_date')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('status')}
                    className="h-auto p-0 font-medium"
                  >
                    Status
                    {getSortIcon('status')}
                  </Button>
                </TableHead>
                <TableHead>Client</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('category')}
                    className="h-auto p-0 font-medium"
                  >
                    Category
                    {getSortIcon('category')}
                  </Button>
                </TableHead>
                {userRole === 'admin' && <TableHead className="w-[50px]"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedSubscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={userRole === 'admin' ? 8 : 7} className="text-center py-8">
                    <div className="text-gray-500">
                      {searchQuery || statusFilter !== 'all' || clientFilter !== 'all' || categoryFilter !== 'all' 
                        ? 'No subscriptions match your filters.' 
                        : 'No subscriptions yet. Add your first subscription to get started.'}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedSubscriptions.map((subscription) => {
                  const client = clients.find(c => c.id === subscription.client_id);
                  const project = projects.find(p => p.id === subscription.project_id);
                  const statusConfig = SUBSCRIPTION_STATUSES.find(s => s.value === subscription.status);
                  
                  return (
                    <TableRow key={subscription.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedSubscriptions.has(subscription.id)}
                          onCheckedChange={(checked) => handleSelectSubscription(subscription.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {subscription.service_name}
                        {subscription.notes && (
                          <div className="text-sm text-gray-500 mt-1">
                            {subscription.notes.substring(0, 50)}
                            {subscription.notes.length > 50 && '...'}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(subscription.cost, subscription.currency)}
                        <div className="text-sm text-gray-500">
                          / {subscription.billing_cycle}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(subscription.next_billing_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary" 
                          className={`${statusConfig?.color} text-white`}
                        >
                          {statusConfig?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {client ? (
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: client.color_hex }}
                            />
                            <span>{client.name}</span>
                            {project && (
                              <span className="text-sm text-gray-500">• {project.name}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500">Internal</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {subscription.category.charAt(0).toUpperCase() + subscription.category.slice(1)}
                        </Badge>
                      </TableCell>
                      {userRole === 'admin' && (
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onEditSubscription?.(subscription)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onDuplicateSubscription?.(subscription)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(subscription.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden">
        {filteredAndSortedSubscriptions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchQuery || statusFilter !== 'all' || clientFilter !== 'all' || categoryFilter !== 'all' 
              ? 'No subscriptions match your filters.' 
              : 'No subscriptions yet. Add your first subscription to get started.'}
          </div>
        ) : (
          filteredAndSortedSubscriptions.map((subscription) => (
            <MobileSubscriptionCard
              key={subscription.id}
              subscription={subscription}
              onEdit={onEditSubscription || (() => {})}
              onDelete={handleDelete}
              onDuplicate={onDuplicateSubscription || (() => {})}
              userRole={userRole}
              clients={clients}
              projects={projects}
            />
          ))
        )}
      </div>
    </div>
  );
}
