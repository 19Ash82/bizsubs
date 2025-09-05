// Updated 2024-12-19: Custom hooks for report generation following TanStack Query patterns

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useSubscriptions } from './subscriptions';
import { useLifetimeDeals } from './lifetime-deals';

interface ReportFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  clientId?: string;
  category?: string;
  projectId?: string;
}

interface UserProfile {
  id: string;
  currency_preference: string;
  financial_year_end: string;
  tax_rate: number;
}

// Hook for monthly expense reports
export function useMonthlyExpenseReport(filters: ReportFilters, userProfile: UserProfile) {
  // Use existing working hooks
  const { data: allSubscriptions = [], isLoading: subscriptionsLoading } = useSubscriptions();
  const { data: allLifetimeDeals = [], isLoading: lifetimeDealsLoading } = useLifetimeDeals();

  return useQuery({
    queryKey: ['monthly-expense-report', filters, userProfile.id, allSubscriptions.length, allLifetimeDeals.length],
    queryFn: async () => {
      console.log('Reports Debug - All subscriptions:', allSubscriptions.length);
      console.log('Reports Debug - All lifetime deals:', allLifetimeDeals.length);
      console.log('Reports Debug - Date range:', filters.dateRange);
      
      // Filter subscriptions by date range
      const filteredSubscriptions = allSubscriptions.filter(sub => {
        const billingDate = new Date(sub.next_billing_date);
        return billingDate >= filters.dateRange.start && billingDate <= filters.dateRange.end;
      });

      // Filter lifetime deals by date range
      const filteredLifetimeDeals = allLifetimeDeals.filter(deal => {
        const purchaseDate = new Date(deal.purchase_date);
        return purchaseDate >= filters.dateRange.start && purchaseDate <= filters.dateRange.end;
      });

      // Apply additional filters
      let finalSubscriptions = filteredSubscriptions;
      let finalLifetimeDeals = filteredLifetimeDeals;

      if (filters.clientId && filters.clientId !== 'all') {
        finalSubscriptions = finalSubscriptions.filter(sub => sub.client_id === filters.clientId);
        finalLifetimeDeals = finalLifetimeDeals.filter(deal => deal.client_id === filters.clientId);
      }

      if (filters.category && filters.category !== 'all') {
        finalSubscriptions = finalSubscriptions.filter(sub => sub.category === filters.category);
        finalLifetimeDeals = finalLifetimeDeals.filter(deal => deal.category === filters.category);
      }

      if (filters.projectId && filters.projectId !== 'all') {
        finalSubscriptions = finalSubscriptions.filter(sub => sub.project_id === filters.projectId);
        finalLifetimeDeals = finalLifetimeDeals.filter(deal => deal.project_id === filters.projectId);
      }

      // Calculate monthly totals
      const monthlyTotals = calculateMonthlyTotals(finalSubscriptions, finalLifetimeDeals, userProfile);
      
      return {
        subscriptions: finalSubscriptions,
        lifetimeDeals: finalLifetimeDeals,
        monthlyTotals,
        totalExpenses: monthlyTotals.reduce((sum, month) => sum + month.total, 0),
        totalTaxDeductible: monthlyTotals.reduce((sum, month) => sum + month.taxDeductible, 0),
        totalTaxSavings: monthlyTotals.reduce((sum, month) => sum + month.taxSavings, 0),
      };
    },
    enabled: !subscriptionsLoading && !lifetimeDealsLoading && allSubscriptions.length >= 0 && allLifetimeDeals.length >= 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Hook for tax year summary
export function useTaxYearSummary(filters: ReportFilters, userProfile: UserProfile) {
  // Use existing working hooks
  const { data: allSubscriptions = [], isLoading: subscriptionsLoading } = useSubscriptions();
  const { data: allLifetimeDeals = [], isLoading: lifetimeDealsLoading } = useLifetimeDeals();

  return useQuery({
    queryKey: ['tax-year-summary', filters, userProfile.id, allSubscriptions.length, allLifetimeDeals.length],
    queryFn: async () => {
      console.log('Tax Summary Debug - All subscriptions:', allSubscriptions.length);
      console.log('Tax Summary Debug - All lifetime deals:', allLifetimeDeals.length);
      console.log('Tax Summary Debug - Financial year end:', userProfile.financial_year_end);
      
      // Calculate financial year dates based on user's financial_year_end setting
      const currentYear = new Date().getFullYear();
      const currentDate = new Date();
      
      // Parse the financial year end date (format: YYYY-MM-DD)
      const [fyYear, fyMonth, fyDay] = userProfile.financial_year_end.split('-').map(Number);
      
      let financialYearStart: Date;
      let financialYearEnd: Date;
      
      // Determine the current financial year based on today's date
      const thisYearFYEnd = new Date(currentYear, fyMonth - 1, fyDay);
      const nextYearFYEnd = new Date(currentYear + 1, fyMonth - 1, fyDay);
      
      if (currentDate <= thisYearFYEnd) {
        // We're still in the financial year that ends this calendar year
        financialYearStart = new Date(currentYear - 1, fyMonth - 1, fyDay + 1);
        financialYearEnd = thisYearFYEnd;
      } else {
        // We're in the financial year that ends next calendar year
        financialYearStart = new Date(currentYear, fyMonth - 1, fyDay + 1);
        financialYearEnd = nextYearFYEnd;
      }

      console.log('Tax Summary Debug - Financial year start:', financialYearStart);
      console.log('Tax Summary Debug - Financial year end:', financialYearEnd);

      // Calculate tax summary with proper timing logic
      const taxSummary = calculateTaxSummary(allSubscriptions, allLifetimeDeals, userProfile, financialYearStart, financialYearEnd);
      console.log('Tax Summary Debug - Tax summary result:', taxSummary);
      
      return {
        financialYearStart,
        financialYearEnd,
        subscriptions: allSubscriptions,
        lifetimeDeals: allLifetimeDeals,
        taxSummary,
      };
    },
    enabled: !subscriptionsLoading && !lifetimeDealsLoading && allSubscriptions.length >= 0 && allLifetimeDeals.length >= 0,
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
  });
}

// Hook for client cost allocation
export function useClientCostReport(filters: ReportFilters, userProfile: UserProfile) {
  // Use existing working hooks
  const { data: allSubscriptions = [], isLoading: subscriptionsLoading } = useSubscriptions();
  const { data: allLifetimeDeals = [], isLoading: lifetimeDealsLoading } = useLifetimeDeals();

  return useQuery({
    queryKey: ['client-cost-report', filters, userProfile.id, allSubscriptions.length, allLifetimeDeals.length],
    queryFn: async () => {
      const supabase = createClient();
      
      // Get all clients
      const { data: clients } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', userProfile.id)
        .eq('status', 'active')
        .order('name');

      // Filter subscriptions by date range
      const filteredSubscriptions = allSubscriptions.filter(sub => {
        const billingDate = new Date(sub.next_billing_date);
        return billingDate >= filters.dateRange.start && billingDate <= filters.dateRange.end;
      });

      // Filter lifetime deals by date range
      const filteredLifetimeDeals = allLifetimeDeals.filter(deal => {
        const purchaseDate = new Date(deal.purchase_date);
        return purchaseDate >= filters.dateRange.start && purchaseDate <= filters.dateRange.end;
      });

      // Calculate client costs
      const clientCosts = calculateClientCosts(clients || [], filteredSubscriptions, filteredLifetimeDeals);
      
      return {
        clients: clients || [],
        clientCosts,
        totalCosts: clientCosts.reduce((sum, client) => sum + client.totalCost, 0),
      };
    },
    enabled: !subscriptionsLoading && !lifetimeDealsLoading && allSubscriptions.length >= 0 && allLifetimeDeals.length >= 0,
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
  });
}

// Hook for category breakdown
export function useCategoryBreakdown(filters: ReportFilters, userProfile: UserProfile) {
  // Use existing working hooks
  const { data: allSubscriptions = [], isLoading: subscriptionsLoading } = useSubscriptions();
  const { data: allLifetimeDeals = [], isLoading: lifetimeDealsLoading } = useLifetimeDeals();

  return useQuery({
    queryKey: ['category-breakdown', filters, userProfile.id, allSubscriptions.length, allLifetimeDeals.length],
    queryFn: async () => {
      // Filter subscriptions by date range
      const filteredSubscriptions = allSubscriptions.filter(sub => {
        const billingDate = new Date(sub.next_billing_date);
        return billingDate >= filters.dateRange.start && billingDate <= filters.dateRange.end;
      });

      // Filter lifetime deals by date range
      const filteredLifetimeDeals = allLifetimeDeals.filter(deal => {
        const purchaseDate = new Date(deal.purchase_date);
        return purchaseDate >= filters.dateRange.start && purchaseDate <= filters.dateRange.end;
      });

      // Apply additional filters
      let finalSubscriptions = filteredSubscriptions;
      let finalLifetimeDeals = filteredLifetimeDeals;

      if (filters.clientId && filters.clientId !== 'all') {
        finalSubscriptions = finalSubscriptions.filter(sub => sub.client_id === filters.clientId);
        finalLifetimeDeals = finalLifetimeDeals.filter(deal => deal.client_id === filters.clientId);
      }

      if (filters.projectId && filters.projectId !== 'all') {
        finalSubscriptions = finalSubscriptions.filter(sub => sub.project_id === filters.projectId);
        finalLifetimeDeals = finalLifetimeDeals.filter(deal => deal.project_id === filters.projectId);
      }

      // Calculate category breakdown
      const categoryBreakdown = calculateCategoryBreakdown(finalSubscriptions, finalLifetimeDeals);
      
      return {
        subscriptions: finalSubscriptions,
        lifetimeDeals: finalLifetimeDeals,
        categoryBreakdown,
        totalExpenses: categoryBreakdown.reduce((sum, category) => sum + category.total, 0),
      };
    },
    enabled: !subscriptionsLoading && !lifetimeDealsLoading && allSubscriptions.length >= 0 && allLifetimeDeals.length >= 0,
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
  });
}

// Helper functions
function calculateMonthlyTotals(subscriptions: any[], lifetimeDeals: any[], userProfile?: UserProfile) {
  const monthlyData: { [key: string]: { total: number; taxDeductible: number; taxSavings: number; items: any[] } } = {};
  
  // Process subscriptions - only include if business expense and tax deductible
  subscriptions.forEach(sub => {
    if (sub.business_expense && sub.tax_deductible) {
      const monthKey = new Date(sub.next_billing_date).toISOString().substring(0, 7);
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { total: 0, taxDeductible: 0, taxSavings: 0, items: [] };
      }
      
      const monthlyAmount = sub.billing_cycle === 'monthly' ? sub.cost :
                           sub.billing_cycle === 'annual' ? sub.cost / 12 :
                           sub.billing_cycle === 'quarterly' ? sub.cost / 3 :
                           sub.billing_cycle === 'weekly' ? sub.cost * 4.33 : sub.cost;
      
      monthlyData[monthKey].total += monthlyAmount;
      monthlyData[monthKey].taxDeductible += monthlyAmount;
      // Calculate tax savings using individual tax rate
      const taxRate = sub.tax_rate || (userProfile?.tax_rate || 30);
      monthlyData[monthKey].taxSavings += monthlyAmount * (taxRate / 100);
      monthlyData[monthKey].items.push({ ...sub, calculatedAmount: monthlyAmount });
    }
  });
  
  // Process lifetime deals - only include if business expense, tax deductible, and purchased in the month
  lifetimeDeals.forEach(deal => {
    if (deal.business_expense && deal.tax_deductible) {
      const monthKey = new Date(deal.purchase_date).toISOString().substring(0, 7);
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { total: 0, taxDeductible: 0, taxSavings: 0, items: [] };
      }
      
      monthlyData[monthKey].total += deal.original_cost;
      monthlyData[monthKey].taxDeductible += deal.original_cost;
      // Calculate tax savings using individual tax rate
      const taxRate = deal.tax_rate || (userProfile?.tax_rate || 30);
      monthlyData[monthKey].taxSavings += deal.original_cost * (taxRate / 100);
      monthlyData[monthKey].items.push({ ...deal, calculatedAmount: deal.original_cost });
    }
  });
  
  return Object.entries(monthlyData)
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

function calculateTaxSummary(subscriptions: any[], lifetimeDeals: any[], userProfile: UserProfile, financialYearStart: Date, financialYearEnd: Date) {
  console.log('calculateTaxSummary - Input subscriptions:', subscriptions.length);
  console.log('calculateTaxSummary - Input lifetime deals:', lifetimeDeals.length);
  console.log('calculateTaxSummary - Financial year:', financialYearStart, 'to', financialYearEnd);
  
  let totalBusinessExpenses = 0;
  let totalTaxDeductible = 0;
  let totalTaxSavings = 0;
  
  // Process subscriptions with pro-rated calculations
  subscriptions.forEach((sub, index) => {
    console.log(`calculateTaxSummary - Subscription ${index}:`, {
      service_name: sub.service_name,
      cost: sub.cost,
      business_expense: sub.business_expense,
      tax_deductible: sub.tax_deductible,
      tax_rate: sub.tax_rate,
      billing_cycle: sub.billing_cycle,
      status: sub.status,
      created_at: sub.created_at,
      cancelled_date: sub.cancelled_date
    });
    
    if (sub.business_expense && sub.tax_deductible) {
      // Calculate the active period within the financial year
      const subscriptionStart = new Date(sub.created_at);
      const subscriptionEnd = sub.cancelled_date ? new Date(sub.cancelled_date) : new Date(); // If not cancelled, use current date
      
      // Determine the overlap with financial year
      const effectiveStart = new Date(Math.max(subscriptionStart.getTime(), financialYearStart.getTime()));
      const effectiveEnd = new Date(Math.min(subscriptionEnd.getTime(), financialYearEnd.getTime()));
      
      // Only include if there's an overlap with the financial year
      if (effectiveStart <= effectiveEnd) {
        // Calculate months active within financial year
        const monthsInYear = (effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24 * 30.44); // Average days per month
        const monthsActive = Math.max(0, Math.min(12, monthsInYear));
        
        // Calculate pro-rated amount based on billing cycle
        let monthlyAmount = 0;
        switch (sub.billing_cycle) {
          case 'monthly':
            monthlyAmount = sub.cost;
            break;
          case 'quarterly':
            monthlyAmount = sub.cost / 3;
            break;
          case 'annual':
            monthlyAmount = sub.cost / 12;
            break;
          case 'weekly':
            monthlyAmount = sub.cost * 4.33; // Average weeks per month
            break;
          default:
            monthlyAmount = sub.cost; // Default to monthly
        }
        
        const proratedAmount = monthlyAmount * monthsActive;
        
        totalBusinessExpenses += proratedAmount;
        totalTaxDeductible += proratedAmount;
        
        // Use individual tax rate from subscription, fallback to user's default
        const taxRate = sub.tax_rate || userProfile.tax_rate;
        const taxSaving = proratedAmount * (taxRate / 100);
        totalTaxSavings += taxSaving;
        
        console.log(`calculateTaxSummary - Subscription active ${monthsActive.toFixed(1)} months, pro-rated: ${proratedAmount.toFixed(2)} at ${taxRate}% = ${taxSaving.toFixed(2)} tax savings`);
      } else {
        console.log(`calculateTaxSummary - Subscription not active during financial year`);
      }
    }
  });
  
  // Process lifetime deals - only include if purchased within financial year
  lifetimeDeals.forEach((deal, index) => {
    console.log(`calculateTaxSummary - Lifetime Deal ${index}:`, {
      service_name: deal.service_name,
      original_cost: deal.original_cost,
      business_expense: deal.business_expense,
      tax_deductible: deal.tax_deductible,
      tax_rate: deal.tax_rate,
      purchase_date: deal.purchase_date
    });
    
    if (deal.business_expense && deal.tax_deductible) {
      const purchaseDate = new Date(deal.purchase_date);
      
      // Only include if purchased within the financial year
      if (purchaseDate >= financialYearStart && purchaseDate <= financialYearEnd) {
        totalBusinessExpenses += deal.original_cost;
        totalTaxDeductible += deal.original_cost;
        
        // Use individual tax rate from lifetime deal, fallback to user's default
        const taxRate = deal.tax_rate || userProfile.tax_rate;
        const taxSaving = deal.original_cost * (taxRate / 100);
        totalTaxSavings += taxSaving;
        
        console.log(`calculateTaxSummary - Lifetime deal purchased in financial year: ${deal.original_cost} at ${taxRate}% = ${taxSaving} tax savings`);
      } else {
        console.log(`calculateTaxSummary - Lifetime deal purchased outside financial year, excluded`);
      }
    }
  });
  
  const result = {
    totalBusinessExpenses,
    totalTaxDeductible,
    totalTaxSavings,
    averageTaxRate: totalTaxDeductible > 0 ? (totalTaxSavings / totalTaxDeductible) * 100 : userProfile.tax_rate,
  };
  
  console.log('calculateTaxSummary - Final result:', result);
  return result;
}

function calculateClientCosts(clients: any[], subscriptions: any[], lifetimeDeals: any[]) {
  return clients.map(client => {
    const clientSubscriptions = subscriptions.filter(sub => sub.client_id === client.id);
    const clientLifetimeDeals = lifetimeDeals.filter(deal => deal.client_id === client.id);
    
    let totalCost = 0;
    let subscriptionCost = 0;
    let lifetimeDealCost = 0;
    
    // Calculate subscription costs
    clientSubscriptions.forEach(sub => {
      const annualAmount = sub.billing_cycle === 'annual' ? sub.cost :
                          sub.billing_cycle === 'monthly' ? sub.cost * 12 :
                          sub.billing_cycle === 'quarterly' ? sub.cost * 4 :
                          sub.billing_cycle === 'weekly' ? sub.cost * 52 : sub.cost * 12;
      subscriptionCost += annualAmount;
    });
    
    // Calculate lifetime deal costs
    clientLifetimeDeals.forEach(deal => {
      lifetimeDealCost += deal.original_cost;
    });
    
    totalCost = subscriptionCost + lifetimeDealCost;
    
    return {
      ...client,
      totalCost,
      subscriptionCost,
      lifetimeDealCost,
      subscriptionCount: clientSubscriptions.length,
      lifetimeDealCount: clientLifetimeDeals.length,
    };
  }).sort((a, b) => b.totalCost - a.totalCost);
}

function calculateCategoryBreakdown(subscriptions: any[], lifetimeDeals: any[]) {
  const categories: { [key: string]: { total: number; count: number; items: any[] } } = {};
  
  // Process subscriptions
  subscriptions.forEach(sub => {
    const category = sub.category || 'other';
    if (!categories[category]) {
      categories[category] = { total: 0, count: 0, items: [] };
    }
    
    const annualAmount = sub.billing_cycle === 'annual' ? sub.cost :
                        sub.billing_cycle === 'monthly' ? sub.cost * 12 :
                        sub.billing_cycle === 'quarterly' ? sub.cost * 4 :
                        sub.billing_cycle === 'weekly' ? sub.cost * 52 : sub.cost * 12;
    
    categories[category].total += annualAmount;
    categories[category].count += 1;
    categories[category].items.push({ ...sub, calculatedAmount: annualAmount });
  });
  
  // Process lifetime deals
  lifetimeDeals.forEach(deal => {
    const category = deal.category || 'other';
    if (!categories[category]) {
      categories[category] = { total: 0, count: 0, items: [] };
    }
    
    categories[category].total += deal.original_cost;
    categories[category].count += 1;
    categories[category].items.push({ ...deal, calculatedAmount: deal.original_cost });
  });
  
  return Object.entries(categories)
    .map(([category, data]) => ({ category, ...data }))
    .sort((a, b) => b.total - a.total);
}
