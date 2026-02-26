import { useQuery } from '@tanstack/react-query';
import { nurseMetricsApi } from '@/lib/api/nurse-metrics';

export const useNurseMetrics = () => {
  return useQuery({
    queryKey: ['nurse-metrics'],
    queryFn: () => nurseMetricsApi.getMetrics(),
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: true,
  });
};
