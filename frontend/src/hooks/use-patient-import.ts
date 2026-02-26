import { useMutation } from '@tanstack/react-query';
import { patientsApi, ImportCsvResult } from '@/lib/api/patients';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const usePatientImport = () => {
  const queryClient = useQueryClient();

  return useMutation<ImportCsvResult, Error, File>({
    mutationFn: (file: File) => patientsApi.importCsv(file),
    onSuccess: (data) => {
      // Invalidar cache de pacientes para refetch
      queryClient.invalidateQueries({ queryKey: ['patients'] });

      if (data.success > 0) {
        toast.success(`${data.success} pacientes importados com sucesso!`);
      }

      if (data.errors.length > 0) {
        toast.warning(
          `${data.errors.length} linhas com erros. Verifique os detalhes.`
        );
      }
    },
    onError: (error) => {
      toast.error(`Erro ao importar: ${error.message}`);
    },
  });
};
