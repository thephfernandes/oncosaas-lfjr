import { useQuery } from '@tanstack/react-query';
import { patientsApi, PatientDetail } from '@/lib/api/patients';

export const usePatientDetail = (id: string | null) => {
  return useQuery<PatientDetail>({
    queryKey: ['patient', id],
    queryFn: () => patientsApi.getDetail(id!),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};
