import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { observabilityApi } from '@/lib/api/observability';

export const useObservabilityTraces = (limit = 50) =>
  useQuery({
    queryKey: ['observability', 'traces', limit],
    queryFn: () => observabilityApi.getTraces(limit),
    staleTime: 5 * 1000,
    refetchInterval: 10 * 1000,
  });

export const useObservabilityStats = () =>
  useQuery({
    queryKey: ['observability', 'stats'],
    queryFn: () => observabilityApi.getStats(),
    staleTime: 5 * 1000,
    refetchInterval: 10 * 1000,
  });

export const useClearTraces = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => observabilityApi.clearTraces(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['observability'] });
    },
  });
};
