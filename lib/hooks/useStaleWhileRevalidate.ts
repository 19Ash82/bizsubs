// Updated 2024-12-21: Stale-while-revalidate hook for selective blur overlay pattern
// Shows cached data immediately with blur overlay during background refresh

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface UseStaleWhileRevalidateOptions {
  queryKeys: string[][]; // Array of query keys to monitor
  blurIntensity?: 'light' | 'medium' | 'heavy';
  minRefreshDuration?: number; // Minimum time to show blur (prevents flashing)
}

interface StaleWhileRevalidateState {
  isRefreshing: boolean;
  hasStaleData: boolean;
  blurClass: string;
  containerClass: string;
}

/**
 * Hook for implementing stale-while-revalidate UI pattern with selective blur overlay
 * 
 * @param options Configuration options for the hook
 * @returns State object with blur classes and refresh status
 */
export function useStaleWhileRevalidate({
  queryKeys,
  blurIntensity = 'medium',
  minRefreshDuration = 300, // 300ms minimum to prevent flashing
}: UseStaleWhileRevalidateOptions): StaleWhileRevalidateState {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasStaleData, setHasStaleData] = useState(false);
  const [blurTimeout, setBlurTimeout] = useState<NodeJS.Timeout | null>(null);

  // Define blur intensity classes
  const blurClasses = {
    light: 'opacity-80 transition-opacity duration-300',
    medium: 'opacity-60 transition-opacity duration-300',
    heavy: 'opacity-40 blur-[1px] transition-all duration-300',
  };

  const containerClasses = {
    light: 'relative',
    medium: 'relative',
    heavy: 'relative',
  };

  useEffect(() => {
    // Check if any of the monitored queries are currently refetching
    const checkRefreshingStatus = () => {
      const queries = queryClient.getQueriesData({ 
        predicate: (query) => {
          return queryKeys.some(key => 
            JSON.stringify(query.queryKey).includes(JSON.stringify(key))
          );
        }
      });

      const anyRefetching = queries.some(([, queryState]: any) => {
        return queryState?.isFetching && queryState?.data !== undefined;
      });

      const anyHasStaleData = queries.some(([, queryState]: any) => {
        return queryState?.isStale && queryState?.data !== undefined;
      });

      if (anyRefetching && !isRefreshing) {
        // Clear any existing timeout
        if (blurTimeout) {
          clearTimeout(blurTimeout);
        }
        
        setIsRefreshing(true);
        setHasStaleData(anyHasStaleData);
      } else if (!anyRefetching && isRefreshing) {
        // Add minimum duration to prevent flashing
        const timeout = setTimeout(() => {
          setIsRefreshing(false);
          setHasStaleData(false);
        }, minRefreshDuration);
        
        setBlurTimeout(timeout);
      }
    };

    // Initial check
    checkRefreshingStatus();

    // Subscribe to query cache changes
    const unsubscribe = queryClient.getQueryCache().subscribe(checkRefreshingStatus);

    return () => {
      unsubscribe();
      if (blurTimeout) {
        clearTimeout(blurTimeout);
      }
    };
  }, [queryClient, queryKeys, isRefreshing, blurTimeout, minRefreshDuration]);

  return {
    isRefreshing,
    hasStaleData,
    blurClass: isRefreshing ? blurClasses[blurIntensity] : '',
    containerClass: containerClasses[blurIntensity],
  };
}

/**
 * Utility function to create query key patterns for monitoring
 */
export function createQueryKeyPatterns(baseKeys: string[]): string[][] {
  return baseKeys.map(key => [key]);
}

// Note: Higher-order component wrapper removed to avoid JSX in .ts file
// Use the useStaleWhileRevalidate hook directly in your components instead

