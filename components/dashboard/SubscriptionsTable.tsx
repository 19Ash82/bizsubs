"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  ChevronUp, 
  ChevronDown, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Copy, 
  Users, 
  X,
  Plus,
  Check,
  AlertTriangle,
  DollarSign,
  Calendar
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

// Types
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
  created_at: string;
  updated_at: string;
  client?: {
    id: string;
    name: string;
    color_hex: string;
  };
  clients?: Array<{
    id: string;
    name: string;
    color_hex: string;
  }>;
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
  onDeleteSubscription?: (subscriptionId: string) => void;
  onAddSubscription?: () => void;
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

// Format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
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

// Calculate days until next payment
const getDaysUntilPayment = (nextBillingDate: string) => {
  const today = new Date();
  const billing = new Date(nextBillingDate);
  const diffTime = billing.getTime() - today.getTime();
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

// Bulk operations toolbar
const BulkOperationsToolbar = ({ 
  selectedCount, 
  onClearSelection, 
  onBulkEdit, 
  onBulkDelete,
  userRole = 'admin'
}: {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkEdit: () => void;
  onBulkDelete: () => void;
  userRole?: 'admin' | 'member';
}) => (
  <div className="flex items-center justify-between p-4 bg-violet-50 border border-violet-200 rounded-lg mb-4">
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Checkbox checked={true} />
        <span className="text-sm font-medium">
          {selectedCount} subscription{selectedCount !== 1 ? 's' : ''} selected
        </span>
      </div>
      <Button variant="ghost" size="sm" onClick={onClearSelection}>
        <X className="w-4 h-4" />
      </Button>
    </div>
    
    {userRole === 'admin' && (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onBulkEdit}>
          <Edit className="w-4 h-4 mr-2" />
          Edit Selected
        </Button>
        <Button variant="outline" size="sm" onClick={onBulkDelete} className="text-red-600 hover:text-red-700">
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Selected
        </Button>
      </div>
    )}
  </div>
);

