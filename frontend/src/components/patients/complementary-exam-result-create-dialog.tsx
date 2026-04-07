'use client';

import React, { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  createComplementaryExamResultSchema,
  type CreateComplementaryExamResultFormData,
} from '@/lib/validations/complementary-exam';
import { patientsApi } from '@/lib/api/patients';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ComplementaryExam } from '@/lib/api/patients';
import {
  COMPLEMENTARY_EXAMS_CATALOG,
  EXAM_TYPE_FIELD_CONFIG,
} from '@/lib/data/complementary-exams-catalog';
import { cn } from '@/lib/utils';

interface ComplementaryExamResultCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  exam: ComplementaryExam;
  onSuccess?: () => void;
}

function findCatalogEntry(exam: ComplementaryExam) {
  return COMPLEMENTARY_EXAMS_CATALOG.find(
    (e) =>
      (exam.code && e.code && e.code.toLowerCase() === exam.code.toLowerCase()) ||
      e.name.toLowerCase() === exam.name.toLowerCase()
  ) ?? null;
}

export function ComplementaryExamResultCreateDialog({
  open,
  onOpenChange,
  patientId,
  exam,
  onSuccess,
}: ComplementaryExamResultCreateDialogProps): React.ReactElement {
  const queryClient = useQueryClient();

  const catalogEntry = findCatalogEntry(exam);
  const isComposite = catalogEntry?.isComposite === true;
  const compositeComponents = catalogEntry?.components ?? [];
  const fieldConfig = EXAM_TYPE_FIELD_CONFIG[exam.type];

  function buildDefaultValues(): CreateComplementaryExamResultFormData {
    return {
      performedAt: new Date().toISOString().slice(0, 10),
      valueNumeric: undefined,
      valueText: '',
      unit: exam.unit ?? '',
      referenceRange: exam.referenceRange ?? '',
      isAbnormal: false,
      report: '',
      components: isComposite
        ? compositeComponents.map((c) => ({
            name: c.name,
            unit: c.unit,
            referenceRange: c.referenceRange,
            valueNumeric: undefined,
            valueText: '',
            isAbnormal: false,
          }))
        : [],
    };
  }

  const form = useForm<CreateComplementaryExamResultFormData>({
    resolver: zodResolver(createComplementaryExamResultSchema),
    defaultValues: buildDefaultValues(),
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: 'components',
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateComplementaryExamResultFormData) => {
      const payload: Parameters<typeof patientsApi.createComplementaryExamResult>[2] = {
        performedAt: new Date(data.performedAt).toISOString(),
        isAbnormal: data.isAbnormal,
        report: data.report || undefined,
      };

      if (isComposite && data.components && data.components.length > 0) {
        payload.components = data.components.map((c) => ({
          name: c.name,
          unit: c.unit,
          referenceRange: c.referenceRange,
          valueNumeric: c.valueNumeric,
          valueText: c.valueText || undefined,
          isAbnormal: c.isAbnormal,
        }));
      } else {
        payload.valueNumeric = data.valueNumeric;
        payload.valueText = data.valueText || undefined;
        payload.unit = data.unit || undefined;
        payload.referenceRange = data.referenceRange || undefined;
      }

      return patientsApi.createComplementaryExamResult(patientId, exam.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient', patientId] });
      toast.success('Resultado adicionado.');
      form.reset(buildDefaultValues());
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erro ao adicionar resultado.');
    },
  });

  useEffect(() => {
    if (open) {
      form.reset(buildDefaultValues());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, exam.id, exam.unit, exam.referenceRange]);

  const onSubmit = (data: CreateComplementaryExamResultFormData) => {
    createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogClose onClose={() => onOpenChange(false)} />
        <DialogHeader>
          <DialogTitle>
            Adicionar resultado — {exam.name}
          </DialogTitle>
          {exam.specimen && (
            <div className="mt-1">
              <Badge variant="outline" className="text-xs">
                {exam.specimen}
              </Badge>
            </div>
          )}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Data da realização */}
            <FormField
              control={form.control}
              name="performedAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data da realização</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Exame composto: tabela de componentes */}
            {isComposite && fields.length > 0 ? (
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="text-left px-3 py-2 font-medium">Parâmetro</th>
                      <th className="text-left px-3 py-2 font-medium">Valor</th>
                      <th className="px-3 py-2 font-medium text-center">Alt.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((fieldItem, index) => {
                      const comp = compositeComponents[index];
                      return (
                        <tr
                          key={fieldItem.id}
                          className="border-b last:border-0 hover:bg-muted/20"
                        >
                          <td className="px-3 py-2">
                            <div className="font-medium">{fieldItem.name}</div>
                            {comp?.referenceRange && (
                              <div className="text-xs text-muted-foreground">
                                Ref.: {comp.referenceRange}
                                {comp.unit ? ` ${comp.unit}` : ''}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <FormField
                              control={form.control}
                              name={`components.${index}.valueNumeric`}
                              render={({ field: f }) => (
                                <FormItem className="space-y-0">
                                  <FormControl>
                                    <div className="flex items-center gap-1">
                                      <Input
                                        type="number"
                                        step="any"
                                        placeholder="—"
                                        className="h-8 w-28 text-sm"
                                        value={f.value ?? ''}
                                        onChange={(e) => {
                                          const v = e.target.value;
                                          f.onChange(v === '' ? undefined : Number(v));
                                        }}
                                      />
                                      {comp?.unit && (
                                        <span className="text-xs text-muted-foreground shrink-0">
                                          {comp.unit}
                                        </span>
                                      )}
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <FormField
                              control={form.control}
                              name={`components.${index}.isAbnormal`}
                              render={({ field: f }) => (
                                <FormItem className="space-y-0 flex justify-center">
                                  <FormControl>
                                    <Checkbox
                                      checked={f.value ?? false}
                                      onCheckedChange={f.onChange}
                                      aria-label="Fora da referência"
                                      className={cn(f.value && 'border-amber-500 data-[state=checked]:bg-amber-500')}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Exame simples */
              <>
                {fieldConfig.showNumeric && (
                  <FormField
                    control={form.control}
                    name="valueNumeric"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor numérico (opcional)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            placeholder="Ex: 12.5"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) => {
                              const v = e.target.value;
                              field.onChange(v === '' ? undefined : Number(v));
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {fieldConfig.showText && (
                  <FormField
                    control={form.control}
                    name="valueText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{fieldConfig.textLabel} (opcional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={fieldConfig.textPlaceholder}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {!fieldConfig.showNumeric && !fieldConfig.showText && (
                  <FormField
                    control={form.control}
                    name="valueText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor texto (opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Positivo, Negativo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidade (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: g/dL" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="referenceRange"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Faixa de referência (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 4.5-5.5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isAbnormal"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Fora da referência</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Laudo / observações (sempre disponível) */}
            <FormField
              control={form.control}
              name="report"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {fieldConfig.reportIsPrimary
                      ? 'Laudo / conclusão diagnóstica'
                      : 'Laudo / observações (opcional)'}
                  </FormLabel>
                  <FormControl>
                    <textarea
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Texto livre do laudo"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Salvando...' : 'Adicionar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
