import { useQuery } from '@tanstack/react-query';
import { interventionsApi, Intervention } from '@/lib/api/interventions';

export const useInterventionHistory = (patientId?: string) => {
  return useQuery<Intervention[], Error>({
    queryKey: ['interventions', patientId ? `patient-${patientId}` : 'me'],
    queryFn: () => {
      if (patientId) {
        return interventionsApi.getByPatient(patientId);
      }
      return interventionsApi.getMyInterventions();
    },
  });
};

export const useMyInterventions = () => {
  return useQuery<Intervention[], Error>({
    queryKey: ['interventions', 'me'],
    queryFn: () => interventionsApi.getMyInterventions(),
  });
};

export const usePatientInterventions = (patientId: string) => {
  return useQuery<Intervention[], Error>({
    queryKey: ['interventions', 'patient', patientId],
    queryFn: () => interventionsApi.getByPatient(patientId),
    enabled: !!patientId,
  });
};