// Mobile card component - TRUE mobile-first design
const MobileSubscriptionCard = ({ 
  subscription, 
  isSelected, 
  onSelect, 
  onEdit, 
  onDelete, 
  userRole = 'admin' 
}: {
  subscription: Subscription;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onEdit: (subscription: Subscription) => void;
  onDelete: (subscriptionId: string) => void;
  userRole?: 'admin' | 'member';
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const daysUntil = getDaysUntilPayment(subscription.next_billing_date);
  
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
              {(subscription.clients || subscription.client) ? (
                <ClientDisplay 
                  clients={subscription.clients || (subscription.client ? [subscription.client] : [])} 
                  maxDisplay={1}
                />
              ) : (
                <span className="text-sm text-gray-400">Unassigned</span>
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
                {subscription.project ? subscription.project.name : 'None'}
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
                  {formatDate(subscription.next_billing_date)}
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

export function SubscriptionsTable({
  userTier = 'free',
  userRole = 'admin',
  onEditSubscription,
  onDeleteSubscription,
  onAddSubscription,
  onDataLoaded = () => {} // Default no-op function to ensure consistent dependency array
}: SubscriptionsTableProps) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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

  // No need for JavaScript screen size detection - use CSS breakpoints only

  // Fetch data
  useEffect(() => {
    fetchSubscriptions();
    fetchClients();
    fetchProjects();
  }, []);

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

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          client:clients(id, name, color_hex),
          project:projects(id, name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    }
  };

  const fetchProjects = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setProjects(data || []);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    }
  };

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
      if (searchQuery && !subscription.service_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !subscription.client?.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !subscription.project?.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
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
    
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedIds.length} subscription${selectedIds.length > 1 ? 's' : ''}?\n\n` +
      selectedNames.join('\n') +
      '\n\nThis action cannot be undone.'
    );
    
    if (confirmed) {
      // Call the delete handler for each selected subscription
      selectedIds.forEach(id => {
        if (onDeleteSubscription) {
          onDeleteSubscription(id);
        }
      });
      
      // Clear selection
      setSelectedSubscriptions(new Set());
    }
  };

  // Get unique categories for filter
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(subscriptions.map(s => s.category))];
    return uniqueCategories.sort();
  }, [subscriptions]);

  // Sort icon component
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronUp className="w-4 h-4 opacity-0" />;
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4 text-violet-600" /> : 
      <ChevronDown className="w-4 h-4 text-violet-600" />;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">{error}</p>
            <Button variant="outline" onClick={fetchSubscriptions} className="mt-4">
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
        <BulkOperationsToolbar
          selectedCount={selectedSubscriptions.size}
          onClearSelection={() => setSelectedSubscriptions(new Set())}
          onBulkEdit={handleBulkEdit}
          onBulkDelete={handleBulkDelete}
          userRole={userRole}
        />
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
        <div className="space-y-3">
          {filteredAndSortedSubscriptions.map(subscription => (
            <MobileSubscriptionCard
              key={subscription.id}
              subscription={subscription}
              isSelected={selectedSubscriptions.has(subscription.id)}
              onSelect={(checked) => handleSelectSubscription(subscription.id, checked)}
              onEdit={onEditSubscription || (() => {})}
              onDelete={onDeleteSubscription || (() => {})}
              userRole={userRole}
            />
          ))}
        </div>
      </div>

      {/* TABLET LAYOUT (768px - 1024px) - Compressed Table */}
      <div className="hidden md:block lg:hidden">
        <Card className="w-full">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedSubscriptions.size === filteredAndSortedSubscriptions.length && filteredAndSortedSubscriptions.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 min-w-[140px]"
                    onClick={() => handleSort('service_name')}
                  >
                    <div className="flex items-center gap-2">
                      Name
                      <SortIcon field="service_name" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 min-w-[120px]"
                    onClick={() => handleSort('client_name')}
                  >
                    <div className="flex items-center gap-2">
                      Client
                      <SortIcon field="client_name" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 min-w-[100px]"
                    onClick={() => handleSort('cost')}
                  >
                    <div className="flex items-center gap-2">
                      Cost
                      <SortIcon field="cost" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 min-w-[90px]"
                    onClick={() => handleSort('billing_cycle')}
                  >
                    <div className="flex items-center gap-2">
                      Cycle
                      <SortIcon field="billing_cycle" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 min-w-[100px]"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-2">
                      Status
                      <SortIcon field="status" />
                    </div>
                  </TableHead>
                  {userRole === 'admin' && (
                    <TableHead className="w-12">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedSubscriptions.map(subscription => (
                  <TableRow 
                    key={subscription.id}
                    className={cn(
                      selectedSubscriptions.has(subscription.id) && "bg-violet-50"
                    )}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedSubscriptions.has(subscription.id)}
                        onCheckedChange={(checked) => 
                          handleSelectSubscription(subscription.id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="truncate max-w-[140px]" title={subscription.service_name}>
                        {subscription.service_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[120px]">
                        <ClientDisplay 
                          clients={subscription.clients || (subscription.client ? [subscription.client] : [])} 
                          maxDisplay={1}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-right">
                      {formatCurrency(subscription.cost, subscription.currency)}
                    </TableCell>
                    <TableCell>
                      <CycleBadge cycle={subscription.billing_cycle} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={subscription.status} />
                    </TableCell>
                    {userRole === 'admin' && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
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
                            <DropdownMenuItem>
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
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* DESKTOP LAYOUT (> 1024px) - Full Table */}
      <div className="hidden lg:block">
        <Card className="w-full">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedSubscriptions.size === filteredAndSortedSubscriptions.length && filteredAndSortedSubscriptions.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 min-w-[160px]"
                    onClick={() => handleSort('service_name')}
                  >
                    <div className="flex items-center gap-2">
                      Name
                      <SortIcon field="service_name" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 min-w-[140px]"
                    onClick={() => handleSort('client_name')}
                  >
                    <div className="flex items-center gap-2">
                      Client
                      <SortIcon field="client_name" />
                    </div>
                  </TableHead>
                  <TableHead className="min-w-[120px]">Project</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 min-w-[100px]"
                    onClick={() => handleSort('category')}
                  >
                    <div className="flex items-center gap-2">
                      Category
                      <SortIcon field="category" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 min-w-[100px]"
                    onClick={() => handleSort('cost')}
                  >
                    <div className="flex items-center gap-2">
                      Cost
                      <SortIcon field="cost" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 min-w-[90px]"
                    onClick={() => handleSort('billing_cycle')}
                  >
                    <div className="flex items-center gap-2">
                      Cycle
                      <SortIcon field="billing_cycle" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 min-w-[140px]"
                    onClick={() => handleSort('next_billing_date')}
                  >
                    <div className="flex items-center gap-2">
                      Next Payment
                      <SortIcon field="next_billing_date" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 min-w-[100px]"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-2">
                      Status
                      <SortIcon field="status" />
                    </div>
                  </TableHead>
                  {userRole === 'admin' && (
                    <TableHead className="w-12">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedSubscriptions.map(subscription => {
                  const daysUntil = getDaysUntilPayment(subscription.next_billing_date);
                  
                  return (
                    <TableRow 
                      key={subscription.id}
                      className={cn(
                        selectedSubscriptions.has(subscription.id) && "bg-violet-50"
                      )}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedSubscriptions.has(subscription.id)}
                          onCheckedChange={(checked) => 
                            handleSelectSubscription(subscription.id, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="truncate max-w-[160px]" title={subscription.service_name}>
                          {subscription.service_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[140px]">
                          <ClientDisplay 
                            clients={subscription.clients || (subscription.client ? [subscription.client] : [])} 
                            maxDisplay={1}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        {subscription.project ? (
                          <div className="truncate max-w-[120px]" title={subscription.project.name}>
                            <span className="text-sm">{subscription.project.name}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">
                          {subscription.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-right">
                        {formatCurrency(subscription.cost, subscription.currency)}
                      </TableCell>
                      <TableCell>
                        <CycleBadge cycle={subscription.billing_cycle} />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm font-medium">
                            {formatDate(subscription.next_billing_date)}
                          </div>
                          <div className={cn("text-xs", 
                            daysUntil <= 7 ? "text-amber-600" : "text-gray-500"
                          )}>
                            {daysUntil > 0 ? `${daysUntil} days` : daysUntil === 0 ? 'Today' : 'Overdue'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={subscription.status} />
                      </TableCell>
                      {userRole === 'admin' && (
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
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
                              <DropdownMenuItem>
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
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
