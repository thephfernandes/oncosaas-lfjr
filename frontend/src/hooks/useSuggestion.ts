import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  messagesApi,
  Message,
  SuggestionAction,
} from '@/lib/api/messages';

interface UpdateSuggestionVariables {
  messageId: string;
  patientId: string;
  action: SuggestionAction;
  editedText?: string;
}

export function useUpdateSuggestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, action, editedText }: UpdateSuggestionVariables) =>
      messagesApi.updateSuggestion(messageId, { action, editedText }),

    onSuccess: (updatedMessage: Message, variables: UpdateSuggestionVariables) => {
      // Atualizar a mensagem no cache sem refetch completo
      queryClient.setQueryData<Message[]>(
        ['messages', variables.patientId],
        (old) => {
          if (!old) return [updatedMessage];
          return old.map((msg) =>
            msg.id === variables.messageId ? updatedMessage : msg
          );
        }
      );

      // Invalidar para garantir consistência com dados do servidor
      queryClient.invalidateQueries({
        queryKey: ['messages', variables.patientId],
      });
    },
  });
}
