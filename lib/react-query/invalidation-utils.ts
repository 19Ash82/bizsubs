// Updated 2024-12-20: Utility functions for precise cache invalidation
// Ensures all related queries are properly invalidated across different filter states

import { QueryClient } from '@tanstack/react-query';
import { clientKeys } from './clients';
import { subscriptionKeys } from './subscriptions';
import { lifetimeDealKeys } from './lifetime-deals';

/**
 * Global cache refresh - invalidates ALL related queries
 * Use this for comprehensive updates that affect multiple data sources
 */
export function globalCacheRefresh(queryClient: QueryClient, source: 'subscription' | 'lifetime-deal' | 'client') {
  console.log(`🌍 Global cache refresh initiated from: ${source}`);
  
  // Invalidate all client-related queries (most important for cross-tab sync)
  queryClient.invalidateQueries({ 
    queryKey: clientKeys.all,
    exact: false
  });
  
  // Only invalidate other queries if not from the same source to avoid conflicts
  if (source !== 'subscription') {
    queryClient.invalidateQueries({ 
      queryKey: subscriptionKeys.all,
      exact: false
    });
  }
  
  if (source !== 'lifetime-deal') {
    queryClient.invalidateQueries({ 
      queryKey: lifetimeDealKeys.all,
      exact: false
    });
  }
  
  // Only refetch client queries immediately (for cross-tab sync)
  queryClient.refetchQueries({ 
    queryKey: clientKeys.costs(),
    exact: false,
    type: 'active'
  });
  
  console.log(`✅ Global cache refresh complete from: ${source}`);
}

/**
 * Invalidate all client cost queries regardless of filter state
 * This ensures that client cost data is refreshed even with different filter combinations
 */
export function invalidateAllClientCosts(queryClient: QueryClient) {
  // Invalidate the base costs key (catches all filter variations)
  queryClient.invalidateQueries({ 
    queryKey: clientKeys.costs(),
    exact: false // This ensures all queries starting with this key are invalidated
  });
  
  // Also invalidate basic client lists
  queryClient.invalidateQueries({ 
    queryKey: clientKeys.lists(),
    exact: false
  });
}

/**
 * Invalidate subscription queries that include client data
 */
export function invalidateSubscriptionsWithClientData(queryClient: QueryClient) {
  queryClient.invalidateQueries({ 
    queryKey: subscriptionKeys.lists(),
    exact: false
  });
}

/**
 * Invalidate lifetime deal queries that include client data
 */
export function invalidateLifetimeDealsWithClientData(queryClient: QueryClient) {
  queryClient.invalidateQueries({ 
    queryKey: lifetimeDealKeys.lists(),
    exact: false
  });
}

/**
 * Complete invalidation for subscription-related changes
 * Use this when subscriptions are created, updated, or deleted
 */
export function invalidateAfterSubscriptionChange(queryClient: QueryClient) {
  // Use global cache refresh for comprehensive updates
  globalCacheRefresh(queryClient, 'subscription');
}

/**
 * Complete invalidation for lifetime deal-related changes
 */
export function invalidateAfterLifetimeDealChange(queryClient: QueryClient) {
  // Use global cache refresh for comprehensive updates
  globalCacheRefresh(queryClient, 'lifetime-deal');
}

/**
 * Complete invalidation for client-related changes
 */
export function invalidateAfterClientChange(queryClient: QueryClient) {
  // Use global cache refresh for comprehensive updates
  globalCacheRefresh(queryClient, 'client');
}
