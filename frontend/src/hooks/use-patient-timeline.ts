import { useQuery } from '@tanstack/react-query';
import {
  patientsApi,
  TimelineEvent,
  TimelineEventType,
  TimelineQueryParams,
} from '@/lib/api/patients';

export type { TimelineEvent, TimelineEventType };

export function usePatientTimeline(
  patientId: string | undefined,
  params?: TimelineQueryParams
) {
  const query = useQuery({
    queryKey: ['patient-timeline', patientId, params],
    queryFn: () => patientsApi.getTimeline(patientId!, params),
    enabled: !!patientId,
    staleTime: 60 * 1000,
  });

  return {
    timeline: query.data?.data ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
