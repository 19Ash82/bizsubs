// Updated 2024-12-20: Add project modal with client integration and color coding
// Implements PRD requirements: project management, visual organization

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateProject } from '@/lib/react-query/projects';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Palette } from 'lucide-react';
import type { Client } from '@/lib/react-query/clients';

const formSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Project name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  client_id: z.string().optional(),
  color_hex: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
  status: z.enum(['active', 'inactive', 'completed']),
});

type FormData = z.infer<typeof formSchema>;

interface AddProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  userTier: string;
  userCurrency: string;
  userTaxRate: number;
  preloadedClients: Client[];
}

// Predefined color palette for projects
const PROJECT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#EC4899', // Pink
  '#6B7280', // Gray
];

export function AddProjectModal({
  open,
  onOpenChange,
  onSuccess,
  userTier,
  userCurrency,
  userTaxRate,
  preloadedClients,
}: AddProjectModalProps) {
  const [selectedColor, setSelectedColor] = useState(PROJECT_COLORS[0]);
  const createProjectMutation = useCreateProject();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      client_id: 'none',
      color_hex: PROJECT_COLORS[0],
      status: 'active',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await createProjectMutation.mutateAsync({
        ...data,
        client_id: data.client_id === 'none' || data.client_id === '' ? undefined : data.client_id,
        color_hex: selectedColor,
      });
      form.reset();
      setSelectedColor(PROJECT_COLORS[0]);
      onSuccess();
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !createProjectMutation.isPending) {
      form.reset();
      setSelectedColor(PROJECT_COLORS[0]);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Project</DialogTitle>
          <DialogDescription>
            Create a new project to organize subscriptions and track costs.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Project Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Website Redesign, Mobile App"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of the project (optional)"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Client Selection */}
            <FormField
              control={form.control}
              name="client_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No Client</SelectItem>
                      {preloadedClients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: client.color_hex }}
                            />
                            <span>{client.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Color Selection */}
            <div className="space-y-2">
              <FormLabel className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Project Color
              </FormLabel>
              <div className="flex flex-wrap gap-2">
                {PROJECT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      setSelectedColor(color);
                      form.setValue('color_hex', color);
                    }}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      selectedColor === color
                        ? 'border-foreground scale-110'
                        : 'border-muted hover:border-muted-foreground'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              <div className="flex items-center space-x-2">
                <div
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: selectedColor }}
                />
                <span className="text-sm text-muted-foreground">
                  Selected: {selectedColor}
                </span>
              </div>
            </div>

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Active
                        </Badge>
                      </SelectItem>
                      <SelectItem value="inactive">
                        <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                          Inactive
                        </Badge>
                      </SelectItem>
                      <SelectItem value="completed">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          Completed
                        </Badge>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={createProjectMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createProjectMutation.isPending}>
                {createProjectMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Project
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

