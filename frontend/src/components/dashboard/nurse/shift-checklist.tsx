'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

interface ShiftChecklistProps {
  type: 'start' | 'end';
}

const START_SHIFT_ITEMS: ChecklistItem[] = [
  { id: 'check-alerts', label: 'Verificar alertas críticos', checked: false },
  {
    id: 'review-priority',
    label: 'Revisar pacientes de alta prioridade',
    checked: false,
  },
  {
    id: 'check-no-response',
    label: 'Verificar pacientes sem resposta (≥3 dias)',
    checked: false,
  },
];

const END_SHIFT_ITEMS: ChecklistItem[] = [
  { id: 'review-pending', label: 'Revisar alertas pendentes', checked: false },
  { id: 'add-notes', label: 'Adicionar notas se necessário', checked: false },
  {
    id: 'check-followup',
    label: 'Verificar casos para follow-up',
    checked: false,
  },
];

export function ShiftChecklist({ type }: ShiftChecklistProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuthStore();
  const [items, setItems] = useState<ChecklistItem[]>(() => {
    if (typeof window === 'undefined') {
      return type === 'start' ? START_SHIFT_ITEMS : END_SHIFT_ITEMS;
    }
    const userId = useAuthStore.getState().user?.id;
    const storageKey = `shift-checklist-${type}-${userId}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved) as ChecklistItem[];
      } catch {
        // Ignorar erro de parsing
      }
    }
    return type === 'start' ? START_SHIFT_ITEMS : END_SHIFT_ITEMS;
  });

  // Salvar estado no localStorage
  const saveToStorage = (newItems: ChecklistItem[]) => {
    const storageKey = `shift-checklist-${type}-${user?.id}`;
    localStorage.setItem(storageKey, JSON.stringify(newItems));
  };

  const toggleItem = (id: string) => {
    const newItems = items.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    setItems(newItems);
    saveToStorage(newItems);
  };

  const resetChecklist = () => {
    const defaultItems = type === 'start' ? START_SHIFT_ITEMS : END_SHIFT_ITEMS;
    setItems(defaultItems);
    saveToStorage(defaultItems);
  };

  const completedCount = items.filter((item) => item.checked).length;
  const totalCount = items.length;
  const progress =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="relative"
      >
        <ClipboardList className="h-4 w-4 mr-2" />
        Checklist de {type === 'start' ? 'Início' : 'Fim'} de Turno
        {completedCount > 0 && (
          <Badge
            variant="secondary"
            className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {completedCount}/{totalCount}
          </Badge>
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Checklist de {type === 'start' ? 'Início' : 'Fim'} de Turno
            </DialogTitle>
            <DialogDescription>
              Complete as tarefas para garantir uma transição eficiente entre
              turnos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Barra de progresso */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progresso</span>
                <span className="font-medium">
                  {completedCount} de {totalCount} concluídas
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Lista de itens */}
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50"
                >
                  <Checkbox
                    id={item.id}
                    checked={item.checked}
                    onCheckedChange={() => toggleItem(item.id)}
                  />
                  <label
                    htmlFor={item.id}
                    className={`text-sm flex-1 cursor-pointer ${
                      item.checked ? 'line-through text-muted-foreground' : ''
                    }`}
                  >
                    {item.label}
                  </label>
                  {item.checked && (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  )}
                </div>
              ))}
            </div>

            {/* Botões de ação */}
            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={resetChecklist}>
                Reiniciar
              </Button>
              <Button onClick={() => setIsOpen(false)}>Fechar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
