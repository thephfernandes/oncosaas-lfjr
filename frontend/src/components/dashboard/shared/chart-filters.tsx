'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PeriodFilter = '7d' | '30d' | '90d' | 'all';

interface ChartFiltersProps {
  period?: PeriodFilter;
  onPeriodChange?: (period: PeriodFilter) => void;
  cancerType?: string | null;
  onCancerTypeChange?: (cancerType: string | null) => void;
  availableCancerTypes?: string[];
  showPeriodFilter?: boolean;
  showCancerTypeFilter?: boolean;
  className?: string;
}

const PERIOD_LABELS: Record<PeriodFilter, string> = {
  '7d': '7 dias',
  '30d': '30 dias',
  '90d': '90 dias',
  all: 'Todos',
};

export function ChartFilters({
  period = '30d',
  onPeriodChange,
  cancerType,
  onCancerTypeChange,
  availableCancerTypes = [],
  showPeriodFilter = true,
  showCancerTypeFilter = false,
  className,
}: ChartFiltersProps) {
  const hasActiveFilters =
    (showPeriodFilter && period !== '30d') ||
    (showCancerTypeFilter && cancerType !== null);

  const handleClearFilters = () => {
    if (onPeriodChange) onPeriodChange('30d');
    if (onCancerTypeChange) onCancerTypeChange(null);
  };

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      {showPeriodFilter && (
        <div className="flex items-center gap-1">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-500 mr-1">Período:</span>
          <div className="flex gap-1">
            {(['7d', '30d', '90d', 'all'] as PeriodFilter[]).map((p) => (
              <Button
                key={p}
                variant={period === p ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPeriodChange?.(p)}
                className={cn(
                  'h-7 px-2 text-xs',
                  period === p &&
                    'bg-medical-blue-500 hover:bg-medical-blue-600 text-white border-medical-blue-500'
                )}
              >
                {PERIOD_LABELS[p]}
              </Button>
            ))}
          </div>
        </div>
      )}

      {showCancerTypeFilter && availableCancerTypes.length > 0 && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 mr-1">Tipo:</span>
          <div className="flex gap-1 flex-wrap">
            <Button
              variant={cancerType === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => onCancerTypeChange?.(null)}
              className={cn(
                'h-7 px-2 text-xs',
                cancerType === null &&
                  'bg-medical-blue-500 hover:bg-medical-blue-600 text-white border-medical-blue-500'
              )}
            >
              Todos
            </Button>
            {availableCancerTypes.slice(0, 5).map((type) => (
              <Button
                key={type}
                variant={cancerType === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => onCancerTypeChange?.(type)}
                className={cn(
                  'h-7 px-2 text-xs',
                  cancerType === type &&
                    'bg-medical-blue-500 hover:bg-medical-blue-600 text-white border-medical-blue-500'
                )}
              >
                {type}
              </Button>
            ))}
          </div>
        </div>
      )}

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          className="h-7 px-2 text-xs text-gray-500 hover:text-gray-700"
        >
          <X className="w-3 h-3 mr-1" />
          Limpar filtros
        </Button>
      )}

      {hasActiveFilters && (
        <Badge
          variant="secondary"
          className="ml-auto text-xs bg-medical-blue-100 text-medical-blue-700 border-medical-blue-300"
        >
          Filtros ativos
        </Badge>
      )}
    </div>
  );
}
