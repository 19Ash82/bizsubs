// Updated 2024-12-19: Created AddSubscriptionModal component for dashboard subscription management

"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { calculateNextBillingDate, formatDateForInput, getDefaultStartDate, validateStartDate, formatDateForDisplay, validateDateFormat } from "@/lib/utils/billing-dates";
import { DateInput } from "@/components/ui/date-input";

// TypeScript interfaces
interface Client {
  id: string;
  name: string;
  email?: string;
  status: string;
}

interface Project {
  id: string;
  name: string;
  client_id: string;
  description?: string;
  status: string;
}

interface SubscriptionFormData {
  service_name: string;
  cost: number;
  billing_cycle: "weekly" | "monthly" | "quarterly" | "annual";
  start_date: string;
  client_id?: string;
  project_id?: string;
  category: "software" | "marketing" | "design" | "infrastructure" | "other";
  business_expense: boolean;
  tax_deductible: boolean;
  tax_rate: number;
  currency: "USD" | "EUR" | "GBP" | "CAD";
  status: "active" | "cancelled" | "paused";
  notes?: string;
}

// Zod validation schema
const subscriptionSchema = z.object({
  service_name: z.string().min(1, "Service name is required").max(100, "Service name must be less than 100 characters"),
  cost: z.number().positive("Cost must be a positive number").min(0.01, "Minimum cost is $0.01"),
  billing_cycle: z.enum(["weekly", "monthly", "quarterly", "annual"]),
  start_date: z.string().min(1, "Start date is required").refine((date) => {
    const validation = validateStartDate(date);
    return validation.isValid;
  }, "Invalid start date"),
  client_id: z.string().optional(),
  project_id: z.string().optional(),
  category: z.enum(["software", "marketing", "design", "infrastructure", "other"]),
  business_expense: z.boolean(),
  tax_deductible: z.boolean(),
  tax_rate: z.number().min(0, "Tax rate must be 0 or greater").max(100, "Tax rate cannot exceed 100%"),
  currency: z.enum(["USD", "EUR", "GBP", "CAD"]),
  status: z.enum(["active", "cancelled", "paused"]),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional(),
});

