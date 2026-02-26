'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  Info,
} from 'lucide-react';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number | string;
    dataKey?: string;
    color?: string;
    payload?: any;
  }>;
  label?: string;
  formatter?: (value: any, name: string) => [string, string];
  showPercent?: boolean;
  showTotal?: boolean;
  total?: number;
  unit?: string;
  showComparison?: boolean;
  comparisonValue?: number;
  comparisonLabel?: string;
}

const STATUS_ICONS: Record<string, typeof CheckCircle2> = {
  ideal: CheckCircle2,
  acceptable: Clock,
  critical: AlertTriangle,
  info: Info,
};

export function CustomTooltip({
  active,
  payload,
  label,
  formatter,
  showPercent = false,
  showTotal = false,
  total,
  unit = '',
  showComparison = false,
  comparisonValue,
  comparisonLabel,
}: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const formatValue = (value: number | string | undefined): string => {
    if (value === undefined || value === null) return 'N/A';
    if (typeof value === 'string') return value;

    // Formatação de números em português
    const numValue = Number(value);
    if (isNaN(numValue)) return String(value);

    // Se for um número grande, usar separador de milhar
    if (numValue >= 1000) {
      return numValue.toLocaleString('pt-BR');
    }

    // Se for decimal, mostrar 1-2 casas decimais
    if (numValue % 1 !== 0) {
      return numValue.toFixed(1).replace('.', ',');
    }

    return numValue.toString();
  };

  const formatPercent = (value: number, total: number): string => {
    if (total === 0) return '0%';
    const percent = (value / total) * 100;
    return `${percent.toFixed(1).replace('.', ',')}%`;
  };

  return (
    <div className="custom-tooltip min-w-[200px]">
      {label && (
        <div className="mb-2 pb-2 border-b border-gray-700">
          <p className="text-white font-semibold text-sm">{label}</p>
        </div>
      )}

      <div className="space-y-2">
        {payload.map((entry, index) => {
          const value = entry.value;
          const name = entry.name || entry.dataKey || 'Valor';
          const color = entry.color || '#0ea5e9';

          // Calcular percentual se necessário
          const percent =
            showPercent && total
              ? formatPercent(Number(value) || 0, total)
              : null;

          // Formatação customizada se fornecida
          const [formattedValue, formattedName] = formatter
            ? formatter(value, name)
            : [formatValue(value), name];

          return (
            <div
              key={index}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-gray-300 text-sm">{formattedName}</span>
              </div>
              <div className="text-right">
                <span className="text-white font-semibold text-sm">
                  {formattedValue}
                  {unit && ` ${unit}`}
                </span>
                {percent && (
                  <span className="text-gray-400 text-xs ml-1">
                    ({percent})
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showTotal && total !== undefined && (
        <div className="mt-3 pt-2 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-xs">Total</span>
            <span className="text-white font-semibold text-sm">
              {formatValue(total)}
              {unit && ` ${unit}`}
            </span>
          </div>
        </div>
      )}

      {showComparison && comparisonValue !== undefined && (
        <div className="mt-3 pt-2 border-t border-gray-700">
          <div className="flex items-center justify-between gap-2">
            <span className="text-gray-400 text-xs">
              {comparisonLabel || 'Comparação'}
            </span>
            <div className="flex items-center gap-1">
              {comparisonValue > 0 ? (
                <TrendingUp className="w-3 h-3 text-green-400" />
              ) : comparisonValue < 0 ? (
                <TrendingDown className="w-3 h-3 text-red-400" />
              ) : (
                <Info className="w-3 h-3 text-gray-400" />
              )}
              <span
                className={cn(
                  'text-xs font-semibold',
                  comparisonValue > 0 && 'text-green-400',
                  comparisonValue < 0 && 'text-red-400',
                  comparisonValue === 0 && 'text-gray-400'
                )}
              >
                {comparisonValue > 0 ? '+' : ''}
                {formatValue(comparisonValue)}
                {unit && ` ${unit}`}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface BenchmarkTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
    dataKey?: string;
    color?: string;
  }>;
  label?: string;
  idealValue?: number;
  acceptableValue?: number;
  criticalValue?: number;
  currentValue?: number;
}

export function BenchmarkTooltip({
  active,
  payload,
  label,
  idealValue,
  acceptableValue,
  criticalValue,
  currentValue,
}: BenchmarkTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const getStatus = (
    value: number | undefined
  ): 'ideal' | 'acceptable' | 'critical' | 'info' => {
    if (value === undefined || idealValue === undefined) return 'info';
    if (value <= idealValue) return 'ideal';
    if (acceptableValue !== undefined && value <= acceptableValue)
      return 'acceptable';
    if (criticalValue !== undefined && value <= criticalValue)
      return 'critical';
    return 'critical';
  };

  const status = getStatus(currentValue);
  const StatusIcon = STATUS_ICONS[status] || Info;

  const statusColors = {
    ideal: 'text-green-400',
    acceptable: 'text-yellow-400',
    critical: 'text-red-400',
    info: 'text-gray-400',
  };

  const statusLabels = {
    ideal: 'Ideal',
    acceptable: 'Aceitável',
    critical: 'Crítico',
    info: 'Sem dados',
  };

  return (
    <div className="custom-tooltip min-w-[240px]">
      {label && (
        <div className="mb-2 pb-2 border-b border-gray-700">
          <p className="text-white font-semibold text-sm">{label}</p>
        </div>
      )}

      {currentValue !== undefined && (
        <div className="mb-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusIcon className={cn('w-4 h-4', statusColors[status])} />
              <span className="text-gray-300 text-sm">Valor Atual</span>
            </div>
            <span
              className={cn(
                'text-white font-semibold text-sm',
                statusColors[status]
              )}
            >
              {currentValue.toLocaleString('pt-BR')} dias
            </span>
          </div>
          <Badge
            variant="outline"
            className={cn(
              'text-xs',
              status === 'ideal' && 'border-green-400 text-green-400',
              status === 'acceptable' && 'border-yellow-400 text-yellow-400',
              status === 'critical' && 'border-red-400 text-red-400',
              status === 'info' && 'border-gray-400 text-gray-400'
            )}
          >
            {statusLabels[status]}
          </Badge>
        </div>
      )}

      <div className="space-y-1.5 pt-2 border-t border-gray-700">
        <p className="text-gray-400 text-xs mb-2">Benchmarks:</p>
        {idealValue !== undefined && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-gray-300 text-xs">Ideal</span>
            </div>
            <span className="text-white text-xs font-medium">
              ≤ {idealValue.toLocaleString('pt-BR')} dias
            </span>
          </div>
        )}
        {acceptableValue !== undefined && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-gray-300 text-xs">Aceitável</span>
            </div>
            <span className="text-white text-xs font-medium">
              ≤ {acceptableValue.toLocaleString('pt-BR')} dias
            </span>
          </div>
        )}
        {criticalValue !== undefined && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-gray-300 text-xs">Crítico</span>
            </div>
            <span className="text-white text-xs font-medium">
              &gt; {criticalValue.toLocaleString('pt-BR')} dias
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
