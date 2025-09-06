// Updated 2024-12-21: Specialized hook for data container blur overlay
// Applies blur only to dynamic data while keeping static UI elements crisp

import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface UseDataContainerBlurOptions {
  queryKeys: string[]; // Query keys to monitor for refetching
  enabled?: boolean; // Whether blur should be enabled
  intensity?: 'subtle' | 'medium' | 'strong';
}

interface DataContainerBlurState {
  isRefreshing: boolean;
  dataBlurClass: string;
  staticElementClass: string;
}

/**
 * Hook for applying blur overlay specifically to data containers
 * Monitors TanStack Query isRefetching state and applies appropriate classes
 */
export function useDataContainerBlur({
  queryKeys,
  enabled = true,
  intensity = 'medium'
}: UseDataContainerBlurOptions): DataContainerBlurState {
  const queryClient = useQueryClient();

  // Check if any monitored queries are refetching
  const isRefreshing = useMemo(() => {
    if (!enabled) return false;

    const queries = queryClient.getQueriesData({
      predicate: (query) => {
        return queryKeys.some(key => 
          query.queryKey.includes(key) || 
          query.queryKey[0] === key
        );
      }
    });

    return queries.some(([, queryState]: any) => {
      // Only consider it refetching if we have existing data (stale-while-revalidate)
      return queryState?.isFetching && queryState?.data !== undefined;
    });
  }, [queryClient, queryKeys, enabled]);

  // Define blur intensity classes for data containers
  const blurIntensities = {
    subtle: 'opacity-80 transition-opacity duration-200 ease-in-out',
    medium: 'opacity-60 transition-opacity duration-200 ease-in-out', 
    strong: 'opacity-40 transition-opacity duration-200 ease-in-out'
  };

  return {
    isRefreshing,
    dataBlurClass: isRefreshing ? blurIntensities[intensity] : 'transition-opacity duration-200 ease-in-out',
    staticElementClass: 'opacity-100', // Static elements remain crisp
  };
}

// Note: React component wrappers moved to separate files to avoid JSX in .ts files
// Use the useDataContainerBlur hook directly in your components instead
