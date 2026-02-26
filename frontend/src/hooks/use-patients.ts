import { useQuery } from '@tanstack/react-query';
import { patientsApi, Patient } from '@/lib/api/patients';

export const usePatients = () => {
  return useQuery<Patient[]>({
    queryKey: ['patients'],
    queryFn: () => patientsApi.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};
