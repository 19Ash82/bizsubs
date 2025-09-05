// Updated 2024-12-20: Optimized AddSubscriptionModal with React Query optimistic updates
// Eliminates page refreshes and implements PRD performance requirements

"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Loader2, Plus, X } from "lucide-react";
import { useCreateSubscription, type CreateSubscriptionData } from "@/lib/react-query/subscriptions";

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
  status: string;
}

interface AddSubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  userTier?: 'free' | 'pro' | 'team';
  userCurrency?: string;
  userTaxRate?: number;
  preloadedClients?: Client[];
  preloadedProjects?: Project[];
  preloadedSubscriptionCount?: number;
}

const subscriptionSchema = z.object({
  service_name: z.string().min(1, "Service name is required"),
  cost: z.number().min(0.01, "Cost must be at least $0.01"),
  billing_cycle: z.enum(["weekly", "monthly", "quarterly", "annual"]),
  next_billing_date: z.string().min(1, "Next billing date is required"),
  client_id: z.string().optional(),
  project_id: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  business_expense: z.boolean(),
  tax_deductible: z.boolean(),
  tax_rate: z.number().min(0).max(100),
  currency: z.enum(["USD", "EUR", "GBP", "CAD"]),
  status: z.enum(["active", "cancelled", "paused"]),
  notes: z.string().optional(),
});

type SubscriptionFormData = z.infer<typeof subscriptionSchema>;

const BILLING_CYCLES = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annual", label: "Annual" },
];

const CURRENCIES = [
  { value: "USD", label: "USD ($)", symbol: "$" },
  { value: "EUR", label: "EUR (€)", symbol: "€" },
  { value: "GBP", label: "GBP (£)", symbol: "£" },
  { value: "CAD", label: "CAD ($)", symbol: "$" },
];

const CATEGORIES = [
  "software",
  "marketing",
  "design",
  "infrastructure",
  "analytics",
  "productivity",
  "communication",
  "security",
  "hosting",
  "other",
];

