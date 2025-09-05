// Updated 2024-12-20: Projects table component with cost tracking and color coding
// Implements PRD requirements: project management, client integration, visual organization

'use client';

import { useState } from 'react';
import { useDeleteProject } from '@/lib/react-query/projects';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  MoreHorizontal,
  Edit,
  Trash2,
  BarChart3,
  FolderOpen,
  DollarSign,
  Calendar,
  User,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Project } from '@/lib/react-query/projects';

interface ProjectsTableProps {
  projects: Project[];
  isLoading: boolean;
  onEditProject: (project: Project) => void;
  onViewCostBreakdown: (project: Project) => void;
  userCurrency: string;
}

export function ProjectsTable({
  projects,
  isLoading,
  onEditProject,
  onViewCostBreakdown,
  userCurrency,
}: ProjectsTableProps) {
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const deleteProjectMutation = useDeleteProject();

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    
    try {
      await deleteProjectMutation.mutateAsync(projectToDelete.id);
      setProjectToDelete(null);
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: userCurrency,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-4 w-4 bg-muted animate-pulse rounded-full" />
                <div className="h-4 bg-muted animate-pulse rounded flex-1" />
                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                <div className="h-4 w-16 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center space-y-4">
            <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="text-lg font-medium">No projects found</h3>
              <p className="text-muted-foreground">
                Create your first project to organize subscriptions and track costs.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Monthly Cost</TableHead>
              <TableHead className="text-right">Subscriptions</TableHead>
              <TableHead className="text-right">Lifetime Deals</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: project.color_hex }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm">{project.name}</div>
                      {project.description && (
                        <div className="text-xs text-muted-foreground truncate">
                          {project.description}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {project.client_name ? (
                    <div className="flex items-center space-x-2">
                      {project.client_color && (
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: project.client_color }}
                        />
                      )}
                      <span className="text-sm">{project.client_name}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Internal</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={getStatusColor(project.status)}>
                    {project.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {project.monthly_cost ? formatCurrency(project.monthly_cost) : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-1">
                    <BarChart3 className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">{project.subscription_count || 0}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-1">
                    <DollarSign className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">{project.lifetime_deal_count || 0}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewCostBreakdown(project)}>
                        <BarChart3 className="mr-2 h-4 w-4" />
                        View Cost Breakdown
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onEditProject(project)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Project
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setProjectToDelete(project)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Project
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!projectToDelete} onOpenChange={() => setProjectToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{projectToDelete?.name}"? This action cannot be undone.
              Subscriptions and lifetime deals assigned to this project will become unassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
