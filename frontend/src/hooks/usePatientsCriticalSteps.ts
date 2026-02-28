import { useQuery } from '@tanstack/react-query';
import {
  patientsCriticalStepsApi,
  PatientsCriticalStepsFilters,
} from '@/lib/api/patients-critical-steps';

export const usePatientsCriticalSteps = (
  filters?: PatientsCriticalStepsFilters
) => {
  return useQuery({
    queryKey: ['patients-critical-steps', filters],
    queryFn: () => patientsCriticalStepsApi.getAll(filters),
    staleTime: 2 * 60 * 1000, // 2 minutos (dados mais dinâmicos)
    refetchOnWindowFocus: true,
  });
};
