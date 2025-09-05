// Updated 2024-12-20: EditLifetimeDealModal with React Query optimistic updates
// Eliminates page refreshes and implements PRD performance requirements

"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Loader2, Plus, X, TrendingUp, TrendingDown } from 'lucide-react';
import { useUpdateLifetimeDeal, type LifetimeDeal, type UpdateLifetimeDealData } from '@/lib/react-query/lifetime-deals';
import { createClient } from '@/lib/supabase/client';

// Types
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

interface EditLifetimeDealModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lifetimeDeal: LifetimeDeal | null;
  onSuccess?: () => void;
  userCurrency?: string;
  userTaxRate?: number;
}

interface LifetimeDealFormData {
  service_name: string;
  original_cost: string;
  purchase_date: string;
  category: string;
  status: 'active' | 'resold' | 'shutdown';
  currency: string;
  client_id: string;
  project_id: string;
  business_expense: boolean;
  tax_deductible: boolean;
  resold_price: string;
  resold_date: string;
  notes: string;
  tax_rate: string;
}

const CURRENCIES = [
  { value: 'USD', label: 'USD ($)', symbol: '$' },
  { value: 'EUR', label: 'EUR (€)', symbol: '€' },
  { value: 'GBP', label: 'GBP (£)', symbol: '£' },
  { value: 'CAD', label: 'CAD ($)', symbol: '$' },
];

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

