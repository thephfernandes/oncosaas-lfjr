'use client';

import { useState } from 'react';
import { Bot, Check, Pencil, X, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AgentSuggestionCardProps {
  messageId: string;
  patientId: string;
  suggestedText: string;
  onAccept: (messageId: string, patientId: string) => void;
  onEdit: (messageId: string, patientId: string, editedText: string) => void;
  onReject: (messageId: string, patientId: string) => void;
  isLoading?: boolean;
}

export function AgentSuggestionCard({
  messageId,
  patientId,
  suggestedText,
  onAccept,
  onEdit,
  onReject,
  isLoading = false,
}: AgentSuggestionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(suggestedText);

  const handleConfirmEdit = () => {
    if (editedText.trim()) {
      onEdit(messageId, patientId, editedText.trim());
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedText(suggestedText);
  };

  return (
    <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
      {/* Badge de identificação */}
      <div className="mb-2 flex items-center gap-1.5">
        <Bot className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
        <Badge
          variant="outline"
          className="border-blue-300 bg-blue-100 px-1.5 py-0 text-[11px] font-semibold text-blue-700"
        >
          Sugestão do Agente IA
        </Badge>
      </div>

      {/* Texto da sugestão ou textarea para edição */}
      {isEditing ? (
        <textarea
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          className="w-full resize-none rounded-md border border-blue-300 bg-white p-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
          rows={4}
          aria-label="Editar sugestão do agente"
          disabled={isLoading}
        />
      ) : (
        <p className="border-l-4 border-blue-400 pl-3 text-sm text-gray-800 whitespace-pre-wrap">
          {suggestedText}
        </p>
      )}

      {/* Ações */}
      <div className="mt-3 flex flex-wrap gap-2">
        {isEditing ? (
          <>
            <Button
              size="sm"
              onClick={handleConfirmEdit}
              disabled={isLoading || !editedText.trim()}
              className="gap-1.5 bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
              aria-label="Confirmar edição e enviar"
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              Confirmar e Enviar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancelEdit}
              disabled={isLoading}
              className="gap-1.5"
              aria-label="Cancelar edição"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              Cancelar
            </Button>
          </>
        ) : (
          <>
            <Button
              size="sm"
              onClick={() => onAccept(messageId, patientId)}
              disabled={isLoading}
              className="gap-1.5 bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
              aria-label="Aceitar sugestão e enviar ao paciente"
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              Enviar
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditing(true)}
              disabled={isLoading}
              className="gap-1.5"
              aria-label="Editar sugestão antes de enviar"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              Editar
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => onReject(messageId, patientId)}
              disabled={isLoading}
              className="gap-1.5 border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-60"
              aria-label="Rejeitar sugestão"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              Rejeitar
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
