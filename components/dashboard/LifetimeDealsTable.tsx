// Updated 2024-12-20: LifetimeDealsTable with React Query optimistic updates
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
  AlertCircle,
  TrendingUp,
  X,
  TrendingDown
} from 'lucide-react';
import { useLifetimeDeals, useDeleteLifetimeDeal, type LifetimeDeal } from '@/lib/react-query/lifetime-deals';
import { useClients } from '@/lib/react-query/clients';
import { useProjectsWithCosts } from '@/lib/react-query/projects';

// Types
type SortField = 'service_name' | 'original_cost' | 'purchase_date' | 'status' | 'category' | 'profit_loss';
type SortDirection = 'asc' | 'desc';

interface LifetimeDealsTableProps {
  userTier?: 'free' | 'pro' | 'team';
  userRole?: 'admin' | 'member';
  onEditLifetimeDeal?: (lifetimeDeal: LifetimeDeal) => void;
  onDeleteLifetimeDeal?: (id: string | string[], lifetimeDealNames?: string[]) => void;
  onAddLifetimeDeal?: () => void;
  onDuplicateLifetimeDeal?: (lifetimeDeal: LifetimeDeal) => void;
  onDataLoaded?: (data: { clients: any[], projects: any[], lifetimeDealCount: number }) => void;
}