export function EditLifetimeDealModal({
  open,
  onOpenChange,
  lifetimeDeal,
  onSuccess,
  userCurrency = 'USD',
  userTaxRate = 30.0
}: EditLifetimeDealModalProps) {
  
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [internalProjectName, setInternalProjectName] = useState('');

  // React Query mutation for optimistic updates
  const updateLifetimeDealMutation = useUpdateLifetimeDeal();

  const [formData, setFormData] = useState<LifetimeDealFormData>({
    service_name: '',
    original_cost: '',
    purchase_date: '',
    category: 'software',
    status: 'active',
    currency: userCurrency,
    client_id: '',
    project_id: '',
    business_expense: true,
    tax_deductible: true,
    resold_price: '',
    resold_date: '',
    notes: '',
    tax_rate: userTaxRate.toString(),
  });

  // Load data when modal opens
  useEffect(() => {
    if (open && lifetimeDeal) {
      loadInitialData();
      populateForm();
    }
  }, [open, lifetimeDeal]);

  // Filter projects when client changes
  useEffect(() => {
    if (formData.client_id && formData.client_id !== 'internal') {
      const clientProjects = projects.filter(p => p.client_id === formData.client_id);
      setFilteredProjects(clientProjects);
      
      // Reset project selection if current project doesn't belong to selected client
      if (formData.project_id && !clientProjects.find(p => p.id === formData.project_id)) {
        setFormData(prev => ({ ...prev, project_id: '' }));
      }
    } else {
      setFilteredProjects([]);
      setFormData(prev => ({ ...prev, project_id: '' }));
    }
  }, [formData.client_id, projects]);

  // Handle status changes - clear/set resold fields appropriately
  useEffect(() => {
    if (formData.status === 'shutdown') {
      setFormData(prev => ({
        ...prev,
        resold_price: '0',
        resold_date: ''
      }));
    } else if (formData.status !== 'resold') {
      setFormData(prev => ({
        ...prev,
        resold_price: '',
        resold_date: ''
      }));
    }
  }, [formData.status]);

  const loadInitialData = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load clients and projects
      const [clientsResponse, projectsResponse] = await Promise.all([
        supabase
          .from('clients')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('name'),
        supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('name')
      ]);

      if (clientsResponse.data) setClients(clientsResponse.data);
      if (projectsResponse.data) setProjects(projectsResponse.data);
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  const populateForm = () => {
    if (!lifetimeDeal) return;

    setFormData({
      service_name: lifetimeDeal.service_name,
      original_cost: lifetimeDeal.original_cost.toString(),
      purchase_date: formatDateForInput(lifetimeDeal.purchase_date),
      category: lifetimeDeal.category,
      status: lifetimeDeal.status,
      currency: lifetimeDeal.currency,
      client_id: lifetimeDeal.client_id || 'internal',
      project_id: lifetimeDeal.project_id || '',
      business_expense: lifetimeDeal.business_expense,
      tax_deductible: lifetimeDeal.tax_deductible,
      resold_price: lifetimeDeal.resold_price?.toString() || '',
      resold_date: lifetimeDeal.resold_date ? formatDateForInput(lifetimeDeal.resold_date) : '',
      notes: lifetimeDeal.notes || '',
      tax_rate: (lifetimeDeal.tax_rate || userTaxRate).toString(),
    });

    // Extract internal project name from notes if it exists
    if (lifetimeDeal.notes && lifetimeDeal.notes.startsWith('Internal Project:')) {
      const match = lifetimeDeal.notes.match(/^Internal Project: ([^\n]+)/);
      if (match) {
        setInternalProjectName(match[1]);
      }
    }
  };

  const validateForm = (): string | null => {
    if (!formData.service_name.trim()) return 'Service name is required';
    if (!formData.original_cost || isNaN(parseFloat(formData.original_cost)) || parseFloat(formData.original_cost) <= 0) {
      return 'Valid original cost is required';
    }
    if (!formData.purchase_date) return 'Purchase date is required';
    if (!formData.tax_rate || isNaN(parseFloat(formData.tax_rate)) || parseFloat(formData.tax_rate) < 0) {
      return 'Valid tax rate is required';
    }
    if (formData.status === 'resold') {
      if (!formData.resold_price || isNaN(parseFloat(formData.resold_price)) || parseFloat(formData.resold_price) <= 0) {
        return 'Valid resold price is required when status is resold';
      }
      if (!formData.resold_date) return 'Resold date is required when status is resold';
    }
    return null;
  };

  const calculateProfitLoss = (): number | null => {
    if (formData.status === 'shutdown' && formData.original_cost) {
      const originalCost = parseFloat(formData.original_cost);
      if (!isNaN(originalCost)) {
        return -originalCost; // Total loss
      }
    }
    if (formData.status === 'resold' && formData.original_cost && formData.resold_price) {
      const originalCost = parseFloat(formData.original_cost);
      const resoldPrice = parseFloat(formData.resold_price);
      if (!isNaN(originalCost) && !isNaN(resoldPrice)) {
        return resoldPrice - originalCost;
      }
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!lifetimeDeal) return;

    setError(null);

    try {
      // Handle client_id and notes for internal projects
      const isInternal = !formData.client_id || formData.client_id === 'internal';
      let finalNotes = formData.notes.trim();
      
      // For internal projects, store project name in notes if provided
      if (isInternal && internalProjectName.trim()) {
        finalNotes = finalNotes 
          ? `Internal Project: ${internalProjectName.trim()}\n\n${finalNotes}`
          : `Internal Project: ${internalProjectName.trim()}`;
      }

      const updateData: UpdateLifetimeDealData = {
        id: lifetimeDeal.id,
        service_name: formData.service_name.trim(),
        original_cost: parseFloat(formData.original_cost),
        purchase_date: formData.purchase_date,
        category: formData.category,
        status: formData.status,
        currency: formData.currency,
        client_id: isInternal ? undefined : formData.client_id,
        project_id: (formData.project_id && formData.project_id !== 'none') ? formData.project_id : undefined,
        business_expense: formData.business_expense,
        tax_deductible: formData.tax_deductible,
        resold_price: formData.status === 'resold' && formData.resold_price ? parseFloat(formData.resold_price) : formData.status === 'shutdown' ? 0 : undefined,
        resold_date: formData.status === 'resold' && formData.resold_date ? formData.resold_date : undefined,
        notes: finalNotes || undefined,
        tax_rate: parseFloat(formData.tax_rate),
      };

      // Use React Query mutation with optimistic updates
      await updateLifetimeDealMutation.mutateAsync(updateData);

      // Close modal immediately - optimistic update has already happened
      onOpenChange(false);
      onSuccess?.();
      
    } catch (err) {
      // Error handling is done by the React Query mutation
      setError(err instanceof Error ? err.message : 'Failed to update lifetime deal');
    }
  };

  const handleClose = () => {
    if (!updateLifetimeDealMutation.isPending) {
      onOpenChange(false);
      setError(null);
      setInternalProjectName('');
    }
  };

  // Format date for input
  const formatDateForInput = (dateString: string) => {
    return new Date(dateString).toISOString().split('T')[0];
  };

  const getCurrencySymbol = (currency: string) => {
    return CURRENCIES.find(c => c.value === currency)?.symbol || '$';
  };

  const formatCurrency = (amount: number, currency: string) => {
    return `${getCurrencySymbol(currency)}${amount.toFixed(2)}`;
  };

  const profitLoss = calculateProfitLoss();
  const isLoading = updateLifetimeDealMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Edit Lifetime Deal
            {lifetimeDeal && (
              <Badge 
                variant="secondary" 
                className={`${LIFETIME_DEAL_STATUSES.find(s => s.value === lifetimeDeal.status)?.color} text-white`}
              >
                {LIFETIME_DEAL_STATUSES.find(s => s.value === lifetimeDeal.status)?.label}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Update your lifetime deal details. Changes will be saved immediately with optimistic updates.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Service Name */}
          <div className="space-y-2">
            <Label htmlFor="service_name">Service Name *</Label>
            <Input
              id="service_name"
              type="text"
              value={formData.service_name}
              onChange={(e) => setFormData(prev => ({ ...prev, service_name: e.target.value }))}
              placeholder="e.g., AppSumo Deal, Notion Pro, Figma Lifetime"
              disabled={isLoading}
              required
            />
          </div>

          {/* Original Cost and Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="original_cost">Original Cost *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  {getCurrencySymbol(formData.currency)}
                </span>
                <Input
                  id="original_cost"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.original_cost}
                  onChange={(e) => setFormData(prev => ({ ...prev, original_cost: e.target.value }))}
                  className="pl-8"
                  placeholder="0.00"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency *</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(currency => (
                    <SelectItem key={currency.value} value={currency.value}>
                      {currency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Purchase Date and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchase_date">Purchase Date *</Label>
              <Input
                id="purchase_date"
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData(prev => ({ ...prev, purchase_date: e.target.value }))}
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LIFETIME_DEAL_STATUSES.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${status.color}`} />
                        {status.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Resale Information (shown when status is resold or shutdown) */}
          {(formData.status === 'resold' || formData.status === 'shutdown') && (
            <div className={`space-y-4 p-4 rounded-lg border ${
              formData.status === 'shutdown' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
            }`}>
              <h4 className={`font-medium ${
                formData.status === 'shutdown' ? 'text-red-900' : 'text-blue-900'
              }`}>
                {formData.status === 'shutdown' ? 'Service Shutdown Information' : 'Resale Information'}
              </h4>
              
              {formData.status === 'shutdown' ? (
                <div className="space-y-2">
                  <p className="text-sm text-red-800">
                    Service has been shut down. This represents a total loss of your investment.
                  </p>
                  <div className="p-3 bg-red-100 rounded border border-red-200">
                    <span className="text-red-800 font-medium">
                      Total Loss: {formatCurrency(parseFloat(formData.original_cost) || 0, formData.currency)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="resold_price">Resold Price *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        {getCurrencySymbol(formData.currency)}
                      </span>
                      <Input
                        id="resold_price"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={formData.resold_price}
                        onChange={(e) => setFormData(prev => ({ ...prev, resold_price: e.target.value }))}
                        className="pl-8"
                        placeholder="0.00"
                        disabled={isLoading}
                        required={formData.status === 'resold'}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="resold_date">Resold Date *</Label>
                    <Input
                      id="resold_date"
                      type="date"
                      value={formData.resold_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, resold_date: e.target.value }))}
                      disabled={isLoading}
                      required={formData.status === 'resold'}
                    />
                  </div>
                </div>
              )}
              
              {/* Profit/Loss Calculation */}
              {profitLoss !== null && (
                <div className={`flex items-center gap-2 p-3 rounded ${profitLoss >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {profitLoss >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  <span className="font-medium">
                    {profitLoss >= 0 ? 'Profit' : 'Loss'}: {formatCurrency(Math.abs(profitLoss), formData.currency)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(category => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Client and Project */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client_id">Client</Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value }))}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client or internal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Internal Project</SelectItem>
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="project_id">Project</Label>
              {formData.client_id === 'internal' ? (
                <Input
                  placeholder="Internal project name (optional)"
                  value={internalProjectName}
                  onChange={(e) => setInternalProjectName(e.target.value)}
                  disabled={isLoading}
                />
              ) : (
                <Select
                  value={formData.project_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, project_id: value }))}
                  disabled={isLoading || !formData.client_id || formData.client_id === 'internal'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No project</SelectItem>
                    {filteredProjects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Tax Rate */}
          <div className="space-y-2">
            <Label htmlFor="tax_rate">Tax Rate (%) *</Label>
            <Input
              id="tax_rate"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={formData.tax_rate}
              onChange={(e) => setFormData(prev => ({ ...prev, tax_rate: e.target.value }))}
              placeholder="30.0"
              disabled={isLoading}
              required
            />
          </div>

          {/* Checkboxes */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="business_expense"
                checked={formData.business_expense}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, business_expense: checked as boolean }))
                }
                disabled={isLoading}
              />
              <Label htmlFor="business_expense" className="text-sm font-medium">
                Business Expense
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="tax_deductible"
                checked={formData.tax_deductible}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, tax_deductible: checked as boolean }))
                }
                disabled={isLoading}
              />
              <Label htmlFor="tax_deductible" className="text-sm font-medium">
                Tax Deductible
              </Label>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes about this lifetime deal..."
              rows={3}
              disabled={isLoading}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Updating...' : 'Update Lifetime Deal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
