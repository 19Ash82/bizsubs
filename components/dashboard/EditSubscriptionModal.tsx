"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
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
  business_expense: boolean;
  tax_deductible: boolean;
  notes?: string;
  tax_rate?: number;
  cancelled_date?: string;
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
  cancelled_date: string;
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
  { value: 'CAD', label: 'CAD ($)', symbol: 'C$' },
];

const CATEGORIES = [
  'software',
  'marketing',
  'design',
  'infrastructure',
  'communication',
  'productivity',
  'analytics',
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
    cancelled_date: '',
  });

  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [internalProjectName, setInternalProjectName] = useState("");

  // Initialize form with subscription data
  useEffect(() => {
    if (subscription && open) {
      // Extract internal project name from notes if it exists
      let notes = subscription.notes || '';
      let extractedProjectName = '';
      
      if (!subscription.client_id && notes.startsWith('Internal Project: ')) {
        extractedProjectName = notes.replace('Internal Project: ', '');
        notes = ''; // Clear notes since it was just storing the project name
      }
      
      setFormData({
        service_name: subscription.service_name,
        cost: subscription.cost.toString(),
        billing_cycle: subscription.billing_cycle,
        next_billing_date: subscription.next_billing_date,
        category: subscription.category,
        status: subscription.status,
        currency: subscription.currency,
        client_id: subscription.client_id || 'internal',
        project_id: subscription.project_id || 'none',
        business_expense: subscription.business_expense,
        tax_deductible: subscription.tax_deductible,
        notes: notes,
        tax_rate: (subscription.tax_rate || userTaxRate).toString(),
        cancelled_date: subscription.cancelled_date || '',
      });
      
      setInternalProjectName(extractedProjectName);
    }
  }, [subscription, open, userTaxRate]);

  // Fetch clients and projects
  useEffect(() => {
    if (open) {
      fetchClients();
      fetchProjects();
    }
  }, [open]);

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

  // Show all projects - subscriptions can be assigned to any project regardless of client
  const availableProjects = projects;

  // Clear internal project name when switching away from internal client
  useEffect(() => {
    if (formData.client_id && formData.client_id !== 'internal' && formData.client_id !== 'none') {
      // Switching to external client - clear internal project name
      setInternalProjectName('');
    }
    // Note: We no longer clear project_id when client changes since projects can be assigned regardless of client
  }, [formData.client_id]);

  const handleInputChange = (field: keyof SubscriptionFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  // Auto-set cancelled_date when status changes to cancelled or paused
  useEffect(() => {
    if ((formData.status === 'cancelled' || formData.status === 'paused') && !formData.cancelled_date) {
      const today = new Date().toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, cancelled_date: today }));
    } else if (formData.status === 'active' && formData.cancelled_date) {
      // Clear cancelled_date when status becomes active
      setFormData(prev => ({ ...prev, cancelled_date: '' }));
    }
  }, [formData.status, formData.cancelled_date]);

  const validateForm = (): string | null => {
    if (!formData.service_name.trim()) return 'Service name is required';
    if (!formData.cost || isNaN(parseFloat(formData.cost)) || parseFloat(formData.cost) <= 0) {
      return 'Valid cost is required';
    }
    if (!formData.next_billing_date) return 'Next billing date is required';
    if (!formData.tax_rate || isNaN(parseFloat(formData.tax_rate)) || parseFloat(formData.tax_rate) < 0) {
      return 'Valid tax rate is required';
    }
    if ((formData.status === 'cancelled' || formData.status === 'paused') && !formData.cancelled_date) {
      return `${formData.status === 'cancelled' ? 'Cancellation' : 'Pause'} date is required`;
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

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      
      // Handle client_id and notes for internal projects
      const isInternal = !formData.client_id || formData.client_id === 'internal';
      let finalNotes = formData.notes.trim();
      
      // For internal projects, store project name in notes if provided
      if (isInternal && internalProjectName.trim()) {
        finalNotes = finalNotes 
          ? `Internal Project: ${internalProjectName.trim()}\n\n${finalNotes}`
          : `Internal Project: ${internalProjectName.trim()}`;
      }

      const updateData = {
        service_name: formData.service_name.trim(),
        cost: parseFloat(formData.cost),
        billing_cycle: formData.billing_cycle,
        next_billing_date: formData.next_billing_date,
        category: formData.category,
        status: formData.status,
        currency: formData.currency,
        client_id: isInternal ? null : formData.client_id,
        project_id: (formData.project_id && formData.project_id !== 'none') ? formData.project_id : null,
        business_expense: formData.business_expense,
        tax_deductible: formData.tax_deductible,
        notes: finalNotes || null,
        tax_rate: parseFloat(formData.tax_rate),
        cancelled_date: formData.cancelled_date || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('subscriptions')
        .update(updateData)
        .eq('id', subscription.id);

      if (error) throw error;

      // Log activity
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        await supabase.from('activity_logs').insert({
          user_id: userData.user.id,
          user_email: userData.user.email!,
          action_type: 'update',
          resource_type: 'subscription',
          resource_id: subscription.id,
          description: `Updated subscription: ${formData.service_name}`,
        });
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
      setError(null);
      setInternalProjectName('');
    }
  };

  // Format date for input
  const formatDateForInput = (dateString: string) => {
    return new Date(dateString).toISOString().split('T')[0];
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Edit Subscription
            <Badge variant="outline" className="text-xs">
              {subscription?.service_name}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Update subscription details and billing information.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Service Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="service_name">Service Name *</Label>
                <Input
                  id="service_name"
                  value={formData.service_name}
                  onChange={(e) => handleInputChange('service_name', e.target.value)}
                  placeholder="e.g., Figma Pro, GitHub Enterprise"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleInputChange('category', value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        <span className="capitalize">{category}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Billing Details */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Billing Details</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost">Cost *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                    {CURRENCIES.find(c => c.value === formData.currency)?.symbol || '$'}
                  </span>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost}
                    onChange={(e) => handleInputChange('cost', e.target.value)}
                    className="pl-8"
                    placeholder="0.00"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => handleInputChange('currency', value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="billing_cycle">Billing Cycle</Label>
                <Select
                  value={formData.billing_cycle}
                  onValueChange={(value: any) => handleInputChange('billing_cycle', value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BILLING_CYCLES.map((cycle) => (
                      <SelectItem key={cycle.value} value={cycle.value}>
                        {cycle.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="next_billing_date">Next Billing Date *</Label>
                <Input
                  id="next_billing_date"
                  type="date"
                  value={formData.next_billing_date}
                  onChange={(e) => handleInputChange('next_billing_date', e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => handleInputChange('status', value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBSCRIPTION_STATUSES.map((status) => (
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

            {/* Cancelled Date - Only show when status is cancelled or paused */}
            {(formData.status === 'cancelled' || formData.status === 'paused') && (
              <div className="space-y-2">
                <Label htmlFor="cancelled_date">
                  {formData.status === 'cancelled' ? 'Cancellation Date' : 'Pause Date'} *
                </Label>
                <Input
                  id="cancelled_date"
                  type="date"
                  value={formData.cancelled_date}
                  onChange={(e) => handleInputChange('cancelled_date', e.target.value)}
                  disabled={loading}
                  required
                />
                <p className="text-sm text-gray-500">
                  {formData.status === 'cancelled' 
                    ? 'Enter the date when this subscription was cancelled for accurate tax calculations.'
                    : 'Enter the date when this subscription was paused for accurate tax calculations.'
                  }
                </p>
              </div>
            )}
          </div>

          {/* Assignment */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Assignment</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_id">Client</Label>
                <Select
                  value={formData.client_id}
                  onValueChange={(value) => handleInputChange('client_id', value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Internal</SelectItem>
                    {clients.map((client) => (
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
                <Select
                  value={formData.project_id}
                  onValueChange={(value) => handleInputChange('project_id', value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Project</SelectItem>
                    {availableProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: project.color_hex }}
                          />
                          <span>{project.name}</span>
                          {project.client_id && (
                            <span className="text-xs text-muted-foreground">
                              ({clients.find(c => c.id === project.client_id)?.name || 'Unknown Client'})
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Business & Tax */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Business & Tax</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="business_expense"
                    checked={formData.business_expense}
                    onCheckedChange={(checked) => handleInputChange('business_expense', checked as boolean)}
                    disabled={loading}
                  />
                  <Label htmlFor="business_expense" className="text-sm font-medium">
                    Business Expense
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="tax_deductible"
                    checked={formData.tax_deductible}
                    onCheckedChange={(checked) => handleInputChange('tax_deductible', checked as boolean)}
                    disabled={loading}
                  />
                  <Label htmlFor="tax_deductible" className="text-sm font-medium">
                    Tax Deductible
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                <Input
                  id="tax_rate"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.tax_rate}
                  onChange={(e) => handleInputChange('tax_rate', e.target.value)}
                  placeholder="30.0"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes or details about this subscription..."
              rows={3}
              disabled={loading}
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Update Subscription
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
