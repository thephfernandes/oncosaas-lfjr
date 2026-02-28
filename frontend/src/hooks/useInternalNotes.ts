import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  internalNotesApi,
  CreateInternalNoteDto,
  UpdateInternalNoteDto,
  InternalNote,
} from '@/lib/api/internal-notes';
import { toast } from 'sonner';

export const useInternalNotes = (patientId?: string) => {
  return useQuery<InternalNote[], Error>({
    queryKey: ['internal-notes', patientId],
    queryFn: () => internalNotesApi.getAll(patientId),
    enabled: !!patientId || patientId === undefined, // Sempre habilitado, mas filtra por patientId se fornecido
  });
};

export const useCreateInternalNote = () => {
  const queryClient = useQueryClient();

  return useMutation<InternalNote, Error, CreateInternalNoteDto>({
    mutationFn: (data) => internalNotesApi.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['internal-notes'] });
      toast.success('Nota interna criada com sucesso!');
    },
    onError: (error: unknown) => {
      const errorMessage =
        error instanceof Error && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : 'Erro ao criar nota interna';
      toast.error(errorMessage || 'Erro ao criar nota interna');
    },
  });
};

export const useUpdateInternalNote = () => {
  const queryClient = useQueryClient();

  return useMutation<
    InternalNote,
    Error,
    { id: string; data: UpdateInternalNoteDto }
  >({
    mutationFn: ({ id, data }) => internalNotesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-notes'] });
      toast.success('Nota interna atualizada com sucesso!');
    },
    onError: (error: unknown) => {
      const errorMessage =
        error instanceof Error && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : 'Erro ao atualizar nota interna';
      toast.error(errorMessage || 'Erro ao atualizar nota interna');
    },
  });
};

export const useDeleteInternalNote = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => internalNotesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-notes'] });
      toast.success('Nota interna deletada com sucesso!');
    },
    onError: (error: unknown) => {
      const errorMessage =
        error instanceof Error && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : 'Erro ao deletar nota interna';
      toast.error(errorMessage || 'Erro ao deletar nota interna');
    },
  });
};
