import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertsApi, Alert, CreateAlertDto } from '@/lib/api/alerts';

export const useAlerts = (status?: Alert['status']) => {
  return useQuery({
    queryKey: ['alerts', status],
    queryFn: () => alertsApi.getAll(status),
    staleTime: 1 * 60 * 1000, // 1 minuto (dados mais dinâmicos)
  });
};

export const useAlert = (id: string) => {
  return useQuery({
    queryKey: ['alerts', id],
    queryFn: () => alertsApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAlertDto) => alertsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
};

export const useAcknowledgeAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => alertsApi.acknowledge(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'metrics'] });
    },
  });
};

export const useResolveAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => alertsApi.resolve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'metrics'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'statistics'] });
    },
  });
};

export const useDismissAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => alertsApi.dismiss(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
};

export const useCriticalAlertsCount = () => {
  return useQuery({
    queryKey: ['alerts', 'critical', 'count'],
    queryFn: () => alertsApi.getCriticalCount(),
    staleTime: 30 * 1000, // 30 segundos (atualizar mais frequentemente)
    refetchInterval: 30 * 1000, // Atualizar a cada 30 segundos
  });
};
