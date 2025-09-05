// Updated 2024-12-20: Project cost breakdown modal showing assigned services
// Implements PRD requirements: project cost allocation, detailed reporting

'use client';

import { useProjectCostBreakdown } from '@/lib/react-query/projects';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  DollarSign, 
  Download, 
  Calendar,
  TrendingUp,
  Package,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Project } from '@/lib/react-query/projects';

interface ProjectCostBreakdownModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  userCurrency: string;
}

export function ProjectCostBreakdownModal({
  open,
  onOpenChange,
  project,
  userCurrency,
}: ProjectCostBreakdownModalProps) {
  const { data: breakdown = [], isLoading, error } = useProjectCostBreakdown(project.id);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: userCurrency,
    }).format(amount);
  };

  const getServiceTypeIcon = (type: string) => {
    switch (type) {
      case 'subscription':
        return <BarChart3 className="h-4 w-4" />;
      case 'lifetime_deal':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getServiceTypeBadge = (type: string) => {
    switch (type) {
      case 'subscription':
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
            Subscription
          </Badge>
        );
      case 'lifetime_deal':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
            Lifetime Deal
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            {type}
          </Badge>
        );
    }
  };

  const getBillingCycleBadge = (cycle: string) => {
    const colors = {
      'weekly': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      'monthly': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'quarterly': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      'annual': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'one-time': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    };

    return (
      <Badge variant="outline" className={colors[cycle as keyof typeof colors] || colors['one-time']}>
        {cycle === 'one-time' ? 'One-time' : cycle.charAt(0).toUpperCase() + cycle.slice(1)}
      </Badge>
    );
  };

  // Calculate totals
  const totals = breakdown.reduce((acc, item) => {
    acc.monthly += item.monthly_equivalent;
    acc.annual += item.annual_equivalent;
    return acc;
  }, { monthly: 0, annual: 0 });

  const subscriptions = breakdown.filter(item => item.service_type === 'subscription');
  const lifetimeDeals = breakdown.filter(item => item.service_type === 'lifetime_deal');

  const handleExportBreakdown = () => {
    // Create CSV content
    const headers = ['Service Name', 'Type', 'Cost', 'Billing Cycle', 'Category', 'Monthly Equivalent', 'Annual Equivalent'];
    const csvContent = [
      headers.join(','),
      ...breakdown.map(item => [
        `"${item.service_name}"`,
        item.service_type,
        item.cost,
        item.billing_cycle,
        item.category,
        item.monthly_equivalent,
        item.annual_equivalent,
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name}-cost-breakdown.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: project.color_hex }}
            />
            <span>{project.name} - Cost Breakdown</span>
          </DialogTitle>
          <DialogDescription>
            Detailed view of all subscriptions and lifetime deals assigned to this project
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Total</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totals.monthly)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Annual Total</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totals.annual)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{subscriptions.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lifetime Deals</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{lifetimeDeals.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Export Button */}
          <div className="flex justify-end">
            <Button onClick={handleExportBreakdown} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>

          {/* Services Table */}
          {isLoading ? (
            <Card>
              <CardContent className="py-8">
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                      <div className="h-4 bg-muted animate-pulse rounded flex-1" />
                      <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <p className="text-destructive">Failed to load cost breakdown</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {error instanceof Error ? error.message : 'Please try again later.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : breakdown.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center space-y-4">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div>
                    <h3 className="text-lg font-medium">No services assigned</h3>
                    <p className="text-muted-foreground">
                      This project doesn't have any subscriptions or lifetime deals assigned yet.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Billing</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Monthly</TableHead>
                    <TableHead className="text-right">Annual</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {breakdown.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getServiceTypeIcon(item.service_type)}
                          <span className="font-medium">{item.service_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getServiceTypeBadge(item.service_type)}
                      </TableCell>
                      <TableCell className="font-mono">
                        {formatCurrency(item.cost)}
                      </TableCell>
                      <TableCell>
                        {getBillingCycleBadge(item.billing_cycle)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {item.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {item.monthly_equivalent > 0 ? formatCurrency(item.monthly_equivalent) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {item.annual_equivalent > 0 ? formatCurrency(item.annual_equivalent) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Totals Row */}
                  <TableRow className="border-t-2 font-semibold bg-muted/20">
                    <TableCell colSpan={5}>
                      <strong>Total Project Costs</strong>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      <strong>{formatCurrency(totals.monthly)}</strong>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      <strong>{formatCurrency(totals.annual)}</strong>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

