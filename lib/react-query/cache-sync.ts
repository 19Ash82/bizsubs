// Updated 2024-12-20: Cross-cache synchronization utilities
// Implements efficient cache invalidation strategies for related data

import { useQueryClient } from '@tanstack/react-query';
import { clientKeys } from './clients';
import { subscriptionKeys } from './subscriptions';
import { lifetimeDealKeys } from './lifetime-deals';

/**
 * Custom hook for managing cross-cache invalidation
 * Provides efficient methods to sync related caches
 */
export function useCacheSync() {
  const queryClient = useQueryClient();

  return {
    /**
     * Invalidate all client-related caches
     * Use when subscription/lifetime deal assignments change
     */
    invalidateClientCosts: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.costs() });
    },

    /**
     * Invalidate subscription caches that include client data
     * Use when client names/colors change
     */
    invalidateSubscriptionsWithClientData: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() });
    },

    /**
     * Invalidate lifetime deal caches that include client data
     * Use when client names/colors change
     */
    invalidateLifetimeDealsWithClientData: () => {
      queryClient.invalidateQueries({ queryKey: lifetimeDealKeys.lists() });
    },

    /**
     * Full sync - invalidate all related caches
     * Use sparingly, only when major data structure changes
     */
    invalidateAllRelatedCaches: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.all });
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
      queryClient.invalidateQueries({ queryKey: lifetimeDealKeys.all });
    },

    /**
     * Optimistic update for client costs based on subscription changes
     * More efficient than full invalidation
     */
    updateClientCostsOptimistically: (
      clientId: string, 
      costChange: { monthly: number; annual: number }
    ) => {
      queryClient.setQueriesData(
        { queryKey: clientKeys.costs() },
        (oldClients: any[] | undefined) => {
          if (!oldClients) return oldClients;
          
          return oldClients.map(client => 
            client.id === clientId 
              ? {
                  ...client,
                  monthly_cost: (client.monthly_cost || 0) + costChange.monthly,
                  annual_cost: (client.annual_cost || 0) + costChange.annual,
                }
              : client
          );
        }
      );
    },

    /**
     * Check if client cost data is stale
     * Returns true if subscription data is newer than client cost data
     */
    isClientCostDataStale: () => {
      const subscriptionQuery = queryClient.getQueryState(subscriptionKeys.lists());
      const clientCostQuery = queryClient.getQueryState(clientKeys.costs());
      
      if (!subscriptionQuery || !clientCostQuery) return false;
      
      return (subscriptionQuery.dataUpdatedAt || 0) > (clientCostQuery.dataUpdatedAt || 0);
    },

    /**
     * Prefetch client costs when subscription data changes
     * Proactive cache warming
     */
    prefetchClientCosts: () => {
      queryClient.prefetchQuery({
        queryKey: clientKeys.costs(),
        staleTime: 30000, // 30 seconds
      });
    }
  };
}

/**
 * Query key utilities for cache management
 */
export const cacheUtils = {
  /**
   * Get all query keys that depend on client data
   */
  getClientDependentKeys: () => [
    clientKeys.all,
    subscriptionKeys.lists(),
    lifetimeDealKeys.lists(),
  ],

  /**
   * Get query keys that affect client cost calculations
   */
  getCostAffectingKeys: () => [
    subscriptionKeys.lists(),
    lifetimeDealKeys.lists(),
  ],

  /**
   * Check if a query key affects client costs
   */
  affectsClientCosts: (queryKey: unknown[]) => {
    const keyStr = JSON.stringify(queryKey);
    return keyStr.includes('subscriptions') || keyStr.includes('lifetime-deals');
  },
};
