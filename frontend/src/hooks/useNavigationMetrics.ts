import { useQuery } from '@tanstack/react-query';
import { navigationMetricsApi } from '@/lib/api/navigation-metrics';

export const useNavigationMetrics = () => {
  return useQuery({
    queryKey: ['navigation-metrics'],
    queryFn: () => navigationMetricsApi.getMetrics(),
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: true,
  });
};
