// Updated 2024-12-20: AddLifetimeDealModal with React Query optimistic updates
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
import { AlertTriangle, Loader2, Plus, X, TrendingUp, TrendingDown } from "lucide-react";
import { useCreateLifetimeDeal, type CreateLifetimeDealData } from "@/lib/react-query/lifetime-deals";
import { DateInput } from "@/components/ui/date-input";

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

interface AddLifetimeDealModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  userTier?: 'free' | 'pro' | 'team';
  userCurrency?: string;
  userTaxRate?: number;
  userDateFormat?: 'US' | 'EU' | 'ISO';
  preloadedClients?: Client[];
  preloadedProjects?: Project[];
  preloadedLifetimeDealCount?: number;
}

const lifetimeDealSchema = z.object({
  service_name: z.string().min(1, "Service name is required"),
  original_cost: z.number().min(0.01, "Original cost must be at least $0.01"),
  purchase_date: z.string().min(1, "Purchase date is required"),
  category: z.string().min(1, "Category is required"),
  status: z.enum(["active", "resold", "shutdown"]),
  currency: z.enum(["USD", "EUR", "GBP", "CAD"]),
  client_id: z.string().optional(),
  project_id: z.string().optional(),
  business_expense: z.boolean(),
  tax_deductible: z.boolean(),
  resold_price: z.number().optional(),
  resold_date: z.string().optional(),
  notes: z.string().optional(),
  tax_rate: z.number().min(0).max(100),
}).refine((data) => {
  // If status is resold, resold_price and resold_date are required
  if (data.status === 'resold') {
    return data.resold_price && data.resold_price > 0 && data.resold_date;
  }
  return true;
}, {
  message: "Resold price and date are required when status is 'resold'",
  path: ["resold_price"],
});

type LifetimeDealFormData = z.infer<typeof lifetimeDealSchema>;

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
  { value: "resold", label: "Resold", color: "bg-blue-500" },
  { value: "shutdown", label: "Shutdown", color: "bg-gray-500" },
];

