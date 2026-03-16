'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import { type CreateMedicationDto, type MedicationCategory } from '@/lib/api/patients';

const CATEGORY_OPTIONS: { value: MedicationCategory; label: string; riskBadge?: string }[] = [
  { value: 'ANTICOAGULANT', label: 'Anticoagulante', riskBadge: 'Sangramento' },
  { value: 'ANTIPLATELET', label: 'Antiplaquetário', riskBadge: 'Sangramento' },
  { value: 'CORTICOSTEROID', label: 'Corticosteroide', riskBadge: 'Mascara febre' },
  { value: 'IMMUNOSUPPRESSANT', label: 'Imunossupressor', riskBadge: 'Infecção' },
  { value: 'NSAID', label: 'AINE (anti-inflamatório)', riskBadge: 'Sangramento GI' },
  { value: 'OPIOID_ANALGESIC', label: 'Opioide analgésico', riskBadge: 'Sedação' },
  { value: 'NON_OPIOID_ANALGESIC', label: 'Analgésico não-opioide', riskBadge: undefined },
  { value: 'ANTIEMETIC', label: 'Antiemético', riskBadge: undefined },
  { value: 'ANTIBIOTIC', label: 'Antibiótico', riskBadge: undefined },
  { value: 'ANTIFUNGAL', label: 'Antifúngico', riskBadge: undefined },
  { value: 'ANTIVIRAL', label: 'Antiviral', riskBadge: undefined },
  { value: 'ANTIHYPERTENSIVE', label: 'Anti-hipertensivo', riskBadge: undefined },
  { value: 'ANTIDIABETIC', label: 'Antidiabético', riskBadge: undefined },
  { value: 'BISPHOSPHONATE', label: 'Bisfosfonato / RANK-L', riskBadge: undefined },
  { value: 'GROWTH_FACTOR', label: 'Fator de crescimento (G-CSF)', riskBadge: undefined },
  { value: 'PROTON_PUMP_INHIBITOR', label: 'Inibidor de bomba (IBP)', riskBadge: undefined },
  { value: 'LAXATIVE', label: 'Laxante', riskBadge: undefined },
  { value: 'OTHER', label: 'Outro', riskBadge: undefined },
];

const RISK_CATEGORIES: MedicationCategory[] = [
  'ANTICOAGULANT',
  'ANTIPLATELET',
  'CORTICOSTEROID',
  'IMMUNOSUPPRESSANT',
  'NSAID',
  'OPIOID_ANALGESIC',
];

interface CurrentMedicationsFormProps {
  value?: CreateMedicationDto[];
  onChange: (medications: CreateMedicationDto[]) => void;
}

export function CurrentMedicationsForm({
  value = [],
  onChange,
}: CurrentMedicationsFormProps) {
  const medications = Array.isArray(value) ? value : [];

  const addMedication = () => {
    onChange([...medications, { name: '', category: 'OTHER' as MedicationCategory }]);
  };

  const update = (index: number, field: keyof CreateMedicationDto, val: string) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: val };
    onChange(updated);
  };

  const remove = (index: number) => {
    const updated = medications.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Medicamentos em uso</Label>
        <Button type="button" variant="outline" size="sm" onClick={addMedication}>
          <Plus className="h-4 w-4 mr-1" />
          Adicionar
        </Button>
      </div>

      {medications.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum medicamento adicionado. Clique em &quot;Adicionar&quot; para incluir.
        </p>
      ) : (
        <div className="space-y-3">
          {medications.map((med, index) => {
            const isRisky = RISK_CATEGORIES.includes(med.category as MedicationCategory);
            const categoryInfo = CATEGORY_OPTIONS.find((c) => c.value === med.category);

            return (
              <div
                key={index}
                className={`flex gap-2 items-start p-3 border rounded-lg ${
                  isRisky ? 'bg-amber-50 border-amber-200' : 'bg-gray-50'
                }`}
              >
                <div className="flex-1 space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Medicamento *</Label>
                      <Input
                        placeholder="Ex: Losartana, Metformina, Varfarina"
                        value={med.name}
                        onChange={(e) => update(index, 'name', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Categoria clínica *</Label>
                      <Select
                        value={med.category ?? 'OTHER'}
                        onValueChange={(v) => update(index, 'category', v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORY_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {isRisky && categoryInfo?.riskBadge && (
                    <div className="flex items-center gap-1 text-amber-700 text-xs">
                      <AlertTriangle className="h-3 w-3" />
                      <span>Risco clínico: {categoryInfo.riskBadge}</span>
                      <Badge variant="outline" className="text-xs ml-1 border-amber-400 text-amber-700">
                        Sinalizado para algoritmo de risco
                      </Badge>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">Dose</Label>
                      <Input
                        placeholder="Ex: 50 mg"
                        value={med.dosage ?? ''}
                        onChange={(e) => update(index, 'dosage', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Frequência</Label>
                      <Input
                        placeholder="Ex: 1x/dia, 12/12h"
                        value={med.frequency ?? ''}
                        onChange={(e) => update(index, 'frequency', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Indicação</Label>
                      <Input
                        placeholder="Ex: HAS, DM2, Dor"
                        value={med.indication ?? ''}
                        onChange={(e) => update(index, 'indication', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                  className="mt-6"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