const LIFETIME_DEAL_STATUSES = [
  { value: 'active', label: 'Active', color: 'bg-emerald-500' },
  { value: 'resold', label: 'Resold', color: 'bg-blue-500' },
  { value: 'shutdown', label: 'Shutdown', color: 'bg-gray-500' },
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
          {selectedCount} lifetime deal{selectedCount !== 1 ? 's' : ''} selected
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

const MobileLifetimeDealCard = ({ 
  lifetimeDeal, 
  onEdit, 
  onDelete, 
  onDuplicate, 
  userRole,
  clients,
  projects
}: {
  lifetimeDeal: LifetimeDeal;
  onEdit: (deal: LifetimeDeal) => void;
  onDelete: (id: string) => void;
  onDuplicate: (deal: LifetimeDeal) => void;
  userRole: string;
  clients: any[];
  projects: any[];
}) => {
  const client = clients.find(c => c.id === lifetimeDeal.client_id);
  const project = projects.find(p => p.id === lifetimeDeal.project_id);
  
  const statusConfig = LIFETIME_DEAL_STATUSES.find(s => s.value === lifetimeDeal.status);
  
  const formatCurrency = (amount: number, currency: string) => {
    const symbols: Record<string, string> = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'CAD': '$'
    };
    return `${symbols[currency] || '$'}${amount.toFixed(2)}`;
  };

  const getProfitLossDisplay = (deal: LifetimeDeal) => {
    if (deal.status === 'active') {
      return <span className="text-gray-400 text-sm">No calculation</span>;
    }
    
    if (deal.status === 'shutdown') {
      const loss = deal.original_cost;
      return (
        <div className="flex items-center gap-1 text-red-600">
          <TrendingDown className="h-3 w-3" />
          <span className="text-sm font-medium">
            {formatCurrency(loss, deal.currency)} loss
          </span>
        </div>
      );
    }
    
    if (deal.status === 'resold' && deal.resold_price) {
      const profitLoss = deal.resold_price - deal.original_cost;
      const isProfit = profitLoss > 0;
      
      return (
        <div className={`flex items-center gap-1 ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
          {isProfit ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          <span className="text-sm font-medium">
            {formatCurrency(Math.abs(profitLoss), deal.currency)} {isProfit ? 'profit' : 'loss'}
          </span>
        </div>
      );
    }
    
    return <span className="text-gray-400">-</span>;
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold">{lifetimeDeal.service_name}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge 
                variant="secondary" 
                className={`${statusConfig?.color} text-white`}
              >
                {statusConfig?.label}
              </Badge>
              <Badge variant="outline">
                {lifetimeDeal.category.charAt(0).toUpperCase() + lifetimeDeal.category.slice(1)}
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
                <DropdownMenuItem onClick={() => onEdit(lifetimeDeal)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate(lifetimeDeal)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(lifetimeDeal.id)}
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
                {formatCurrency(lifetimeDeal.original_cost, lifetimeDeal.currency)}
              </span>
              <span className="text-sm text-gray-500">original cost</span>
            </div>
            {getProfitLossDisplay(lifetimeDeal)}
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm">
              Purchased: {new Date(lifetimeDeal.purchase_date).toLocaleDateString()}
            </span>
          </div>

          {lifetimeDeal.status === 'resold' && lifetimeDeal.resold_date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm">
                Resold: {new Date(lifetimeDeal.resold_date).toLocaleDateString()}
                {lifetimeDeal.resold_price && (
                  <span className="ml-2 font-medium">
                    for {formatCurrency(lifetimeDeal.resold_price, lifetimeDeal.currency)}
                  </span>
                )}
              </span>
            </div>
          )}

          {lifetimeDeal.status === 'shutdown' && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-red-600">
                Service shutdown - Total loss: {formatCurrency(lifetimeDeal.original_cost, lifetimeDeal.currency)}
              </span>
            </div>
          )}

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
          
          {lifetimeDeal.notes && (
            <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
              {lifetimeDeal.notes}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export function LifetimeDealsTable({
  userTier = 'free',
  userRole = 'admin',
  onEditLifetimeDeal,
  onDeleteLifetimeDeal,
  onAddLifetimeDeal,
  onDuplicateLifetimeDeal,
  onDataLoaded = () => {}
}: LifetimeDealsTableProps) {
  // Table state
  const [sortField, setSortField] = useState<SortField>('purchase_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedLifetimeDeals, setSelectedLifetimeDeals] = useState<Set<string>>(new Set());
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const hasNotifiedParent = useRef(false);

  // React Query hooks for data fetching
  const { data: lifetimeDeals = [], isLoading: lifetimeDealsLoading, error: lifetimeDealsError } = useLifetimeDeals({
    status: statusFilter,
    client_id: clientFilter,
    category: categoryFilter
  });
  
  const { data: clients = [], isLoading: clientsLoading } = useClients();
  const { data: projects = [], isLoading: projectsLoading } = useProjectsWithCosts();
  
  // Delete mutation
  const deleteLifetimeDealMutation = useDeleteLifetimeDeal();

  const isLoading = lifetimeDealsLoading || clientsLoading || projectsLoading;
  const hasError = lifetimeDealsError;

  // Notify parent when data is loaded - consistent dependency array
  useEffect(() => {
    if (!isLoading && clients.length >= 0 && projects.length >= 0 && lifetimeDeals.length >= 0 && !hasNotifiedParent.current) {
      hasNotifiedParent.current = true;
      const tableData = {
        clients,
        projects,
        lifetimeDealCount: lifetimeDeals.length
      };
      onDataLoaded(tableData);
    }
  }, [isLoading, clients, projects, lifetimeDeals, onDataLoaded]);

  // Reset notification flag when component mounts (due to key prop change)
  useEffect(() => {
    hasNotifiedParent.current = false;
  }, []);

  // Filter and sort lifetime deals
  const filteredAndSortedLifetimeDeals = React.useMemo(() => {
    let filtered = lifetimeDeals;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(deal =>
        deal.service_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deal.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deal.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        clients.find(c => c.id === deal.client_id)?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        projects.find(p => p.id === deal.project_id)?.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'original_cost') {
        aValue = Number(aValue);
        bValue = Number(bValue);
      } else if (sortField === 'purchase_date') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (sortField === 'profit_loss') {
        aValue = a.profit_loss || 0;
        bValue = b.profit_loss || 0;
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [lifetimeDeals, searchQuery, sortField, sortDirection, clients, projects]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this lifetime deal?')) {
      try {
        await deleteLifetimeDealMutation.mutateAsync(id);
        onDeleteLifetimeDeal?.(id);
      } catch (error) {
        // Error handling is done by the mutation
      }
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLifetimeDeals(new Set(filteredAndSortedLifetimeDeals.map(deal => deal.id)));
    } else {
      setSelectedLifetimeDeals(new Set());
    }
  };

  const handleSelectLifetimeDeal = (id: string, checked: boolean) => {
    const newSelection = new Set(selectedLifetimeDeals);
    if (checked) {
      newSelection.add(id);
    } else {
      newSelection.delete(id);
    }
    setSelectedLifetimeDeals(newSelection);
  };

  // Bulk operations
  const handleBulkEdit = () => {
    // TODO: Implement bulk edit modal
    console.log('Bulk edit:', Array.from(selectedLifetimeDeals));
  };

  const handleBulkDelete = () => {
    if (selectedLifetimeDeals.size === 0) return;
    
    const selectedIds = Array.from(selectedLifetimeDeals);
    const selectedNames = filteredAndSortedLifetimeDeals
      .filter(deal => selectedIds.includes(deal.id))
      .map(deal => deal.service_name);
    
    // Call the delete handler with the array of selected IDs and names for bulk delete
    if (onDeleteLifetimeDeal) {
      onDeleteLifetimeDeal(selectedIds, selectedNames);
    }
    
    // Clear selection
    setSelectedLifetimeDeals(new Set());
  };

  const handleClearSelection = () => {
    setSelectedLifetimeDeals(new Set());
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

  const getProfitLossDisplay = (deal: LifetimeDeal) => {
    if (deal.status !== 'resold' || !deal.resold_price) {
      return <span className="text-gray-400">-</span>;
    }
    
    const profitLoss = deal.resold_price - deal.original_cost;
    const isProfit = profitLoss > 0;
    
    return (
      <div className={`flex items-center gap-1 ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
        {isProfit ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        <span className="font-medium">
          {formatCurrency(Math.abs(profitLoss), deal.currency)}
        </span>
      </div>
    );
  };

  if (hasError) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Lifetime Deals</h3>
          <p className="text-gray-600">
            {hasError instanceof Error ? hasError.message : 'Failed to load lifetime deals. Please try again.'}
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
          <p className="text-gray-600">Loading lifetime deals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bulk Operations Toolbar */}
      {selectedLifetimeDeals.size > 0 && (
        <BulkOperationsToolbar
          selectedCount={selectedLifetimeDeals.size}
          onClearSelection={handleClearSelection}
          onBulkEdit={handleBulkEdit}
          onBulkDelete={handleBulkDelete}
          userRole={userRole}
        />
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search lifetime deals..."
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
              {LIFETIME_DEAL_STATUSES.map(status => (
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
                    checked={selectedLifetimeDeals.size === filteredAndSortedLifetimeDeals.length && filteredAndSortedLifetimeDeals.length > 0}
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
                    onClick={() => handleSort('original_cost')}
                    className="h-auto p-0 font-medium"
                  >
                    Original Cost
                    {getSortIcon('original_cost')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('purchase_date')}
                    className="h-auto p-0 font-medium"
                  >
                    Purchase Date
                    {getSortIcon('purchase_date')}
                  </Button>
                </TableHead>
                <TableHead>Resold Value</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('profit_loss')}
                    className="h-auto p-0 font-medium"
                  >
                    Profit/Loss
                    {getSortIcon('profit_loss')}
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
              {filteredAndSortedLifetimeDeals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={userRole === 'admin' ? 10 : 9} className="text-center py-8">
                    <div className="text-gray-500">
                      {searchQuery || statusFilter !== 'all' || clientFilter !== 'all' || categoryFilter !== 'all' 
                        ? 'No lifetime deals match your filters.' 
                        : 'No lifetime deals yet. Add your first lifetime deal to get started.'}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedLifetimeDeals.map((lifetimeDeal) => {
                  const client = clients.find(c => c.id === lifetimeDeal.client_id);
                  const project = projects.find(p => p.id === lifetimeDeal.project_id);
                  const statusConfig = LIFETIME_DEAL_STATUSES.find(s => s.value === lifetimeDeal.status);
                  
                  return (
                    <TableRow key={lifetimeDeal.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedLifetimeDeals.has(lifetimeDeal.id)}
                          onCheckedChange={(checked) => handleSelectLifetimeDeal(lifetimeDeal.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {lifetimeDeal.service_name}
                        {lifetimeDeal.notes && (
                          <div className="text-sm text-gray-500 mt-1">
                            {lifetimeDeal.notes.substring(0, 50)}
                            {lifetimeDeal.notes.length > 50 && '...'}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(lifetimeDeal.original_cost, lifetimeDeal.currency)}
                      </TableCell>
                      <TableCell>
                        {new Date(lifetimeDeal.purchase_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {lifetimeDeal.status === 'resold' && lifetimeDeal.resold_price 
                          ? formatCurrency(lifetimeDeal.resold_price, lifetimeDeal.currency)
                          : lifetimeDeal.status === 'shutdown' 
                            ? formatCurrency(0, lifetimeDeal.currency)
                            : <span className="text-gray-400">-</span>
                        }
                      </TableCell>
                      <TableCell>
                        {getProfitLossDisplay(lifetimeDeal)}
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
                          {lifetimeDeal.category.charAt(0).toUpperCase() + lifetimeDeal.category.slice(1)}
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
                              <DropdownMenuItem onClick={() => onEditLifetimeDeal?.(lifetimeDeal)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onDuplicateLifetimeDeal?.(lifetimeDeal)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(lifetimeDeal.id)}
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
        {filteredAndSortedLifetimeDeals.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchQuery || statusFilter !== 'all' || clientFilter !== 'all' || categoryFilter !== 'all' 
              ? 'No lifetime deals match your filters.' 
              : 'No lifetime deals yet. Add your first lifetime deal to get started.'}
          </div>
        ) : (
          filteredAndSortedLifetimeDeals.map((lifetimeDeal) => (
            <MobileLifetimeDealCard
              key={lifetimeDeal.id}
              lifetimeDeal={lifetimeDeal}
              onEdit={onEditLifetimeDeal || (() => {})}
              onDelete={handleDelete}
              onDuplicate={onDuplicateLifetimeDeal || (() => {})}
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
