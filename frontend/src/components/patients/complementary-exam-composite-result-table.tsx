'use client';

import React from 'react';
import type { Control, FieldValues } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { CompositeComponent } from '@/lib/data/complementary-exams-catalog';

export type CompositeComponentsFieldPrefix =
  | 'components'
  | 'initialResult.components';

interface CompositeRowField {
  id: string;
  name?: string;
}

interface ComplementaryExamCompositeResultTableProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  fields: CompositeRowField[];
  compositeComponents: CompositeComponent[];
  namePrefix: CompositeComponentsFieldPrefix;
}

export function ComplementaryExamCompositeResultTable<TFieldValues extends FieldValues>({
  control,
  fields,
  compositeComponents,
  namePrefix,
}: ComplementaryExamCompositeResultTableProps<TFieldValues>): React.ReactElement {
  return (
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
            const paramLabel = fieldItem.name ?? comp?.name ?? `Parâmetro ${index + 1}`;
            return (
              <tr
                key={fieldItem.id}
                className="border-b last:border-0 hover:bg-muted/20"
              >
                <td className="px-3 py-2">
                  <div className="font-medium">
                    {fieldItem.name ?? comp?.name}
                  </div>
                  {comp?.referenceRange && (
                    <div className="text-xs text-muted-foreground">
                      Ref.: {comp.referenceRange}
                      {comp.unit ? ` ${comp.unit}` : ''}
                    </div>
                  )}
                </td>
                <td className="px-3 py-2">
                  <FormField
                    control={control}
                    name={`${namePrefix}.${index}.valueNumeric` as any}
                    render={({ field: f }) => (
                      <FormItem className="space-y-0">
                        <FormControl>
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              step="any"
                              placeholder="—"
                              className="h-8 w-28 text-sm"
                              aria-label={`Valor para ${paramLabel}`}
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
                    control={control}
                    name={`${namePrefix}.${index}.isAbnormal` as any}
                    render={({ field: f }) => (
                      <FormItem className="space-y-0 flex justify-center">
                        <FormControl>
                          <Checkbox
                            checked={f.value ?? false}
                            onCheckedChange={f.onChange}
                            aria-label={`Marcar ${paramLabel} como fora da referência`}
                            className={cn(
                              f.value &&
                                'border-amber-500 data-[state=checked]:bg-amber-500'
                            )}
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
  );
}
