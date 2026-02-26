import { useMutation, useQueryClient } from '@tanstack/react-query';
import { patientsApi, UpdatePatientDto } from '@/lib/api/patients';

export function usePatientUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePatientDto }) =>
      patientsApi.update(id, data),
    onSuccess: (updatedPatient) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({
        queryKey: ['patient', updatedPatient.id],
      });
      queryClient.invalidateQueries({
        queryKey: ['patient-detail', updatedPatient.id],
      });
    },
  });
}
