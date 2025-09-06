// Updated 2024-12-20: Projects table component with cost tracking and color coding
// Implements PRD requirements: project management, client integration, visual organization

'use client';

import { useState } from 'react';
import { useDeleteProject } from '@/lib/react-query/projects';
import {
  TableBody,
} from '@/components/ui/table';
import {
  StandardizedTable,
  StandardizedTableHeader,
  StandardizedTableRow,
  StandardizedTableHead,
  StandardizedTableCell,
  StandardizedActionCell,
  StandardizedTableSkeleton,
  StandardizedTableEmptyState,
  STANDARDIZED_STYLES,
} from './StandardizedTable';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Project } from '@/lib/react-query/projects';
import { useDataContainerBlur } from '@/lib/hooks/useDataContainerBlur';

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

  // Set up blur overlay for table data
  const { dataBlurClass } = useDataContainerBlur({
    queryKeys: ['projects'],
    intensity: 'medium'
  });

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
      <StandardizedTableSkeleton rows={5} columns={8} />
    );
  }

  if (projects.length === 0) {
    return (
      <StandardizedTable>
        <StandardizedTableHeader>
          <StandardizedTableRow>
            <StandardizedTableHead width="large">Project</StandardizedTableHead>
            <StandardizedTableHead width="medium">Client</StandardizedTableHead>
            <StandardizedTableHead width="small">Status</StandardizedTableHead>
            <StandardizedTableHead width="medium">Monthly Cost</StandardizedTableHead>
            <StandardizedTableHead width="small">Subscriptions</StandardizedTableHead>
            <StandardizedTableHead width="small">Lifetime Deals</StandardizedTableHead>
            <StandardizedTableHead width="medium">Created</StandardizedTableHead>
            <StandardizedTableHead width="action"></StandardizedTableHead>
          </StandardizedTableRow>
        </StandardizedTableHeader>
        <TableBody>
          <StandardizedTableEmptyState
            icon={FolderOpen}
            title="No projects found"
            description="Create your first project to organize subscriptions and track costs."
            columns={8}
          />
        </TableBody>
      </StandardizedTable>
    );
  }

  return (
    <>
      <StandardizedTable>
        <StandardizedTableHeader>
          <StandardizedTableRow>
            <StandardizedTableHead width="large">Project</StandardizedTableHead>
            <StandardizedTableHead width="medium">Client</StandardizedTableHead>
            <StandardizedTableHead width="small">Status</StandardizedTableHead>
            <StandardizedTableHead width="medium">Monthly Cost</StandardizedTableHead>
            <StandardizedTableHead width="small">Subscriptions</StandardizedTableHead>
            <StandardizedTableHead width="small">Lifetime Deals</StandardizedTableHead>
            <StandardizedTableHead width="medium">Created</StandardizedTableHead>
            <StandardizedTableHead width="action"></StandardizedTableHead>
          </StandardizedTableRow>
        </StandardizedTableHeader>
          <TableBody className={dataBlurClass}>
            {projects.map((project) => (
              <StandardizedTableRow key={project.id}>
                <StandardizedTableCell>
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: project.color_hex }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{project.name}</div>
                      {project.description && (
                        <div className="text-xs text-muted-foreground truncate">
                          {project.description}
                        </div>
                      )}
                    </div>
                  </div>
                </StandardizedTableCell>
                <StandardizedTableCell>
                  {project.client_name ? (
                    <div className="flex items-center space-x-2">
                      {project.client_color && (
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: project.client_color }}
                        />
                      )}
                      <span>{project.client_name}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Internal</span>
                  )}
                </StandardizedTableCell>
                <StandardizedTableCell>
                  <Badge variant="secondary" className={getStatusColor(project.status)}>
                    {project.status}
                  </Badge>
                </StandardizedTableCell>
                <StandardizedTableCell variant="numeric" className="font-mono">
                  {project.monthly_cost ? formatCurrency(project.monthly_cost) : '-'}
                </StandardizedTableCell>
                <StandardizedTableCell variant="numeric">
                  <div className="flex items-center justify-end space-x-1">
                    <BarChart3 className="h-3 w-3 text-muted-foreground" />
                    <span>{project.subscription_count || 0}</span>
                  </div>
                </StandardizedTableCell>
                <StandardizedTableCell variant="numeric">
                  <div className="flex items-center justify-end space-x-1">
                    <DollarSign className="h-3 w-3 text-muted-foreground" />
                    <span>{project.lifetime_deal_count || 0}</span>
                  </div>
                </StandardizedTableCell>
                <StandardizedTableCell variant="secondary">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </StandardizedTableCell>
                <StandardizedActionCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className={STANDARDIZED_STYLES.ACTION_BUTTON}>
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
                </StandardizedActionCell>
              </StandardizedTableRow>
            ))}
          </TableBody>
      </StandardizedTable>

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