const STATUSES = [
  { value: "active", label: "Active", color: "bg-emerald-500" },
  { value: "paused", label: "Paused", color: "bg-amber-500" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-500" },
];

export function AddSubscriptionModal({ 
  open, 
  onOpenChange, 
  onSuccess,
  userTier = 'free',
  userCurrency = 'USD',
  userTaxRate = 30.0,
  preloadedClients,
  preloadedProjects,
  preloadedSubscriptionCount
}: AddSubscriptionModalProps) {
  
  const [clients, setClients] = useState<Client[]>(preloadedClients || []);
  const [projects, setProjects] = useState<Project[]>(preloadedProjects || []);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [subscriptionCount, setSubscriptionCount] = useState(preloadedSubscriptionCount || 0);
  const [internalProjectName, setInternalProjectName] = useState("");

  // React Query mutation for optimistic updates
  const createSubscriptionMutation = useCreateSubscription();

  const form = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      service_name: "",
      cost: 0,
      billing_cycle: "monthly",
      next_billing_date: "",
      client_id: undefined,
      project_id: undefined,
      category: "software",
      business_expense: true,
      tax_deductible: true,
      tax_rate: userTaxRate,
      currency: userCurrency as "USD" | "EUR" | "GBP" | "CAD",
      status: "active",
      notes: "",
    },
  });

  const watchedClientId = form.watch("client_id");

  // Load initial data when modal opens
  useEffect(() => {
    if (open && !preloadedClients) {
      loadInitialData();
    }
  }, [open, preloadedClients]);

  // Filter projects when client changes
  useEffect(() => {
    if (watchedClientId && watchedClientId !== "internal") {
      const clientProjects = projects.filter(p => p.client_id === watchedClientId);
      setFilteredProjects(clientProjects);
    } else {
      setFilteredProjects([]);
      form.setValue("project_id", undefined);
    }
  }, [watchedClientId, projects, form]);

  const loadInitialData = async () => {
    if (preloadedClients && preloadedProjects) return;
    
    setIsLoadingData(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [clientsResponse, projectsResponse, subscriptionsResponse] = await Promise.all([
        supabase
          .from("clients")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "active")
          .order("name"),
        supabase
          .from("projects")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "active")
          .order("name"),
        supabase
          .from("subscriptions")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "active")
      ]);

      if (clientsResponse.data) setClients(clientsResponse.data);
      if (projectsResponse.data) setProjects(projectsResponse.data);
      if (subscriptionsResponse.data) setSubscriptionCount(subscriptionsResponse.data.length);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const checkFreeTierLimit = (): boolean => {
    const isFreeUser = userTier === 'free';
    if (isFreeUser && subscriptionCount >= 3) {
      return false;
    }
    return true;
  };

  const onSubmit = async (data: SubscriptionFormData) => {
    try {
      // Check free tier limits
      if (!checkFreeTierLimit()) {
        toast.error(
          "Free plan limit reached",
          {
            description: "You can only track 3 items on the free plan. Upgrade to add more subscriptions.",
            action: {
              label: "Upgrade",
              onClick: () => window.location.href = "/upgrade"
            }
          }
        );
        return;
      }

      // Prepare subscription data
      let finalNotes = data.notes?.trim() || "";
      
      // Handle internal project name
      if ((!data.client_id || data.client_id === "internal") && internalProjectName.trim()) {
        finalNotes = finalNotes 
          ? `Internal Project: ${internalProjectName.trim()}\n\n${finalNotes}`
          : `Internal Project: ${internalProjectName.trim()}`;
      }

      const subscriptionData: CreateSubscriptionData = {
        service_name: data.service_name.trim(),
        cost: data.cost,
        billing_cycle: data.billing_cycle,
        next_billing_date: data.next_billing_date,
        client_id: (data.client_id && data.client_id !== "internal") ? data.client_id : undefined,
        project_id: data.project_id || undefined,
        category: data.category,
        business_expense: data.business_expense,
        tax_deductible: data.tax_deductible,
        tax_rate: data.tax_rate,
        currency: data.currency,
        status: data.status,
        notes: finalNotes || undefined,
      };

      // Use React Query mutation with optimistic updates
      await createSubscriptionMutation.mutateAsync(subscriptionData);

      // Close modal and reset form immediately - optimistic update has already happened
      onOpenChange(false);
      form.reset();
      setInternalProjectName("");
      onSuccess?.();

    } catch (error) {
      // Error handling is done by the React Query mutation
      console.error("Error creating subscription:", error);
    }
  };

  const handleClose = () => {
    if (!createSubscriptionMutation.isPending) {
      onOpenChange(false);
      form.reset();
      setInternalProjectName("");
    }
  };

  const getCurrencySymbol = (currency: string) => {
    return CURRENCIES.find(c => c.value === currency)?.symbol || '$';
  };

  const isLoading = createSubscriptionMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Subscription
            {userTier === 'free' && (
              <Badge variant="secondary" className="text-xs">
                {subscriptionCount}/3 Free Plan
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Add a new subscription to track. Changes will be saved immediately with optimistic updates.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Service Name */}
          <div className="space-y-2">
            <Label htmlFor="service_name">Service Name *</Label>
            <Input
              id="service_name"
              {...form.register("service_name")}
              placeholder="e.g., Notion, Figma, Adobe Creative Suite"
              disabled={isLoading}
            />
            {form.formState.errors.service_name && (
              <p className="text-sm text-red-600">{form.formState.errors.service_name.message}</p>
            )}
          </div>

          {/* Cost and Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cost">Cost *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  {getCurrencySymbol(form.watch("currency"))}
                </span>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min="0.01"
                  {...form.register("cost", { valueAsNumber: true })}
                  className="pl-8"
                  placeholder="0.00"
                  disabled={isLoading}
                />
              </div>
              {form.formState.errors.cost && (
                <p className="text-sm text-red-600">{form.formState.errors.cost.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency *</Label>
              <Select
                value={form.watch("currency")}
                onValueChange={(value) => form.setValue("currency", value as any)}
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
                value={form.watch("billing_cycle")}
                onValueChange={(value) => form.setValue("billing_cycle", value as any)}
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
                {...form.register("next_billing_date")}
                min={new Date().toISOString().split('T')[0]}
                disabled={isLoading}
              />
              {form.formState.errors.next_billing_date && (
                <p className="text-sm text-red-600">{form.formState.errors.next_billing_date.message}</p>
              )}
            </div>
          </div>

          {/* Category and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={form.watch("category")}
                onValueChange={(value) => form.setValue("category", value)}
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
                value={form.watch("status")}
                onValueChange={(value) => form.setValue("status", value as any)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map(status => (
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
                value={form.watch("client_id") || ""}
                onValueChange={(value) => form.setValue("client_id", value === "" ? undefined : value)}
                disabled={isLoading || isLoadingData}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client or internal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No client</SelectItem>
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
              {watchedClientId === "internal" ? (
                <Input
                  placeholder="Internal project name (optional)"
                  value={internalProjectName}
                  onChange={(e) => setInternalProjectName(e.target.value)}
                  disabled={isLoading}
                />
              ) : (
                <Select
                  value={form.watch("project_id") || ""}
                  onValueChange={(value) => form.setValue("project_id", value === "" ? undefined : value)}
                  disabled={isLoading || !watchedClientId || watchedClientId === "internal"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No project</SelectItem>
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
              {...form.register("tax_rate", { valueAsNumber: true })}
              placeholder="30.0"
              disabled={isLoading}
            />
            {form.formState.errors.tax_rate && (
              <p className="text-sm text-red-600">{form.formState.errors.tax_rate.message}</p>
            )}
          </div>

          {/* Checkboxes */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="business_expense"
                checked={form.watch("business_expense")}
                onCheckedChange={(checked) => form.setValue("business_expense", checked as boolean)}
                disabled={isLoading}
              />
              <Label htmlFor="business_expense" className="text-sm font-medium">
                Business Expense
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="tax_deductible"
                checked={form.watch("tax_deductible")}
                onCheckedChange={(checked) => form.setValue("tax_deductible", checked as boolean)}
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
              {...form.register("notes")}
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
              {isLoading ? 'Adding...' : 'Add Subscription'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
