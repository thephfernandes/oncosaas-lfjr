'use client';

import { DashboardMetrics, DashboardStatistics } from '@/lib/api/dashboard';
import {
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { CustomTooltip } from '@/components/dashboard/shared/custom-tooltip';
import { ChartDrillDownModal } from '@/components/dashboard/shared/chart-drill-down-modal';
import {
  ChartFilters,
  PeriodFilter,
} from '@/components/dashboard/shared/chart-filters';
import { useState } from 'react';

interface MetricsChartsProps {
  metrics: DashboardMetrics;
  statistics: DashboardStatistics;
  isLoading?: boolean;
  onPriorityFilter?: (category: string | null) => void;
  onPeriodChange?: (period: PeriodFilter) => void;
  currentPeriod?: PeriodFilter;
}

// Paleta de cores profissional médica
const COLORS = {
  critical: '#dc2626', // red-600
  high: '#ea580c', // orange-600
  medium: '#f59e0b', // amber-500
  low: '#10b981', // emerald-500
};

export function MetricsCharts({
  metrics,
  statistics,
  isLoading,
  onPriorityFilter,
  onPeriodChange,
  currentPeriod = '30d',
}: MetricsChartsProps) {
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [drillDownFilter, setDrillDownFilter] = useState<{
    type: 'priority' | null;
    value: string | null;
    title: string;
    description?: string;
  }>({
    type: null,
    value: null,
    title: '',
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg border p-6 h-80 animate-pulse"
          >
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-full bg-gray-100 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  // Dados para gráfico de donut de prioridade
  const priorityData = [
    {
      name: 'Crítico',
      value: metrics.priorityDistribution.critical,
      color: COLORS.critical,
    },
    {
      name: 'Alto',
      value: metrics.priorityDistribution.high,
      color: COLORS.high,
    },
    {
      name: 'Médio',
      value: metrics.priorityDistribution.medium,
      color: COLORS.medium,
    },
    {
      name: 'Baixo',
      value: metrics.priorityDistribution.low,
      color: COLORS.low,
    },
  ].filter((item) => item.value > 0);

  const totalPatients = priorityData.reduce((sum, item) => sum + item.value, 0);

  // Dados para gráfico de linha de alertas por severidade
  const alertStatisticsData = statistics.alertStatistics.map((item) => ({
    date: new Date(item.date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    }),
    Crítico: item.critical,
    Alto: item.high,
    Médio: item.medium,
    Baixo: item.low,
  }));

  const handlePieClick = (data: { name: string; value: number }) => {
    const categoryMap: Record<string, string> = {
      Crítico: 'CRITICAL',
      Alto: 'HIGH',
      Médio: 'MEDIUM',
      Baixo: 'LOW',
    };
    const priorityValue = categoryMap[data.name] || null;

    setDrillDownFilter({
      type: 'priority',
      value: priorityValue,
      title: `Pacientes com Prioridade: ${data.name}`,
      description: `${data.value} paciente${data.value !== 1 ? 's' : ''} encontrado${data.value !== 1 ? 's' : ''}`,
    });
    setDrillDownOpen(true);

    if (onPriorityFilter) {
      onPriorityFilter(priorityValue);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 chart-fade-in">
      {/* Gráfico de Donut - Distribuição por Prioridade */}
      <div className="bg-white rounded-lg border shadow-sm p-6 chart-slide-up">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Distribuição por Prioridade
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <defs>
              <linearGradient id="gradientCritical" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#dc2626" stopOpacity={1} />
                <stop offset="100%" stopColor="#991b1b" stopOpacity={0.8} />
              </linearGradient>
              <linearGradient id="gradientHigh" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ea580c" stopOpacity={1} />
                <stop offset="100%" stopColor="#c2410c" stopOpacity={0.8} />
              </linearGradient>
              <linearGradient id="gradientMedium" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
                <stop offset="100%" stopColor="#d97706" stopOpacity={0.8} />
              </linearGradient>
              <linearGradient id="gradientLow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
              </linearGradient>
            </defs>
            <Pie
              data={priorityData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              innerRadius={60}
              fill="#8884d8"
              dataKey="value"
              onClick={handlePieClick}
              style={{ cursor: 'pointer' }}
              animationBegin={0}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {priorityData.map((entry, index) => {
                const gradientId =
                  entry.name === 'Crítico'
                    ? 'gradientCritical'
                    : entry.name === 'Alto'
                      ? 'gradientHigh'
                      : entry.name === 'Médio'
                        ? 'gradientMedium'
                        : 'gradientLow';
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={`url(#${gradientId})`}
                    className="chart-hover"
                    style={{
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                      transition: 'all 0.2s ease-in-out',
                    }}
                  />
                );
              })}
            </Pie>
            <Tooltip
              content={
                <CustomTooltip showPercent={true} total={totalPatients} />
              }
            />
            {/* Label central com total */}
            <text
              x="50%"
              y="45%"
              textAnchor="middle"
              fill="#1f2937"
              fontSize={24}
              fontWeight="bold"
            >
              {totalPatients}
            </text>
            <text
              x="50%"
              y="55%"
              textAnchor="middle"
              fill="#6b7280"
              fontSize={12}
            >
              pacientes
            </text>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico de Tendência de Pacientes */}
      <div className="bg-white rounded-lg border shadow-sm p-6 chart-slide-up">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Tendência de Pacientes
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={statistics.patientStatistics.map((item) => ({
              date: new Date(item.date).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
              }),
              Ativos: item.active,
              Críticos: item.critical,
              Novos: item.new,
            }))}
          >
            <defs>
              <linearGradient id="gradientActive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="gradientCriticalTrend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#dc2626" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#dc2626" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="gradientNew" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="4 4"
              stroke="rgba(148, 163, 184, 0.2)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <Tooltip content={<CustomTooltip unit="pacientes" />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
              formatter={(value) => (
                <span style={{ fontSize: '12px', color: '#475569' }}>
                  {value}
                </span>
              )}
            />
            <Area
              type="monotone"
              dataKey="Ativos"
              stackId="1"
              stroke="#0ea5e9"
              fill="url(#gradientActive)"
              strokeWidth={2}
              animationBegin={0}
              animationDuration={800}
            />
            <Area
              type="monotone"
              dataKey="Críticos"
              stackId="1"
              stroke="#dc2626"
              fill="url(#gradientCriticalTrend)"
              strokeWidth={2}
              animationBegin={100}
              animationDuration={800}
            />
            <Area
              type="monotone"
              dataKey="Novos"
              stackId="1"
              stroke="#10b981"
              fill="url(#gradientNew)"
              strokeWidth={2}
              animationBegin={200}
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico de Área - Alertas por Severidade */}
      <div className="bg-white rounded-lg border shadow-sm p-6 chart-slide-up lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Alertas por Severidade
          </h3>
          {onPeriodChange && (
            <ChartFilters
              period={currentPeriod}
              onPeriodChange={onPeriodChange}
              showPeriodFilter={true}
              showCancerTypeFilter={false}
            />
          )}
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={alertStatisticsData}>
            <defs>
              <linearGradient
                id="gradientCriticalArea"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor={COLORS.critical}
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor={COLORS.critical}
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="gradientHighArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.high} stopOpacity={0.8} />
                <stop offset="95%" stopColor={COLORS.high} stopOpacity={0.1} />
              </linearGradient>
              <linearGradient
                id="gradientMediumArea"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor={COLORS.medium} stopOpacity={0.8} />
                <stop
                  offset="95%"
                  stopColor={COLORS.medium}
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="gradientLowArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.low} stopOpacity={0.8} />
                <stop offset="95%" stopColor={COLORS.low} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="4 4"
              stroke="rgba(148, 163, 184, 0.2)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <Tooltip content={<CustomTooltip unit="alertas" />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
              formatter={(value) => (
                <span style={{ fontSize: '12px', color: '#475569' }}>
                  {value}
                </span>
              )}
            />
            <Area
              type="monotone"
              dataKey="Crítico"
              stackId="1"
              stroke={COLORS.critical}
              fill="url(#gradientCriticalArea)"
              strokeWidth={2}
              animationBegin={0}
              animationDuration={800}
            />
            <Area
              type="monotone"
              dataKey="Alto"
              stackId="1"
              stroke={COLORS.high}
              fill="url(#gradientHighArea)"
              strokeWidth={2}
              animationBegin={100}
              animationDuration={800}
            />
            <Area
              type="monotone"
              dataKey="Médio"
              stackId="1"
              stroke={COLORS.medium}
              fill="url(#gradientMediumArea)"
              strokeWidth={2}
              animationBegin={200}
              animationDuration={800}
            />
            <Area
              type="monotone"
              dataKey="Baixo"
              stackId="1"
              stroke={COLORS.low}
              fill="url(#gradientLowArea)"
              strokeWidth={2}
              animationBegin={300}
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Modal de Drill-Down */}
      <ChartDrillDownModal
        open={drillDownOpen}
        onOpenChange={setDrillDownOpen}
        filterType={drillDownFilter.type}
        filterValue={drillDownFilter.value}
        title={drillDownFilter.title}
        description={drillDownFilter.description}
      />
    </div>
  );
}
