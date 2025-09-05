// Updated 2024-12-20: Optimized EditSubscriptionModal with React Query optimistic updates
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
import { AlertTriangle, Loader2, Plus, X } from 'lucide-react';
import { useUpdateSubscription, type Subscription, type UpdateSubscriptionData } from '@/lib/react-query/subscriptions';
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

interface EditSubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: Subscription | null;
  onSuccess?: () => void;
  userTaxRate?: number;
  userCurrency?: string;
}

interface SubscriptionFormData {
  service_name: string;
  cost: string;
  billing_cycle: 'weekly' | 'monthly' | 'quarterly' | 'annual';
  next_billing_date: string;
  category: string;
  status: 'active' | 'cancelled' | 'paused';
  currency: string;
  client_id: string;
  project_id: string;
  business_expense: boolean;
  tax_deductible: boolean;
  notes: string;
  tax_rate: string;
}

const BILLING_CYCLES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annual', label: 'Annual' },
];

const SUBSCRIPTION_STATUSES = [
  { value: 'active', label: 'Active', color: 'bg-emerald-500' },
  { value: 'paused', label: 'Paused', color: 'bg-amber-500' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500' },
];

const CURRENCIES = [
  { value: 'USD', label: 'USD ($)', symbol: '$' },
  { value: 'EUR', label: 'EUR (€)', symbol: '€' },
  { value: 'GBP', label: 'GBP (£)', symbol: '£' },
  { value: 'CAD', label: 'CAD ($)', symbol: '$' },
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

export function EditSubscriptionModal({
  open,
  onOpenChange,
  subscription,
  onSuccess,
  userTaxRate = 30.0,
  userCurrency = 'USD'
}: EditSubscriptionModalProps) {
  
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [internalProjectName, setInternalProjectName] = useState('');

  // React Query mutation for optimistic updates
  const updateSubscriptionMutation = useUpdateSubscription();

  const [formData, setFormData] = useState<SubscriptionFormData>({
    service_name: '',
    cost: '',
    billing_cycle: 'monthly',
    next_billing_date: '',
    category: 'software',
    status: 'active',
    currency: userCurrency,
    client_id: '',
    project_id: '',
    business_expense: true,
    tax_deductible: true,
    notes: '',
    tax_rate: userTaxRate.toString(),
  });

  // Load data when modal opens
  useEffect(() => {
    if (open && subscription) {
      loadInitialData();
      populateForm();
    }
  }, [open, subscription]);

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
    if (!subscription) return;

    setFormData({
      service_name: subscription.service_name,
      cost: subscription.cost.toString(),
      billing_cycle: subscription.billing_cycle,
      next_billing_date: formatDateForInput(subscription.next_billing_date),
      category: subscription.category,
      status: subscription.status,
      currency: subscription.currency,
      client_id: subscription.client_id || 'internal',
      project_id: subscription.project_id || '',
      business_expense: subscription.business_expense,
      tax_deductible: subscription.tax_deductible,
      notes: subscription.notes || '',
      tax_rate: (subscription.tax_rate || userTaxRate).toString(),
    });

    // Extract internal project name from notes if it exists
    if (subscription.notes && subscription.notes.startsWith('Internal Project:')) {
      const match = subscription.notes.match(/^Internal Project: ([^\n]+)/);
      if (match) {
        setInternalProjectName(match[1]);
      }
    }
  };

  const validateForm = (): string | null => {
    if (!formData.service_name.trim()) return 'Service name is required';
    if (!formData.cost || isNaN(parseFloat(formData.cost)) || parseFloat(formData.cost) <= 0) {
      return 'Valid cost is required';
    }
    if (!formData.next_billing_date) return 'Next billing date is required';
    if (!formData.tax_rate || isNaN(parseFloat(formData.tax_rate)) || parseFloat(formData.tax_rate) < 0) {
      return 'Valid tax rate is required';
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

    if (!subscription) return;

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

      const updateData: UpdateSubscriptionData = {
        id: subscription.id,
        service_name: formData.service_name.trim(),
        cost: parseFloat(formData.cost),
        billing_cycle: formData.billing_cycle,
        next_billing_date: formData.next_billing_date,
        category: formData.category,
        status: formData.status,
        currency: formData.currency,
        client_id: isInternal ? undefined : formData.client_id,
        project_id: (formData.project_id && formData.project_id !== 'none') ? formData.project_id : undefined,
        business_expense: formData.business_expense,
        tax_deductible: formData.tax_deductible,
        notes: finalNotes || undefined,
        tax_rate: parseFloat(formData.tax_rate),
      };

      // Use React Query mutation with optimistic updates
      await updateSubscriptionMutation.mutateAsync(updateData);

      // Close modal immediately - optimistic update has already happened
      onOpenChange(false);
      onSuccess?.();
      
    } catch (err) {
      // Error handling is done by the React Query mutation
      setError(err instanceof Error ? err.message : 'Failed to update subscription');
    }
  };

  const handleClose = () => {
    if (!updateSubscriptionMutation.isPending) {
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

  const isLoading = updateSubscriptionMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Edit Subscription
            {subscription && (
              <Badge 
                variant="secondary" 
                className={`${SUBSCRIPTION_STATUSES.find(s => s.value === subscription.status)?.color} text-white`}
              >
                {SUBSCRIPTION_STATUSES.find(s => s.value === subscription.status)?.label}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Update your subscription details. Changes will be saved immediately with optimistic updates.
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
              placeholder="e.g., Notion, Figma, Adobe Creative Suite"
              disabled={isLoading}
              required
            />
          </div>

          {/* Cost and Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cost">Cost *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  {getCurrencySymbol(formData.currency)}
                </span>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
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

          {/* Billing Cycle and Next Billing Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="billing_cycle">Billing Cycle *</Label>
              <Select
                value={formData.billing_cycle}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, billing_cycle: value }))}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BILLING_CYCLES.map(cycle => (
                    <SelectItem key={cycle.value} value={cycle.value}>
                      {cycle.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="next_billing_date">Next Billing Date *</Label>
              <Input
                id="next_billing_date"
                type="date"
                value={formData.next_billing_date}
                onChange={(e) => setFormData(prev => ({ ...prev, next_billing_date: e.target.value }))}
                disabled={isLoading}
                required
              />
            </div>
          </div>

          {/* Category and Status */}
          <div className="grid grid-cols-2 gap-4">
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
                  {SUBSCRIPTION_STATUSES.map(status => (
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
              placeholder="Additional notes about this subscription..."
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
              {isLoading ? 'Updating...' : 'Update Subscription'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
