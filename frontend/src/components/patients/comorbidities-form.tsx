'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { Comorbidity } from '@/lib/api/patients';

interface ComorbiditiesFormProps {
  value?: Comorbidity[];
  onChange: (comorbidities: Comorbidity[]) => void;
}

export function ComorbiditiesForm({
  value = [],
  onChange,
}: ComorbiditiesFormProps) {
  const [comorbidities, setComorbidities] = useState<Comorbidity[]>(
    value || []
  );

  // Sincronizar com value quando mudar externamente
  useEffect(() => {
    // Sempre atualizar quando value mudar, mesmo se for array vazio
    setComorbidities(Array.isArray(value) ? value : []);
  }, [value]);

  const addComorbidity = () => {
    const newComorbidity: Comorbidity = {
      name: '',
      severity: 'leve',
      controlled: false,
    };
    const updated = [...comorbidities, newComorbidity];
    setComorbidities(updated);
    // Não filtrar aqui - permitir adicionar item vazio para preencher
    onChange(updated);
  };

  const updateComorbidity = (
    index: number,
    field: keyof Comorbidity,
    value: any
  ) => {
    const updated = [...comorbidities];
    updated[index] = { ...updated[index], [field]: value };
    setComorbidities(updated);
    // Enviar todas as comorbidades (incluindo parcialmente preenchidas)
    // A filtragem de itens vazios será feita no submit do formulário
    onChange(updated);
  };

  const removeComorbidity = (index: number) => {
    const updated = comorbidities.filter((_, i) => i !== index);
    setComorbidities(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Comorbidades</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addComorbidity}
        >
          <Plus className="h-4 w-4 mr-1" />
          Adicionar
        </Button>
      </div>

      {comorbidities.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma comorbidade adicionada. Clique em "Adicionar" para incluir.
        </p>
      ) : (
        <div className="space-y-3">
          {comorbidities.map((comorbidity, index) => (
            <div
              key={index}
              className="flex gap-2 items-start p-3 border rounded-lg bg-gray-50"
            >
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Nome da Comorbidade</Label>
                  <Input
                    placeholder="Ex: Hipertensão, Diabetes"
                    value={comorbidity.name}
                    onChange={(e) =>
                      updateComorbidity(index, 'name', e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Gravidade</Label>
                  <Select
                    value={comorbidity.severity}
                    onValueChange={(value) =>
                      updateComorbidity(index, 'severity', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="leve">Leve</SelectItem>
                      <SelectItem value="moderada">Moderada</SelectItem>
                      <SelectItem value="grave">Grave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id={`controlled-${index}`}
                    checked={comorbidity.controlled}
                    onChange={(e) =>
                      updateComorbidity(index, 'controlled', e.target.checked)
                    }
                    className="h-4 w-4"
                  />
                  <Label
                    htmlFor={`controlled-${index}`}
                    className="text-xs cursor-pointer"
                  >
                    Controlada
                  </Label>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeComorbidity(index)}
                className="mt-6"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
