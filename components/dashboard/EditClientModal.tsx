// Updated 2024-12-20: EditClientModal with React Hook Form and Zod validation
// Implements PRD requirements: color coding, status management, proper validation

"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Palette, Check } from 'lucide-react';
import { useUpdateClient, type Client, type UpdateClientData } from '@/lib/react-query/clients';

// Validation schema
const clientSchema = z.object({
  name: z.string().min(1, 'Client name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  color_hex: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
  status: z.enum(['active', 'inactive'], {
    required_error: 'Please select a status',
  }),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface EditClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  onSuccess?: () => void;
}

// Predefined color options
const colorOptions = [
  '#6366f1', // Violet (default)
  '#ef4444', // Red
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#f97316', // Orange
  '#84cc16', // Lime
  '#06b6d4', // Cyan
  '#6b7280', // Gray
  '#1f2937', // Dark Gray
];

export function EditClientModal({ open, onOpenChange, client, onSuccess }: EditClientModalProps) {
  const [selectedColor, setSelectedColor] = useState(colorOptions[0]);
  const updateClientMutation = useUpdateClient();

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      email: '',
      color_hex: colorOptions[0],
      status: 'active',
    },
  });

  // Update form when client changes
  useEffect(() => {
    if (client && open) {
      form.reset({
        name: client.name,
        email: client.email || '',
        color_hex: client.color_hex,
        status: client.status,
      });
      setSelectedColor(client.color_hex);
    }
  }, [client, open, form]);

  const onSubmit = async (data: ClientFormData) => {
    if (!client) return;

    try {
      const clientData: UpdateClientData = {
        id: client.id,
        ...data,
        email: data.email || undefined, // Convert empty string to undefined
      };

      await updateClientMutation.mutateAsync(clientData);
      
      // Close modal
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to update client:', error);
      // Error is handled by the mutation (toast notification)
    }
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  // Update form value when color is selected
  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    form.setValue('color_hex', color);
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
          <DialogDescription>
            Update client information and settings.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Acme Corporation"
                      {...field}
                      disabled={updateClientMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="contact@acme.com"
                      {...field}
                      disabled={updateClientMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={updateClientMutation.isPending}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">
                        <div className="flex items-center">
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 mr-2">
                            Active
                          </Badge>
                          Currently working with this client
                        </div>
                      </SelectItem>
                      <SelectItem value="inactive">
                        <div className="flex items-center">
                          <Badge className="bg-slate-500/10 text-slate-600 border-slate-200 mr-2">
                            Inactive
                          </Badge>
                          Not currently active
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color_hex"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color Theme</FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: selectedColor }}
                        />
                        <span className="text-sm text-slate-600">
                          This color will be used to identify the client throughout the app
                        </span>
                      </div>
                      <div className="grid grid-cols-6 gap-2">
                        {colorOptions.map((color) => (
                          <button
                            key={color}
                            type="button"
                            className={`w-8 h-8 rounded-full border-2 shadow-sm transition-all hover:scale-110 ${
                              selectedColor === color ? 'border-slate-900 ring-2 ring-slate-300' : 'border-white'
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => handleColorSelect(color)}
                            disabled={updateClientMutation.isPending}
                            title={`Select ${color}`}
                          >
                            {selectedColor === color && (
                              <Check className="w-4 h-4 text-white mx-auto" />
                            )}
                          </button>
                        ))}
                      </div>
                      <Input
                        type="text"
                        placeholder="#6366f1"
                        value={selectedColor}
                        onChange={(e) => {
                          const value = e.target.value;
                          setSelectedColor(value);
                          field.onChange(value);
                        }}
                        className="text-sm font-mono"
                        disabled={updateClientMutation.isPending}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={updateClientMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateClientMutation.isPending}
                className="bg-violet-600 hover:bg-violet-700"
              >
                {updateClientMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Client'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