interface AddSubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  userTier?: string;
  userCurrency?: string;
  userTaxRate?: number;
  preloadedClients?: Array<{ id: string; name: string; color_hex: string; status: string }>;
  preloadedProjects?: Array<{ id: string; name: string; client_id: string }>;
  preloadedSubscriptionCount?: number;
}

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
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [subscriptionCount, setSubscriptionCount] = useState(0);
  const [internalProjectName, setInternalProjectName] = useState("");
  const [calculatedNextBillingDate, setCalculatedNextBillingDate] = useState<string>("");

  const form = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      service_name: "",
      cost: 0,
      billing_cycle: "monthly",
      start_date: getDefaultStartDate(),
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
  const watchedStartDate = form.watch("start_date");
  const watchedBillingCycle = form.watch("billing_cycle");

  // Auto-calculate next billing date when start date or billing cycle changes
  useEffect(() => {
    if (watchedStartDate && watchedBillingCycle) {
      try {
        const nextDate = calculateNextBillingDate(watchedStartDate, watchedBillingCycle);
        setCalculatedNextBillingDate(formatDateForDisplay(nextDate));
      } catch (error) {
        setCalculatedNextBillingDate("");
      }
    } else {
      setCalculatedNextBillingDate("");
    }
  }, [watchedStartDate, watchedBillingCycle]);

  // Load initial data when modal opens
  useEffect(() => {
    if (open) {
      loadInitialData();
    }
  }, [open]);

  // Filter projects when client changes
  useEffect(() => {
    if (watchedClientId && watchedClientId !== "internal") {
      const clientProjects = projects.filter(project => project.client_id === watchedClientId);
      setFilteredProjects(clientProjects);
      // Reset project selection when client changes
      form.setValue("project_id", undefined);
      setInternalProjectName(""); // Clear internal project name when switching to external client
    } else {
      setFilteredProjects([]);
      form.setValue("project_id", undefined);
      if (watchedClientId !== "internal") {
        setInternalProjectName(""); // Clear internal project name when no client selected
      }
    }
  }, [watchedClientId, projects, form]);

  const loadInitialData = async () => {
    // Use preloaded data if available to avoid loading spinner
    if (preloadedClients && preloadedProjects && preloadedSubscriptionCount !== undefined) {
      setClients(preloadedClients);
      setProjects(preloadedProjects);
      setSubscriptionCount(preloadedSubscriptionCount);
      return;
    }

    // Fallback to fetching data if not preloaded
    setIsLoadingData(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please log in to continue");
        return;
      }

      // Load clients, projects, and check subscription count in parallel
      const [clientsResult, projectsResult, subscriptionCountResult] = await Promise.all([
        supabase.from("clients").select("*").eq("user_id", user.id).eq("status", "active"),
        supabase.from("projects").select("*").eq("user_id", user.id).eq("status", "active"),
        supabase.from("subscriptions").select("id", { count: "exact" }).eq("user_id", user.id)
      ]);

      if (clientsResult.data) setClients(clientsResult.data);
      if (projectsResult.data) setProjects(projectsResult.data);
      if (subscriptionCountResult.count !== null) setSubscriptionCount(subscriptionCountResult.count);

    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
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
    setIsLoading(true);

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

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please log in to continue");
        return;
      }

      // Calculate next billing date from start date
      const nextBillingDate = calculateNextBillingDate(data.start_date, data.billing_cycle);

      // Prepare subscription data
      const subscriptionData = {
        user_id: user.id,
        service_name: data.service_name.trim(),
        cost: data.cost,
        billing_cycle: data.billing_cycle,
        start_date: data.start_date,
        next_billing_date: formatDateForInput(nextBillingDate),
        client_id: data.client_id || null,
        project_id: data.project_id || null,
        category: data.category,
        business_expense: data.business_expense,
        tax_deductible: data.tax_deductible,
        tax_rate: data.tax_rate,
        currency: data.currency,
        status: data.status,
        notes: data.notes?.trim() || (internalProjectName ? `Internal Project: ${internalProjectName}` : null),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Save subscription
      const { error: subscriptionError } = await supabase
        .from("subscriptions")
        .insert(subscriptionData);

      if (subscriptionError) {
        throw subscriptionError;
      }

      // Log activity
      await supabase
        .from("activity_logs")
        .insert({
          user_id: user.id,
          user_email: user.email,
          action_type: "create",
          resource_type: "subscription",
          description: `Created subscription: ${data.service_name}`,
          timestamp: new Date().toISOString(),
        });

      // Success feedback
      toast.success("Subscription added successfully!");
      
      // Reset form and close modal
      form.reset();
      setInternalProjectName("");
      onOpenChange(false);
      
      // Trigger refresh
      if (onSuccess) {
        onSuccess();
      }

    } catch (error: any) {
      console.error("Error saving subscription:", error);
      toast.error("Failed to add subscription", {
        description: error.message || "An error occurred while saving the subscription"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrencySymbol = (currency: string) => {
    const symbols = { USD: "$", EUR: "€", GBP: "£", CAD: "C$" };
    return symbols[currency as keyof typeof symbols] || "$";
  };

  // Free tier limit warning
  const showFreeTierWarning = userTier === 'free' && subscriptionCount >= 2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-violet-600" />
            Add New Subscription
          </DialogTitle>
          <DialogDescription>
            Add a new business subscription to track costs and organize by client or project.
          </DialogDescription>
        </DialogHeader>

        {showFreeTierWarning && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 dark:bg-amber-900/20 dark:border-amber-800">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Approaching Free Plan Limit
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  You have {subscriptionCount} of 3 items. Upgrade to Business plan for unlimited subscriptions.
                </p>
              </div>
            </div>
          </div>
        )}

        {isLoadingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
            <span className="ml-2 text-sm text-muted-foreground">Loading data...</span>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Service Name */}
              <div className="md:col-span-2">
                <Label htmlFor="service_name">Service Name *</Label>
                <Input
                  id="service_name"
                  placeholder="e.g., Adobe Creative Cloud"
                  {...form.register("service_name")}
                  className={form.formState.errors.service_name ? "border-red-500" : ""}
                />
                {form.formState.errors.service_name && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.service_name.message}
                  </p>
                )}
              </div>

              {/* Cost */}
              <div>
                <Label htmlFor="cost">Cost *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                    {getCurrencySymbol(form.watch("currency"))}
                  </span>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="29.99"
                    className={`pl-8 ${form.formState.errors.cost ? "border-red-500" : ""}`}
                    {...form.register("cost", { valueAsNumber: true })}
                  />
                </div>
                {form.formState.errors.cost && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.cost.message}
                  </p>
                )}
              </div>

              {/* Billing Cycle */}
              <div>
                <Label htmlFor="billing_cycle">Billing Cycle *</Label>
                <Select 
                  value={form.watch("billing_cycle")} 
                  onValueChange={(value) => form.setValue("billing_cycle", value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select billing cycle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.billing_cycle && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.billing_cycle.message}
                  </p>
                )}
              </div>

              {/* Start Date */}
              <div>
                <DateInput
                  id="start_date"
                  label="Start Date"
                  value={form.watch("start_date")}
                  onChange={(value) => {
                    form.setValue("start_date", value);
                    // Validate the date format
                    const validation = validateDateFormat(value);
                    if (!validation.isValid && value) {
                      form.setError("start_date", { message: validation.error });
                    } else {
                      form.clearErrors("start_date");
                    }
                  }}
                  error={form.formState.errors.start_date?.message}
                  required={true}
                  dateFormat="US"
                  max={new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]}
                  min={new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0]}
                />
                {calculatedNextBillingDate && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Next billing: {calculatedNextBillingDate}
                  </p>
                )}
              </div>

              {/* Client */}
              <div>
                <Label htmlFor="client_id">Client</Label>
                <Select 
                  value={form.watch("client_id") || "internal"} 
                  onValueChange={(value) => form.setValue("client_id", value === "internal" ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Internal</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="add_new_client">+ Add New Client</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Project */}
              <div>
                <Label htmlFor="project_id">Project</Label>
                {/* Show text input when Internal is selected, dropdown for actual clients */}
                {(!watchedClientId || watchedClientId === "internal") ? (
                  <Input
                    id="project_name"
                    placeholder="Enter project name (optional)"
                    value={internalProjectName}
                    onChange={(e) => setInternalProjectName(e.target.value)}
                  />
                ) : (
                  <Select 
                    value={form.watch("project_id") || "no_project"} 
                    onValueChange={(value) => form.setValue("project_id", value === "no_project" ? undefined : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no_project">No Project</SelectItem>
                      {filteredProjects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Category */}
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select 
                  value={form.watch("category")} 
                  onValueChange={(value) => form.setValue("category", value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="software">Software</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="infrastructure">Infrastructure</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Currency */}
              <div>
                <Label htmlFor="currency">Currency *</Label>
                <Select 
                  value={form.watch("currency")} 
                  onValueChange={(value) => form.setValue("currency", value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="CAD">CAD (C$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div>
                <Label htmlFor="status">Status *</Label>
                <Select 
                  value={form.watch("status")} 
                  onValueChange={(value) => form.setValue("status", value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tax Rate */}
            <div>
              <Label htmlFor="tax_rate">Tax Rate (%) *</Label>
              <div className="relative">
                <Input
                  id="tax_rate"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="30.0"
                  className={`pr-8 ${form.formState.errors.tax_rate ? "border-red-500" : ""}`}
                  {...form.register("tax_rate", { valueAsNumber: true })}
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                  %
                </span>
              </div>
              {form.formState.errors.tax_rate && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.tax_rate.message}
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                Tax rate for this subscription (defaults to your business tax rate)
              </p>
            </div>

            {/* Checkboxes */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="business_expense"
                  checked={form.watch("business_expense")}
                  onCheckedChange={(checked) => form.setValue("business_expense", !!checked)}
                />
                <Label htmlFor="business_expense" className="text-sm font-normal">
                  Business Expense
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="tax_deductible"
                  checked={form.watch("tax_deductible")}
                  onCheckedChange={(checked) => form.setValue("tax_deductible", !!checked)}
                />
                <Label htmlFor="tax_deductible" className="text-sm font-normal">
                  Tax Deductible
                </Label>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Optional notes about this subscription..."
                className="min-h-[80px]"
                {...form.register("notes")}
              />
              {form.formState.errors.notes && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.notes.message}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || !form.formState.isValid}
                className="bg-violet-600 hover:bg-violet-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Subscription
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
