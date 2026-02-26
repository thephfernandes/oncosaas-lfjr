'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createTreatmentSchema,
  CreateTreatmentFormData,
} from '@/lib/validations/treatment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Treatment } from '@/lib/api/treatments';

const TREATMENT_TYPE_LABELS: Record<string, string> = {
  CHEMOTHERAPY: 'Quimioterapia',
  RADIOTHERAPY: 'Radioterapia',
  SURGERY: 'Cirurgia',
  COMBINED: 'Combinado',
  IMMUNOTHERAPY: 'Imunoterapia',
  TARGETED_THERAPY: 'Terapia-alvo',
  HORMONE_THERAPY: 'Hormonoterapia',
};

const TREATMENT_INTENT_LABELS: Record<string, string> = {
  CURATIVE: 'Curativo',
  PALLIATIVE: 'Paliativo',
  ADJUVANT: 'Adjuvante',
  NEOADJUVANT: 'Neoadjuvante',
  UNKNOWN: 'Desconhecido',
};

const TREATMENT_STATUS_LABELS: Record<string, string> = {
  PLANNED: 'Planejado',
  ONGOING: 'Em Andamento',
  COMPLETED: 'Completo',
  SUSPENDED: 'Suspenso',
  CANCELLED: 'Cancelado',
};

const TREATMENT_RESPONSE_LABELS: Record<string, string> = {
  COMPLETE_RESPONSE: 'Resposta Completa',
  PARTIAL_RESPONSE: 'Resposta Parcial',
  STABLE_DISEASE: 'Doença Estável',
  PROGRESSIVE_DISEASE: 'Doença Progressiva',
  NOT_EVALUATED: 'Não Avaliado',
};

interface TreatmentFormProps {
  diagnosisId: string;
  treatment?: Treatment;
  onSubmit: (data: CreateTreatmentFormData) => Promise<void>;
  onCancel?: () => void;
}

export function TreatmentForm({
  diagnosisId,
  treatment,
  onSubmit,
  onCancel,
}: TreatmentFormProps) {
  const form = useForm<CreateTreatmentFormData>({
    resolver: zodResolver(createTreatmentSchema),
    defaultValues: treatment
      ? {
          diagnosisId: treatment.diagnosisId,
          treatmentType: treatment.treatmentType as any,
          treatmentName: treatment.treatmentName || undefined,
          protocol: treatment.protocol || undefined,
          line: treatment.line || undefined,
          intent: (treatment.intent as any) || undefined,
          startDate: treatment.startDate
            ? typeof treatment.startDate === 'string' &&
              treatment.startDate.includes('T')
              ? treatment.startDate
              : new Date(treatment.startDate).toISOString()
            : undefined,
          plannedEndDate: treatment.plannedEndDate
            ? typeof treatment.plannedEndDate === 'string' &&
              treatment.plannedEndDate.includes('T')
              ? treatment.plannedEndDate
              : new Date(treatment.plannedEndDate).toISOString()
            : undefined,
          actualEndDate: treatment.actualEndDate
            ? typeof treatment.actualEndDate === 'string' &&
              treatment.actualEndDate.includes('T')
              ? treatment.actualEndDate
              : new Date(treatment.actualEndDate).toISOString()
            : undefined,
          cyclesPlanned: treatment.cyclesPlanned || undefined,
          cyclesCompleted: treatment.cyclesCompleted || undefined,
          status: (treatment.status as any) || undefined,
          response: (treatment.response as any) || undefined,
          responseDate: treatment.responseDate
            ? typeof treatment.responseDate === 'string' &&
              treatment.responseDate.includes('T')
              ? treatment.responseDate
              : new Date(treatment.responseDate).toISOString()
            : undefined,
          toxicities: treatment.toxicities || undefined,
          doseModifications: treatment.doseModifications || undefined,
          notes: treatment.notes || undefined,
        }
      : {
          diagnosisId,
        },
  });

  const handleSubmit = async (data: CreateTreatmentFormData) => {
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tipo de Tratamento */}
          <FormField
            control={form.control}
            name="treatmentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Tratamento *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(TREATMENT_TYPE_LABELS).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Nome do Tratamento */}
          <FormField
            control={form.control}
            name="treatmentName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Tratamento</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ex: FOLFOX, AC-T, etc." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Protocolo */}
          <FormField
            control={form.control}
            name="protocol"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Protocolo</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Protocolo utilizado" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Linha de Tratamento */}
          <FormField
            control={form.control}
            name="line"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Linha de Tratamento</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    {...field}
                    value={field.value || ''}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value
                          ? parseInt(e.target.value, 10)
                          : undefined
                      )
                    }
                    placeholder="Ex: 1 (primeira linha)"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Intenção */}
          <FormField
            control={form.control}
            name="intent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Intenção</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a intenção" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(TREATMENT_INTENT_LABELS).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Status */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(TREATMENT_STATUS_LABELS).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Data de Início */}
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data de Início</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(new Date(field.value), 'dd/MM/yyyy', {
                            locale: ptBR,
                          })
                        ) : (
                          <span>Selecione a data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) =>
                        field.onChange(date ? date.toISOString() : undefined)
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Data Prevista de Término */}
          <FormField
            control={form.control}
            name="plannedEndDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data Prevista de Término</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(new Date(field.value), 'dd/MM/yyyy', {
                            locale: ptBR,
                          })
                        ) : (
                          <span>Selecione a data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) =>
                        field.onChange(date ? date.toISOString() : undefined)
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Data Real de Término */}
          <FormField
            control={form.control}
            name="actualEndDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data Real de Término</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(new Date(field.value), 'dd/MM/yyyy', {
                            locale: ptBR,
                          })
                        ) : (
                          <span>Selecione a data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) =>
                        field.onChange(date ? date.toISOString() : undefined)
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Ciclos Planejados */}
          <FormField
            control={form.control}
            name="cyclesPlanned"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ciclos Planejados</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    {...field}
                    value={field.value || ''}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value
                          ? parseInt(e.target.value, 10)
                          : undefined
                      )
                    }
                    placeholder="Ex: 6"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Ciclos Completados */}
          <FormField
            control={form.control}
            name="cyclesCompleted"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ciclos Completados</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    {...field}
                    value={field.value || ''}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value
                          ? parseInt(e.target.value, 10)
                          : undefined
                      )
                    }
                    placeholder="Ex: 3"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Resposta */}
          <FormField
            control={form.control}
            name="response"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Resposta ao Tratamento</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a resposta" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(TREATMENT_RESPONSE_LABELS).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Data de Resposta */}
          <FormField
            control={form.control}
            name="responseDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data de Resposta</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(new Date(field.value), 'dd/MM/yyyy', {
                            locale: ptBR,
                          })
                        ) : (
                          <span>Selecione a data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) =>
                        field.onChange(date ? date.toISOString() : undefined)
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Notas */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Observações sobre o tratamento..."
                  rows={4}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Botões */}
        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? 'Salvando...'
              : treatment
                ? 'Atualizar'
                : 'Criar'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
