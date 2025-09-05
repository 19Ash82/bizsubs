// Updated 2024-12-20: Projects management page with complete CRUD functionality
// Implements PRD requirements: project management, cost allocation, color coding

'use client';

import { useState, useMemo } from 'react';
import { useProjectsWithCosts } from '@/lib/react-query/projects';
import { useClientsWithCosts } from '@/lib/react-query/clients';
import { useUser } from '@/lib/react-query/user';
import { ProjectsTable } from '@/components/dashboard/ProjectsTable';
import { AddProjectModal } from '@/components/dashboard/AddProjectModal';
import { EditProjectModal } from '@/components/dashboard/EditProjectModal';
import { ProjectCostBreakdownModal } from '@/components/dashboard/ProjectCostBreakdownModal';
import { ProjectFilterBar } from '@/components/dashboard/ProjectFilterBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FolderOpen, DollarSign, Users, BarChart3 } from 'lucide-react';
import type { Project } from '@/lib/react-query/projects';

export default function ProjectsPage() {
  const { user, profile, isLoading: userLoading, error: userError } = useUser();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCostBreakdownModal, setShowCostBreakdownModal] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    client_id: 'all',
    status: 'all',
  });

  // Fetch data
  const { data: projects = [], isLoading, error } = useProjectsWithCosts(filters);
  const { data: clients = [] } = useClientsWithCosts();

  // Get user preferences
  const userTier = profile?.subscription_tier || 'free';
  const userCurrency = profile?.currency_preference || 'USD';
  const userTaxRate = profile?.tax_rate || 30.0;

  // Calculate metrics
  const metrics = useMemo(() => {
    const activeProjects = projects.filter(p => p.status === 'active');
    const totalMonthly = activeProjects.reduce((sum, p) => sum + (p.monthly_cost || 0), 0);
    const totalAnnual = activeProjects.reduce((sum, p) => sum + (p.annual_cost || 0), 0);
    const totalSubscriptions = activeProjects.reduce((sum, p) => sum + (p.subscription_count || 0), 0);
    const totalLifetimeDeals = activeProjects.reduce((sum, p) => sum + (p.lifetime_deal_count || 0), 0);

    return {
      activeProjects: activeProjects.length,
      totalProjects: projects.length,
      totalMonthly,
      totalAnnual,
      totalSubscriptions,
      totalLifetimeDeals,
    };
  }, [projects]);

  // Handle project actions
  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setShowEditModal(true);
  };

  const handleViewCostBreakdown = (project: Project) => {
    setSelectedProject(project);
    setShowCostBreakdownModal(true);
  };

  const handleCloseModals = () => {
    setSelectedProject(null);
    setShowAddModal(false);
    setShowEditModal(false);
    setShowCostBreakdownModal(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: userCurrency,
    }).format(amount);
  };

  // Show loading state while user data is loading
  if (userLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Show error state
  if (userError || error) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <p className="text-destructive">Failed to load data</p>
              <p className="text-sm text-muted-foreground mt-2">
                {userError?.message || (error instanceof Error ? error.message : 'Please try again later.')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Organize subscriptions by project and track costs
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Project
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeProjects}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.totalProjects} total projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Project Costs</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalMonthly)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(metrics.totalAnnual)} annually
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              Assigned to projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lifetime Deals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalLifetimeDeals}</div>
            <p className="text-xs text-muted-foreground">
              Assigned to projects
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <ProjectFilterBar
        filters={filters}
        onFiltersChange={setFilters}
        clients={clients}
      />

      {/* Projects Table */}
      <ProjectsTable
        projects={projects}
        isLoading={isLoading}
        onEditProject={handleEditProject}
        onViewCostBreakdown={handleViewCostBreakdown}
        userCurrency={userCurrency}
      />

      {/* Modals */}
      <AddProjectModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSuccess={handleCloseModals}
        userTier={userTier}
        userCurrency={userCurrency}
        userTaxRate={userTaxRate}
        preloadedClients={clients}
      />

      {selectedProject && (
        <>
          <EditProjectModal
            open={showEditModal}
            onOpenChange={setShowEditModal}
            onSuccess={handleCloseModals}
            project={selectedProject}
            userTier={userTier}
            userCurrency={userCurrency}
            userTaxRate={userTaxRate}
            preloadedClients={clients}
          />

          <ProjectCostBreakdownModal
            open={showCostBreakdownModal}
            onOpenChange={setShowCostBreakdownModal}
            project={selectedProject}
            userCurrency={userCurrency}
          />
        </>
      )}
    </div>
  );
}

