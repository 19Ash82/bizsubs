// Updated 2024-12-20: React Query client configuration for optimistic updates
// Implements PRD performance targets: 5min stale time, 30min cache time

import { QueryClient } from '@tanstack/react-query';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // PRD requirement: 5 minutes stale time, 30 minutes cache time
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 1,
        retryDelay: 1000,
      },
    },
  });
}
