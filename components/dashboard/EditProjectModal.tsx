// Updated 2024-12-20: Edit project modal with client integration and color coding
// Implements PRD requirements: project management, visual organization

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUpdateProject } from '@/lib/react-query/projects';
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
import type { Project } from '@/lib/react-query/projects';

const formSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Project name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  client_id: z.string().optional(),
  color_hex: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
  status: z.enum(['active', 'inactive', 'completed']),
});

type FormData = z.infer<typeof formSchema>;

interface EditProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  project: Project;
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

export function EditProjectModal({
  open,
  onOpenChange,
  onSuccess,
  project,
  userTier,
  userCurrency,
  userTaxRate,
  preloadedClients,
}: EditProjectModalProps) {
  const [selectedColor, setSelectedColor] = useState(project.color_hex);
  const updateProjectMutation = useUpdateProject();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: project.name,
      description: project.description || '',
      client_id: project.client_id || '',
      color_hex: project.color_hex,
      status: project.status,
    },
  });

  // Update form when project changes
  useEffect(() => {
    if (project) {
      form.reset({
        name: project.name,
        description: project.description || '',
        client_id: project.client_id || '',
        color_hex: project.color_hex,
        status: project.status,
      });
      setSelectedColor(project.color_hex);
    }
  }, [project, form]);

  const onSubmit = async (data: FormData) => {
    try {
      await updateProjectMutation.mutateAsync({
        ...data,
        id: project.id,
        client_id: data.client_id === 'none' || data.client_id === '' ? undefined : data.client_id,
        color_hex: selectedColor,
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to update project:', error);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !updateProjectMutation.isPending) {
      // Reset form to original values
      form.reset({
        name: project.name,
        description: project.description || '',
        client_id: project.client_id || '',
        color_hex: project.color_hex,
        status: project.status,
      });
      setSelectedColor(project.color_hex);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>
            Update project details and organization settings.
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

            {/* Project Stats */}
            <div className="bg-muted/50 p-3 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Project Statistics</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Subscriptions:</span>
                  <span className="ml-2 font-mono">{project.subscription_count || 0}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Lifetime Deals:</span>
                  <span className="ml-2 font-mono">{project.lifetime_deal_count || 0}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Monthly Cost:</span>
                  <span className="ml-2 font-mono">
                    {project.monthly_cost 
                      ? new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: userCurrency,
                        }).format(project.monthly_cost)
                      : '-'
                    }
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Annual Cost:</span>
                  <span className="ml-2 font-mono">
                    {project.annual_cost 
                      ? new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: userCurrency,
                        }).format(project.annual_cost)
                      : '-'
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={updateProjectMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateProjectMutation.isPending}>
                {updateProjectMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Update Project
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

