"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSubscriptions } from '@/lib/react-query/subscriptions';
import { useClients } from '@/lib/react-query/clients';
import { useProjectsWithCosts } from '@/lib/react-query/projects';
import { useDataContainerBlur } from '@/lib/hooks/useDataContainerBlur';
import { 
  ChevronUp, 
  ChevronDown, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Copy,
  Plus,
  AlertTriangle,
  DollarSign,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { cn } from '@/lib/utils';
import { formatDateForDisplayWithLocale, calculateNextBillingDate } from '@/lib/utils/billing-dates';

// Types
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

interface Client {
  id: string;
  name: string;
  color_hex: string;
  status: string;
}

interface Project {
  id: string;
  name: string;
  client_id: string;
}

interface SubscriptionsTableProps {
  userTier?: string;
  userRole?: 'admin' | 'member';
  onEditSubscription?: (subscription: Subscription) => void;
  onDeleteSubscription?: (subscriptionId: string | string[], subscriptionNames?: string[]) => void;
  onAddSubscription?: () => void;
  onDuplicateSubscription?: (subscription: Subscription) => void;
  onDataLoaded?: (data: { clients: Client[]; projects: Project[]; subscriptionCount: number }) => void;
}

type SortField = 'service_name' | 'cost' | 'billing_cycle' | 'next_billing_date' | 'status' | 'client_name' | 'category';
type SortDirection = 'asc' | 'desc';

// Status badge component with colored dots
const StatusBadge = ({ status }: { status: 'active' | 'cancelled' | 'paused' }) => {
  const config = {
    active: {
      label: 'Active',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dotColor: 'bg-emerald-500'
    },
    cancelled: {
      label: 'Cancelled',
      className: 'bg-red-50 text-red-700 border-red-200',
      dotColor: 'bg-red-500'
    },
    paused: {
      label: 'Paused',
      className: 'bg-amber-50 text-amber-700 border-amber-200',
      dotColor: 'bg-amber-500'
    }
  };

  const { label, className, dotColor } = config[status];

  return (
    <Badge variant="outline" className={cn("gap-1.5", className)}>
      <div className={cn("w-2 h-2 rounded-full", dotColor)} />
      {label}
    </Badge>
  );
};

// Billing cycle badge
const CycleBadge = ({ cycle }: { cycle: string }) => {
  const cycleLabels = {
    weekly: 'Weekly',
    monthly: 'Monthly', 
    quarterly: 'Quarterly',
    annual: 'Annual'
  };

  return (
    <Badge variant="secondary" className="text-xs">
      {cycleLabels[cycle as keyof typeof cycleLabels] || cycle}
    </Badge>
  );
};

// Format currency
const formatCurrency = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

// Format date - now uses user preference
const formatDate = (dateString: string, dateFormat: 'US' | 'EU' | 'ISO' = 'US') => {
  return formatDateForDisplayWithLocale(dateString, 'en-US', dateFormat);
};

// Extract internal project name from notes
const getProjectName = (subscription: Subscription): string | null => {
  // If there's a proper project from database join, use that
  if (subscription.project) {
    return subscription.project.name;
  }
  
  // If no client (internal) and notes contain internal project, extract it
  if (!subscription.client_id && subscription.notes) {
    const match = subscription.notes.match(/^Internal Project: (.+?)(?:\n|$)/);
    if (match) {
      return match[1].trim();
    }
  }
  
  return null;
};

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

// Get the correct next billing date (calculated dynamically)
const getCorrectNextBillingDate = (subscription: Subscription): Date => {
  return calculateNextBillingDate(subscription.start_date, subscription.billing_cycle);
};

// Calculate days until next payment
const getDaysUntilPayment = (subscription: Subscription) => {
  const today = new Date();
  const nextBilling = getCorrectNextBillingDate(subscription);
  const diffTime = nextBilling.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Empty state component
const EmptyState = ({ onAddSubscription }: { onAddSubscription?: () => void }) => (
  <Card className="border-dashed border-2 border-gray-200">
    <CardContent className="flex flex-col items-center justify-center py-12">
      <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mb-4">
        <DollarSign className="w-8 h-8 text-violet-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">No subscriptions yet</h3>
      <p className="text-gray-500 text-center mb-6 max-w-sm">
        Get started by adding your first subscription to track costs and billing cycles.
      </p>
      {onAddSubscription && (
        <Button onClick={onAddSubscription} className="bg-violet-600 hover:bg-violet-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Subscription
        </Button>
      )}
    </CardContent>
  </Card>
);


// Mobile card component - TRUE mobile-first design
const MobileSubscriptionCard = ({ 
  subscription, 
  isSelected, 
  onSelect, 
  onEdit, 
  onDelete, 
  onDuplicate,
  userRole = 'admin',
  userDateFormat = 'US'
}: {
  subscription: Subscription;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onEdit: (subscription: Subscription) => void;
  onDelete: (subscriptionId: string) => void;
  onDuplicate: (subscription: Subscription) => void;
  userRole?: 'admin' | 'member';
  userDateFormat?: 'US' | 'EU' | 'ISO';
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const daysUntil = getDaysUntilPayment(subscription);
  const correctNextBillingDate = getCorrectNextBillingDate(subscription);
  
  return (
    <div className={cn(
      "w-full bg-white rounded-lg border border-gray-200 shadow-sm mb-3 overflow-hidden",
      isSelected && "ring-2 ring-violet-500 border-violet-500"
    )}>
      {/* Main Card Content */}
      <div className="p-4">
        {/* Header Row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Checkbox 
              checked={isSelected}
              onCheckedChange={onSelect}
              className="mt-0.5 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-base leading-tight mb-1 truncate" title={subscription.service_name}>
                {subscription.service_name}
              </h3>
              <div className="flex items-center gap-2">
                <StatusBadge status={subscription.status} />
              </div>
            </div>
          </div>
          
          {userRole === 'admin' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex-shrink-0 h-8 w-8 p-0">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(subscription)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate(subscription)}>
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete(subscription.id)} className="text-red-600">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Essential Info Grid */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* Cost */}
          <div>
            <div className="text-xs text-gray-500 mb-1">Cost</div>
            <div className="font-semibold text-lg text-gray-900">
              {formatCurrency(subscription.cost, subscription.currency)}
            </div>
          </div>

                        {/* Client */}
              <div>
                <div className="text-xs text-gray-500 mb-1">Client</div>
                <div className="min-w-0">
                  {subscription.client ? (
                    <ClientDisplay 
                      clients={[subscription.client]} 
                      maxDisplay={1}
                    />
                  ) : (
                    <span className="text-sm text-gray-400">Internal</span>
                  )}
                </div>
              </div>
        </div>

        {/* Expand/Collapse Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center py-2 text-sm text-gray-600 hover:text-gray-800 border-t border-gray-100 -mx-4 -mb-4 mt-3 bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4 mr-1" />
              Less Details
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 mr-1" />
              More Details
            </>
          )}
        </button>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-4">
          <div className="grid grid-cols-1 gap-3 text-sm">
            {/* Project */}
            <div className="flex justify-between">
              <span className="text-gray-500">Project</span>
              <span className="text-gray-900 text-right">
                {getProjectName(subscription) || 'None'}
              </span>
            </div>
            
            {/* Category */}
            <div className="flex justify-between">
              <span className="text-gray-500">Category</span>
              <Badge variant="outline" className="text-xs capitalize">
                {subscription.category}
              </Badge>
            </div>
            
            {/* Billing Cycle */}
            <div className="flex justify-between">
              <span className="text-gray-500">Billing Cycle</span>
              <CycleBadge cycle={subscription.billing_cycle} />
            </div>
            
            {/* Next Payment */}
            <div className="flex justify-between">
              <span className="text-gray-500">Next Payment</span>
              <div className="text-right">
                <div className="font-medium text-gray-900">
                  {formatDateForDisplayWithLocale(correctNextBillingDate, 'en-US', userDateFormat)}
                </div>
                <div className={cn("text-xs", 
                  daysUntil <= 7 ? "text-amber-600" : "text-gray-500"
                )}>
                  {daysUntil > 0 ? `${daysUntil} days` : daysUntil === 0 ? 'Today' : 'Overdue'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface SubscriptionsTableProps {
  userTier?: 'free' | 'pro' | 'team';
  userRole?: 'admin' | 'member';
  userDateFormat?: 'US' | 'EU' | 'ISO';
  onEditSubscription?: (subscription: Subscription) => void;
  onDeleteSubscription?: (id: string) => void;
  onAddSubscription?: () => void;
  onDuplicateSubscription?: (subscription: Subscription) => void;
  onDataLoaded?: (data: { clients: any[], projects: any[], subscriptionCount: number }) => void;
}

export function SubscriptionsTable({
  userTier = 'free',
  userRole = 'admin',
  userDateFormat = 'US',
  onEditSubscription,
  onDeleteSubscription,
  onAddSubscription,
  onDuplicateSubscription,
  onDataLoaded = () => {} // Default no-op function to ensure consistent dependency array
}: SubscriptionsTableProps) {
  // Use React Query hooks for data fetching
  const { data: subscriptions = [], isLoading: subscriptionsLoading, error: subscriptionsError } = useSubscriptions();
  const { data: clients = [], isLoading: clientsLoading } = useClients();
  const { data: projects = [], isLoading: projectsLoading } = useProjectsWithCosts();

  // Set up blur overlay for table data
  const { dataBlurClass } = useDataContainerBlur({
    queryKeys: ['subscriptions'],
    intensity: 'medium'
  });

  // Calculate overall loading and error states
  const loading = subscriptionsLoading || clientsLoading || projectsLoading;
  const error = subscriptionsError?.message || null;
  
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

  // Notify parent when data is loaded - consistent dependency array
  useEffect(() => {
    if (!loading && clients.length >= 0 && projects.length >= 0 && subscriptions.length >= 0 && !hasNotifiedParent.current) {
      hasNotifiedParent.current = true;
      const tableData = {
        clients,
        projects,
        subscriptionCount: subscriptions.length
      };
      onDataLoaded(tableData);
    }
  }, [loading, clients, projects, subscriptions, onDataLoaded]);

  // Reset notification flag when component mounts (due to key prop change)
  useEffect(() => {
    hasNotifiedParent.current = false;
  }, []);

  // Sorting logic
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter and sort subscriptions
  const filteredAndSortedSubscriptions = useMemo(() => {
    let filtered = subscriptions.filter(subscription => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const serviceName = subscription.service_name.toLowerCase();
        const clientName = subscription.client?.name.toLowerCase() || '';
        const projectName = getProjectName(subscription)?.toLowerCase() || '';
        
        if (!serviceName.includes(query) && !clientName.includes(query) && !projectName.includes(query)) {
          return false;
        }
      }
      
      // Status filter
      if (statusFilter !== 'all' && subscription.status !== statusFilter) {
        return false;
      }
      
      // Client filter
      if (clientFilter !== 'all' && subscription.client_id !== clientFilter) {
        return false;
      }
      
      // Category filter
      if (categoryFilter !== 'all' && subscription.category !== categoryFilter) {
        return false;
      }
      
      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'service_name':
          aValue = a.service_name.toLowerCase();
          bValue = b.service_name.toLowerCase();
          break;
        case 'cost':
          aValue = a.cost;
          bValue = b.cost;
          break;
        case 'billing_cycle':
          aValue = a.billing_cycle;
          bValue = b.billing_cycle;
          break;
        case 'next_billing_date':
          aValue = new Date(a.next_billing_date);
          bValue = new Date(b.next_billing_date);
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'client_name':
          aValue = a.client?.name?.toLowerCase() || '';
          bValue = b.client?.name?.toLowerCase() || '';
          break;
        case 'category':
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [subscriptions, searchQuery, statusFilter, clientFilter, categoryFilter, sortField, sortDirection]);

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSubscriptions(new Set(filteredAndSortedSubscriptions.map(s => s.id)));
    } else {
      setSelectedSubscriptions(new Set());
    }
  };

  const handleSelectSubscription = (subscriptionId: string, checked: boolean) => {
    const newSelected = new Set(selectedSubscriptions);
    if (checked) {
      newSelected.add(subscriptionId);
    } else {
      newSelected.delete(subscriptionId);
    }
    setSelectedSubscriptions(newSelected);
  };

  // Bulk operations
  const handleBulkEdit = () => {
    // TODO: Implement bulk edit modal
    console.log('Bulk edit:', Array.from(selectedSubscriptions));
  };

  const handleBulkDelete = () => {
    if (selectedSubscriptions.size === 0) return;
    
    const selectedIds = Array.from(selectedSubscriptions);
    const selectedNames = filteredAndSortedSubscriptions
      .filter(sub => selectedIds.includes(sub.id))
      .map(sub => sub.service_name);
    
    // Call the delete handler with the array of selected IDs and names for bulk delete
    if (onDeleteSubscription) {
      onDeleteSubscription(selectedIds, selectedNames);
    }
    
    // Clear selection
    setSelectedSubscriptions(new Set());
  };

  // Get unique categories for filter
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(subscriptions.map(s => s.category))];
    return uniqueCategories.sort();
  }, [subscriptions]);


  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  if (error && subscriptions.length === 0) {
    return (
      <Card className="border-red-200">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">{error}</p>
            <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (subscriptions.length === 0) {
    return <EmptyState onAddSubscription={onAddSubscription} />;
  }

  return (
    <div className="w-full space-y-4 min-w-0">
      {/* Filter Bar */}
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search subscriptions, clients, projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: client.color_hex }}
                        />
                        {client.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      <span className="capitalize">{category}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Bulk Operations Toolbar */}
      {selectedSubscriptions.size > 0 && (
        <StandardizedBulkToolbar
          selectedCount={selectedSubscriptions.size}
          onClearSelection={() => setSelectedSubscriptions(new Set())}
        >
          {userRole === 'admin' && (
            <>
              <Button variant="outline" size="sm" onClick={handleBulkEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Selected
              </Button>
              <Button variant="outline" size="sm" onClick={handleBulkDelete} className="text-red-600 hover:text-red-700">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected
              </Button>
            </>
          )}
        </StandardizedBulkToolbar>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          Showing {filteredAndSortedSubscriptions.length} of {subscriptions.length} subscriptions
        </span>
        {filteredAndSortedSubscriptions.length > 0 && (
          <span>
            Total: {formatCurrency(
              filteredAndSortedSubscriptions.reduce((sum, sub) => sum + sub.cost, 0)
            )}
          </span>
        )}
      </div>

      {/* Responsive Layout */}
      
      {/* MOBILE LAYOUT (< 768px) - Card-based */}
      <div className="block md:hidden">
        <div className={`space-y-3 ${dataBlurClass}`}>
          {filteredAndSortedSubscriptions.map(subscription => (
            <MobileSubscriptionCard
              key={subscription.id}
              subscription={subscription}
              isSelected={selectedSubscriptions.has(subscription.id)}
              onSelect={(checked) => handleSelectSubscription(subscription.id, checked)}
              onEdit={onEditSubscription || (() => {})}
              onDelete={onDeleteSubscription || (() => {})}
              onDuplicate={onDuplicateSubscription || (() => {})}
              userRole={userRole}
              userDateFormat={userDateFormat}
            />
          ))}
        </div>
      </div>

      {/* TABLET LAYOUT (768px - 1024px) - Compressed Table */}
      <div className="hidden md:block lg:hidden">
        <StandardizedTable>
          <StandardizedTableHeader>
            <StandardizedTableRow>
              <StandardizedTableHead width="checkbox">
                <Checkbox
                  checked={selectedSubscriptions.size === filteredAndSortedSubscriptions.length && filteredAndSortedSubscriptions.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </StandardizedTableHead>
              <StandardizedTableHead 
                width="medium"
                sortable
                sortDirection={sortField === 'service_name' ? sortDirection : null}
                onSort={() => handleSort('service_name')}
              >
                Name
              </StandardizedTableHead>
              <StandardizedTableHead 
                width="medium"
                sortable
                sortDirection={sortField === 'client_name' ? sortDirection : null}
                onSort={() => handleSort('client_name')}
              >
                Client
              </StandardizedTableHead>
              <StandardizedTableHead width="small">Project</StandardizedTableHead>
              <StandardizedTableHead 
                width="small"
                sortable
                sortDirection={sortField === 'cost' ? sortDirection : null}
                onSort={() => handleSort('cost')}
              >
                Cost
              </StandardizedTableHead>
              <StandardizedTableHead 
                width="small"
                sortable
                sortDirection={sortField === 'billing_cycle' ? sortDirection : null}
                onSort={() => handleSort('billing_cycle')}
              >
                Cycle
              </StandardizedTableHead>
              <StandardizedTableHead 
                width="small"
                sortable
                sortDirection={sortField === 'status' ? sortDirection : null}
                onSort={() => handleSort('status')}
              >
                Status
              </StandardizedTableHead>
              {userRole === 'admin' && (
                <StandardizedTableHead width="action">Actions</StandardizedTableHead>
              )}
            </StandardizedTableRow>
          </StandardizedTableHeader>
              <TableBody className={dataBlurClass}>
                {filteredAndSortedSubscriptions.map(subscription => (
                  <StandardizedTableRow 
                    key={subscription.id}
                    selected={selectedSubscriptions.has(subscription.id)}
                  >
                    <StandardizedCheckboxCell
                      checked={selectedSubscriptions.has(subscription.id)}
                      onCheckedChange={(checked) => 
                        handleSelectSubscription(subscription.id, checked as boolean)
                      }
                    />
                    <StandardizedTableCell className="font-medium">
                      <div className="truncate" title={subscription.service_name}>
                        {subscription.service_name}
                      </div>
                    </StandardizedTableCell>
                    <StandardizedTableCell>
                      {subscription.client ? (
                        <ClientDisplay 
                          clients={[subscription.client]} 
                          maxDisplay={1}
                        />
                      ) : (
                        <span className="text-muted-foreground">Internal</span>
                      )}
                    </StandardizedTableCell>
                    <StandardizedTableCell>
                      {getProjectName(subscription) ? (
                        <div className="truncate" title={getProjectName(subscription)!}>
                          {getProjectName(subscription)}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </StandardizedTableCell>
                    <StandardizedTableCell variant="numeric" className="font-medium">
                      {formatCurrency(subscription.cost, subscription.currency)}
                    </StandardizedTableCell>
                    <StandardizedTableCell>
                      <CycleBadge cycle={subscription.billing_cycle} />
                    </StandardizedTableCell>
                    <StandardizedTableCell>
                      <StatusBadge status={subscription.status} />
                    </StandardizedTableCell>
                    {userRole === 'admin' && (
                      <StandardizedActionCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className={STANDARDIZED_STYLES.ACTION_BUTTON}>
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => onEditSubscription?.(subscription)}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onDuplicateSubscription?.(subscription)}
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => onDeleteSubscription?.(subscription.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
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

      {/* DESKTOP LAYOUT (> 1024px) - Full Table */}
      <div className="hidden lg:block">
        <StandardizedTable>
          <StandardizedTableHeader>
            <StandardizedTableRow>
              <StandardizedTableHead width="checkbox">
                <Checkbox
                  checked={selectedSubscriptions.size === filteredAndSortedSubscriptions.length && filteredAndSortedSubscriptions.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </StandardizedTableHead>
              <StandardizedTableHead 
                width="large"
                sortable
                sortDirection={sortField === 'service_name' ? sortDirection : null}
                onSort={() => handleSort('service_name')}
              >
                Name
              </StandardizedTableHead>
              <StandardizedTableHead 
                width="medium"
                sortable
                sortDirection={sortField === 'client_name' ? sortDirection : null}
                onSort={() => handleSort('client_name')}
              >
                Client
              </StandardizedTableHead>
              <StandardizedTableHead width="medium">Project</StandardizedTableHead>
              <StandardizedTableHead 
                width="small"
                sortable
                sortDirection={sortField === 'category' ? sortDirection : null}
                onSort={() => handleSort('category')}
              >
                Category
              </StandardizedTableHead>
              <StandardizedTableHead 
                width="small"
                sortable
                sortDirection={sortField === 'cost' ? sortDirection : null}
                onSort={() => handleSort('cost')}
              >
                Cost
              </StandardizedTableHead>
              <StandardizedTableHead 
                width="small"
                sortable
                sortDirection={sortField === 'billing_cycle' ? sortDirection : null}
                onSort={() => handleSort('billing_cycle')}
              >
                Cycle
              </StandardizedTableHead>
              <StandardizedTableHead 
                width="medium"
                sortable
                sortDirection={sortField === 'next_billing_date' ? sortDirection : null}
                onSort={() => handleSort('next_billing_date')}
              >
                Next Payment
              </StandardizedTableHead>
              <StandardizedTableHead 
                width="small"
                sortable
                sortDirection={sortField === 'status' ? sortDirection : null}
                onSort={() => handleSort('status')}
              >
                Status
              </StandardizedTableHead>
              {userRole === 'admin' && (
                <StandardizedTableHead width="action">Actions</StandardizedTableHead>
              )}
            </StandardizedTableRow>
          </StandardizedTableHeader>
              <TableBody className={dataBlurClass}>
                {filteredAndSortedSubscriptions.map(subscription => {
                  const daysUntil = getDaysUntilPayment(subscription);
                  const correctNextBillingDate = getCorrectNextBillingDate(subscription);
                  
                  return (
                    <StandardizedTableRow 
                      key={subscription.id}
                      selected={selectedSubscriptions.has(subscription.id)}
                    >
                      <StandardizedCheckboxCell
                        checked={selectedSubscriptions.has(subscription.id)}
                        onCheckedChange={(checked) => 
                          handleSelectSubscription(subscription.id, checked as boolean)
                        }
                      />
                      <StandardizedTableCell className="font-medium">
                        <div className="truncate" title={subscription.service_name}>
                          {subscription.service_name}
                        </div>
                      </StandardizedTableCell>
                      <StandardizedTableCell>
                        {subscription.client ? (
                          <ClientDisplay 
                            clients={[subscription.client]} 
                            maxDisplay={1}
                          />
                        ) : (
                          <span className="text-muted-foreground">Internal</span>
                        )}
                      </StandardizedTableCell>
                      <StandardizedTableCell>
                        {getProjectName(subscription) ? (
                          <div className="truncate" title={getProjectName(subscription)!}>
                            {getProjectName(subscription)}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </StandardizedTableCell>
                      <StandardizedTableCell>
                        <Badge variant="outline" className="text-xs capitalize">
                          {subscription.category}
                        </Badge>
                      </StandardizedTableCell>
                      <StandardizedTableCell variant="numeric" className="font-medium">
                        {formatCurrency(subscription.cost, subscription.currency)}
                      </StandardizedTableCell>
                      <StandardizedTableCell>
                        <CycleBadge cycle={subscription.billing_cycle} />
                      </StandardizedTableCell>
                      <StandardizedTableCell>
                        <div>
                          <div className="font-medium">
                            {formatDateForDisplayWithLocale(correctNextBillingDate, 'en-US', userDateFormat)}
                          </div>
                          <div className={cn("text-xs", 
                            daysUntil <= 7 ? "text-amber-600" : "text-muted-foreground"
                          )}>
                            {daysUntil > 0 ? `${daysUntil} days` : daysUntil === 0 ? 'Today' : 'Overdue'}
                          </div>
                        </div>
                      </StandardizedTableCell>
                      <StandardizedTableCell>
                        <StatusBadge status={subscription.status} />
                      </StandardizedTableCell>
                      {userRole === 'admin' && (
                        <StandardizedActionCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className={STANDARDIZED_STYLES.ACTION_BUTTON}>
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => onEditSubscription?.(subscription)}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => onDuplicateSubscription?.(subscription)}
                              >
                                <Copy className="w-4 h-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => onDeleteSubscription?.(subscription.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </StandardizedActionCell>
                      )}
                    </StandardizedTableRow>
                  );
                })}
              </TableBody>
            </StandardizedTable>
      </div>
    </div>
  );
}
