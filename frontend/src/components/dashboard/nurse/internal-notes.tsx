'use client';

import { useState } from 'react';
import {
  useInternalNotes,
  useCreateInternalNote,
  useUpdateInternalNote,
  useDeleteInternalNote,
} from '@/hooks/useInternalNotes';
import { interventionsApi } from '@/lib/api/interventions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuthStore } from '@/stores/auth-store';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { InternalNote } from '@/lib/api/internal-notes';

interface InternalNotesProps {
  patientId: string;
}

export function InternalNotes({ patientId }: InternalNotesProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingContent, setEditingContent] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<InternalNote | null>(null);

  const { user } = useAuthStore();
  const { data: notes, isLoading } = useInternalNotes(patientId);
  const createMutation = useCreateInternalNote();
  const updateMutation = useUpdateInternalNote();
  const deleteMutation = useDeleteInternalNote();

  const handleCreate = async () => {
    if (!newNoteContent.trim()) return;

    try {
      await createMutation.mutateAsync({
        patientId,
        content: newNoteContent,
      });
      setNewNoteContent('');
      setIsCreating(false);

      // Registrar intervenção automaticamente ao criar nota
      try {
        await interventionsApi.create({
          patientId,
          type: 'NOTE_ADDED',
          notes: 'Nota interna adicionada',
        });
      } catch (interventionError) {
        // Não bloquear o fluxo se falhar ao registrar intervenção
        console.error('Erro ao registrar intervenção:', interventionError);
      }
    } catch (error) {
      // Erro já tratado pelo hook com toast
    }
  };

  const handleStartEdit = (note: InternalNote) => {
    setEditingId(note.id);
    setEditingContent(note.content);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingContent('');
  };

  const handleSaveEdit = async (id: string) => {
    if (!editingContent.trim()) return;

    try {
      await updateMutation.mutateAsync({
        id,
        data: { content: editingContent },
      });
      setEditingId(null);
      setEditingContent('');
    } catch (error) {
      // Erro já tratado pelo hook com toast
    }
  };

  const handleDeleteClick = (note: InternalNote) => {
    setNoteToDelete(note);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!noteToDelete) return;

    try {
      await deleteMutation.mutateAsync(noteToDelete.id);
      setDeleteDialogOpen(false);
      setNoteToDelete(null);
    } catch (error) {
      // Erro já tratado pelo hook com toast
    }
  };

  const canEditOrDelete = (note: InternalNote) => {
    if (!user) return false;
    return (
      note.authorId === user.id ||
      user.role === 'ADMIN' ||
      user.role === 'NURSE_CHIEF'
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Notas Internas</CardTitle>
          {!isCreating && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreating(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Nota
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Formulário de criação */}
        {isCreating && (
          <div className="space-y-2 p-4 border rounded-lg">
            <Textarea
              placeholder="Digite sua nota interna..."
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsCreating(false);
                  setNewNoteContent('');
                }}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleCreate}
                disabled={!newNoteContent.trim() || createMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            </div>
          </div>
        )}

        {/* Lista de notas */}
        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground">
            Carregando notas...
          </div>
        ) : !notes || notes.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            Nenhuma nota interna ainda.
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div key={note.id} className="p-4 border rounded-lg space-y-2">
                {editingId === note.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      rows={3}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelEdit}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSaveEdit(note.id)}
                        disabled={
                          !editingContent.trim() || updateMutation.isPending
                        }
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Salvar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between">
                      <p className="text-sm whitespace-pre-wrap">
                        {note.content}
                      </p>
                      {canEditOrDelete(note) && (
                        <div className="flex gap-2 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStartEdit(note)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(note)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline">{note.author.name}</Badge>
                      <span>
                        {format(
                          new Date(note.createdAt),
                          "dd/MM/yyyy 'às' HH:mm",
                          {
                            locale: ptBR,
                          }
                        )}
                      </span>
                      {note.updatedAt !== note.createdAt && (
                        <span className="italic">(editada)</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar esta nota interna? Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