export function AddLifetimeDealModal({ 
  open, 
  onOpenChange, 
  onSuccess,
  userTier = 'free',
  userCurrency = 'USD',
  userTaxRate = 30.0,
  userDateFormat = 'US',
  preloadedClients,
  preloadedProjects,
  preloadedLifetimeDealCount
}: AddLifetimeDealModalProps) {
  
  const [clients, setClients] = useState<Client[]>(preloadedClients || []);
  const [projects, setProjects] = useState<Project[]>(preloadedProjects || []);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [lifetimeDealCount, setLifetimeDealCount] = useState(preloadedLifetimeDealCount || 0);
  const [internalProjectName, setInternalProjectName] = useState("");

  // React Query mutation for optimistic updates
  const createLifetimeDealMutation = useCreateLifetimeDeal();

  const form = useForm<LifetimeDealFormData>({
    resolver: zodResolver(lifetimeDealSchema),
    defaultValues: {
      service_name: "",
      original_cost: 0,
      purchase_date: "",
      category: "software",
      status: "active",
      currency: userCurrency as "USD" | "EUR" | "GBP" | "CAD",
      client_id: undefined,
      project_id: undefined,
      business_expense: true,
      tax_deductible: true,
      resold_price: undefined,
      resold_date: undefined,
      notes: "",
      tax_rate: userTaxRate,
    },
  });

  const watchedClientId = form.watch("client_id");
  const watchedStatus = form.watch("status");
  const watchedOriginalCost = form.watch("original_cost");
  const watchedResoldPrice = form.watch("resold_price");
  const watchedCurrency = form.watch("currency");

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

  // Handle status changes - clear/set resold fields appropriately
  useEffect(() => {
    if (watchedStatus === 'shutdown') {
      form.setValue("resold_price", 0);
      form.setValue("resold_date", undefined);
    } else if (watchedStatus !== 'resold') {
      form.setValue("resold_price", undefined);
      form.setValue("resold_date", undefined);
    }
  }, [watchedStatus, form]);

  const loadInitialData = async () => {
    if (preloadedClients && preloadedProjects) return;
    
    setIsLoadingData(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [clientsResponse, projectsResponse, lifetimeDealsResponse] = await Promise.all([
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
          .from("lifetime_deals")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "active")
      ]);

      if (clientsResponse.data) setClients(clientsResponse.data);
      if (projectsResponse.data) setProjects(projectsResponse.data);
      if (lifetimeDealsResponse.data) setLifetimeDealCount(lifetimeDealsResponse.data.length);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const checkFreeTierLimit = (): boolean => {
    const isFreeUser = userTier === 'free';
    if (isFreeUser && lifetimeDealCount >= 3) {
      return false;
    }
    return true;
  };

  const calculateProfitLoss = (): number | null => {
    if (watchedStatus === 'shutdown' && watchedOriginalCost) {
      return -watchedOriginalCost; // Total loss
    }
    if (watchedStatus === 'resold' && watchedOriginalCost && watchedResoldPrice) {
      return watchedResoldPrice - watchedOriginalCost;
    }
    return null;
  };

  const onSubmit = async (data: LifetimeDealFormData) => {
    try {
      // Check free tier limits (lifetime deals count toward subscription limit)
      if (!checkFreeTierLimit()) {
        toast.error(
          "Free plan limit reached",
          {
            description: "You can only track 3 items on the free plan. Upgrade to add more lifetime deals.",
            action: {
              label: "Upgrade",
              onClick: () => window.location.href = "/upgrade"
            }
          }
        );
        return;
      }

      // Prepare lifetime deal data
      let finalNotes = data.notes?.trim() || "";
      
      // Handle internal project name
      if ((!data.client_id || data.client_id === "internal") && internalProjectName.trim()) {
        finalNotes = finalNotes 
          ? `Internal Project: ${internalProjectName.trim()}\n\n${finalNotes}`
          : `Internal Project: ${internalProjectName.trim()}`;
      }

      const lifetimeDealData: CreateLifetimeDealData = {
        service_name: data.service_name.trim(),
        original_cost: data.original_cost,
        purchase_date: data.purchase_date,
        category: data.category,
        status: data.status,
        currency: data.currency,
        client_id: (data.client_id && data.client_id !== "internal" && data.client_id !== "none") ? data.client_id : undefined,
        project_id: (data.project_id && data.project_id !== "none") ? data.project_id : undefined,
        business_expense: data.business_expense,
        tax_deductible: data.tax_deductible,
        resold_price: data.status === 'resold' ? data.resold_price : data.status === 'shutdown' ? 0 : undefined,
        resold_date: data.status === 'resold' ? data.resold_date : undefined,
        notes: finalNotes || undefined,
        tax_rate: data.tax_rate,
      };

      // Use React Query mutation with optimistic updates
      await createLifetimeDealMutation.mutateAsync(lifetimeDealData);

      // Close modal and reset form immediately - optimistic update has already happened
      onOpenChange(false);
      form.reset();
      setInternalProjectName("");
      onSuccess?.();

    } catch (error) {
      // Error handling is done by the React Query mutation
      console.error("Error creating lifetime deal:", error);
    }
  };

  const handleClose = () => {
    if (!createLifetimeDealMutation.isPending) {
      onOpenChange(false);
      form.reset();
      setInternalProjectName("");
    }
  };

  const getCurrencySymbol = (currency: string) => {
    return CURRENCIES.find(c => c.value === currency)?.symbol || '$';
  };

  const formatCurrency = (amount: number, currency: string) => {
    return `${getCurrencySymbol(currency)}${amount.toFixed(2)}`;
  };

  const profitLoss = calculateProfitLoss();
  const isLoading = createLifetimeDealMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Lifetime Deal
            {userTier === 'free' && (
              <Badge variant="secondary" className="text-xs">
                {lifetimeDealCount}/3 Free Plan
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Add a new lifetime deal to track. Changes will be saved immediately with optimistic updates.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Service Name */}
          <div className="space-y-2">
            <Label htmlFor="service_name">Service Name *</Label>
            <Input
              id="service_name"
              {...form.register("service_name")}
              placeholder="e.g., AppSumo Deal, Notion Pro, Figma Lifetime"
              disabled={isLoading}
            />
            {form.formState.errors.service_name && (
              <p className="text-sm text-red-600">{form.formState.errors.service_name.message}</p>
            )}
          </div>

          {/* Original Cost and Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="original_cost">Original Cost *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  {getCurrencySymbol(form.watch("currency"))}
                </span>
                <Input
                  id="original_cost"
                  type="number"
                  step="0.01"
                  min="0.01"
                  {...form.register("original_cost", { valueAsNumber: true })}
                  className="pl-8"
                  placeholder="0.00"
                  disabled={isLoading}
                />
              </div>
              {form.formState.errors.original_cost && (
                <p className="text-sm text-red-600">{form.formState.errors.original_cost.message}</p>
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

          {/* Purchase Date and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <DateInput
                id="purchase_date"
                label="Purchase Date"
                value={form.watch("purchase_date")}
                onChange={(value) => form.setValue("purchase_date", value)}
                error={form.formState.errors.purchase_date?.message}
                required={true}
                dateFormat={userDateFormat}
                max={new Date().toISOString().split('T')[0]}
                disabled={isLoading}
              />
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

          {/* Resale Information (shown when status is resold or shutdown) */}
          {(watchedStatus === 'resold' || watchedStatus === 'shutdown') && (
            <div className={`space-y-4 p-4 rounded-lg border ${
              watchedStatus === 'shutdown' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
            }`}>
              <h4 className={`font-medium ${
                watchedStatus === 'shutdown' ? 'text-red-900' : 'text-blue-900'
              }`}>
                {watchedStatus === 'shutdown' ? 'Service Shutdown Information' : 'Resale Information'}
              </h4>
              
              {watchedStatus === 'shutdown' ? (
                <div className="space-y-2">
                  <p className="text-sm text-red-800">
                    Service has been shut down. This represents a total loss of your investment.
                  </p>
                  <div className="p-3 bg-red-100 rounded border border-red-200">
                    <span className="text-red-800 font-medium">
                      Total Loss: {formatCurrency(watchedOriginalCost || 0, watchedCurrency)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="resold_price">Resold Price *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        {getCurrencySymbol(form.watch("currency"))}
                      </span>
                      <Input
                        id="resold_price"
                        type="number"
                        step="0.01"
                        min="0.01"
                        {...form.register("resold_price", { valueAsNumber: true })}
                        className="pl-8"
                        placeholder="0.00"
                        disabled={isLoading}
                      />
                    </div>
                    {form.formState.errors.resold_price && (
                      <p className="text-sm text-red-600">{form.formState.errors.resold_price.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <DateInput
                      id="resold_date"
                      label="Resold Date"
                      value={form.watch("resold_date")}
                      onChange={(value) => form.setValue("resold_date", value)}
                      error={form.formState.errors.resold_date?.message}
                      required={true}
                      dateFormat={userDateFormat}
                      max={new Date().toISOString().split('T')[0]}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              )}
              
              {/* Profit/Loss Calculation */}
              {profitLoss !== null && (
                <div className={`flex items-center gap-2 p-3 rounded ${profitLoss >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {profitLoss >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  <span className="font-medium">
                    {profitLoss >= 0 ? 'Profit' : 'Loss'}: {formatCurrency(Math.abs(profitLoss), watchedCurrency)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Category */}
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

          {/* Client and Project */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client_id">Client</Label>
              <Select
                value={form.watch("client_id") || "none"}
                onValueChange={(value) => form.setValue("client_id", value === "none" ? undefined : value)}
                disabled={isLoading || isLoadingData}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client or internal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No client</SelectItem>
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
                  value={form.watch("project_id") || "none"}
                  onValueChange={(value) => form.setValue("project_id", value === "none" ? undefined : value)}
                  disabled={isLoading || !watchedClientId || watchedClientId === "internal"}
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
              {isLoading ? 'Adding...' : 'Add Lifetime Deal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
