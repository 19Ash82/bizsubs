// Updated 2024-12-20: Utility functions for precise cache invalidation
// Ensures all related queries are properly invalidated across different filter states

import { QueryClient } from '@tanstack/react-query';
import { clientKeys } from './clients';
import { subscriptionKeys } from './subscriptions';
import { lifetimeDealKeys } from './lifetime-deals';
import { projectKeys } from './projects';

/**
 * Global cache refresh - invalidates ALL related queries
 * Use this for comprehensive updates that affect multiple data sources
 */
export function globalCacheRefresh(queryClient: QueryClient, source: 'subscription' | 'lifetime-deal' | 'client' | 'project') {
  // Invalidate all related queries (including the source to ensure fresh data)
  queryClient.invalidateQueries({ 
    queryKey: clientKeys.all,
    exact: false
  });
  
  queryClient.invalidateQueries({ 
    queryKey: subscriptionKeys.all,
    exact: false
  });
  
  queryClient.invalidateQueries({ 
    queryKey: lifetimeDealKeys.all,
    exact: false
  });
  
  queryClient.invalidateQueries({ 
    queryKey: projectKeys.all,
    exact: false
  });
  
  // Only refetch project queries immediately when subscriptions/lifetime deals change
  // This ensures project counts update without waiting for user interaction
  if (source === 'subscription' || source === 'lifetime-deal') {
    queryClient.refetchQueries({ 
      queryKey: projectKeys.lists(),
      exact: false,
      type: 'active'
    });
  }
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
  // Invalidate subscription queries
  queryClient.invalidateQueries({ 
    queryKey: subscriptionKeys.all,
    exact: false
  });
  
  // Invalidate project queries (for project count updates)
  queryClient.invalidateQueries({ 
    queryKey: projectKeys.all,
    exact: false
  });
  
  // Invalidate client queries (for client cost updates)
  queryClient.invalidateQueries({ 
    queryKey: clientKeys.all,
    exact: false
  });
}

/**
 * Complete invalidation for lifetime deal-related changes
 */
export function invalidateAfterLifetimeDealChange(queryClient: QueryClient) {
  // Invalidate lifetime deal queries
  queryClient.invalidateQueries({ 
    queryKey: lifetimeDealKeys.all,
    exact: false
  });
  
  // Invalidate project queries (for project count updates)
  queryClient.invalidateQueries({ 
    queryKey: projectKeys.all,
    exact: false
  });
  
  // Invalidate client queries (for client cost updates)
  queryClient.invalidateQueries({ 
    queryKey: clientKeys.all,
    exact: false
  });
}

/**
 * Complete invalidation for client-related changes
 */
export function invalidateAfterClientChange(queryClient: QueryClient) {
  // Use global cache refresh for comprehensive updates
  globalCacheRefresh(queryClient, 'client');
}

/**
 * Invalidate all project cost queries regardless of filter state
 * This ensures that project cost data is refreshed even with different filter combinations
 */
export function invalidateAllProjectCosts(queryClient: QueryClient) {
  // Invalidate all project list queries (catches all filter variations)
  queryClient.invalidateQueries({ 
    queryKey: projectKeys.lists(),
    exact: false // This ensures all queries starting with this key are invalidated
  });
  
  // Also invalidate project costs queries
  queryClient.invalidateQueries({ 
    queryKey: projectKeys.costs(),
    exact: false
  });
}

/**
 * Complete invalidation for project-related changes
 */
export function invalidateAfterProjectChange(queryClient: QueryClient) {
  // Use global cache refresh for comprehensive updates
  globalCacheRefresh(queryClient, 'project');
}
