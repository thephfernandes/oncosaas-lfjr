'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardApi, CriticalTimelines } from '@/lib/api/dashboard';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  ComposedChart,
} from 'recharts';
import { CustomTooltip } from '@/components/dashboard/shared/custom-tooltip';

const CANCER_TYPE_LABELS: Record<string, string> = {
  colorectal: 'Colorretal',
  breast: 'Mama',
  lung: 'Pulmão',
  prostate: 'Próstata',
};

const STATUS_COLORS: Record<string, string> = {
  IDEAL: 'bg-green-100 text-green-800 border-green-300',
  ACCEPTABLE: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  CRITICAL: 'bg-red-100 text-red-800 border-red-300',
  NO_DATA: 'bg-gray-100 text-gray-600 border-gray-300',
};

const STATUS_ICONS: Record<string, typeof CheckCircle2> = {
  IDEAL: CheckCircle2,
  ACCEPTABLE: Clock,
  CRITICAL: AlertTriangle,
  NO_DATA: Info,
};

export function CriticalTimelinesSection() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['critical-timelines'],
    queryFn: () => dashboardApi.getCriticalTimelines(),
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1, // Tentar apenas uma vez em caso de erro
    refetchOnWindowFocus: false, // Não recarregar ao focar na janela
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4 animate-pulse"></div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-20 bg-gray-100 rounded animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Erro ao carregar prazos críticos:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Erro desconhecido';
    const errorStatus =
      (error as any)?.statusCode || (error as any)?.status || 'N/A';

    return (
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">
          Prazos Críticos por Tipo de Câncer
        </h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 font-semibold">
            Erro ao carregar prazos críticos
          </p>
          <p className="text-sm text-gray-600 mt-2">
            <strong>Status:</strong> {errorStatus}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            <strong>Mensagem:</strong> {errorMessage}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Verifique o console do navegador (F12) para mais detalhes.
          </p>
        </div>
      </div>
    );
  }

  if (!data || data.metrics.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">
          Prazos Críticos por Tipo de Câncer
        </h3>
        <p className="text-gray-500">Nenhum dado disponível</p>
      </div>
    );
  }

  // Agrupar métricas por tipo de câncer
  const metricsByCancerType = data.metrics.reduce(
    (acc, metric) => {
      if (!acc[metric.cancerType]) {
        acc[metric.cancerType] = [];
      }
      acc[metric.cancerType].push(metric);
      return acc;
    },
    {} as Record<string, typeof data.metrics>
  );

  // Preparar dados para gráfico de barras comparativo
  const chartData = Object.entries(metricsByCancerType).flatMap(
    ([cancerType, metrics]) => {
      return metrics.map((metric) => ({
        cancerType: CANCER_TYPE_LABELS[cancerType] || cancerType,
        metricLabel: metric.metricLabel,
        currentDays: metric.currentAverageDays,
        idealDays: metric.benchmark.idealDays,
        acceptableDays: metric.benchmark.acceptableDays,
        criticalDays: metric.benchmark.criticalDays,
        status: metric.status,
        patientsCount: metric.patientsCount,
        patientsAtRisk: metric.patientsAtRisk,
        key: `${cancerType}-${metric.metric}`,
      }));
    }
  );

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6 space-y-6 chart-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            Prazos Críticos por Tipo de Câncer
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Comparação com benchmarks NCCN/ESMO e identificação de janelas
            terapêuticas
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded shadow-sm"></div>
            <span className="text-gray-700">Ideal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-500 rounded shadow-sm"></div>
            <span className="text-gray-700">Aceitável</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded shadow-sm"></div>
            <span className="text-gray-700">Crítico</span>
          </div>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 shadow-sm chart-scale-in">
          <div className="text-2xl font-bold text-emerald-700">
            {data.summary.metricsInIdealRange}
          </div>
          <div className="text-sm text-emerald-600 font-medium">No Ideal</div>
        </div>
        <div
          className="bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-sm chart-scale-in"
          style={{ animationDelay: '0.1s' }}
        >
          <div className="text-2xl font-bold text-amber-700">
            {data.summary.metricsInAcceptableRange}
          </div>
          <div className="text-sm text-amber-600 font-medium">Aceitável</div>
        </div>
        <div
          className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm chart-scale-in"
          style={{ animationDelay: '0.2s' }}
        >
          <div className="text-2xl font-bold text-red-700">
            {data.summary.metricsInCriticalRange}
          </div>
          <div className="text-sm text-red-600 font-medium">Crítico</div>
        </div>
        <div
          className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm chart-scale-in"
          style={{ animationDelay: '0.3s' }}
        >
          <div className="text-2xl font-bold text-gray-700">
            {data.summary.metricsWithNoData}
          </div>
          <div className="text-sm text-gray-600 font-medium">Sem Dados</div>
        </div>
      </div>

      {/* Gráfico Comparativo */}
      {chartData.length > 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-emerald-50 rounded-lg border border-blue-100 p-6 chart-slide-up">
          <h4 className="text-md font-semibold mb-4 text-gray-800">
            Visão Comparativa
          </h4>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <defs>
                <linearGradient
                  id="gradientCurrent"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity={0.7} />
                </linearGradient>
                <linearGradient id="gradientIdeal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="4 4"
                stroke="rgba(148, 163, 184, 0.2)"
                vertical={false}
              />
              <XAxis
                dataKey="metricLabel"
                angle={-45}
                textAnchor="end"
                height={100}
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                label={{
                  value: 'Dias',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fill: '#64748b' },
                }}
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <Tooltip
                content={
                  <CustomTooltip
                    formatter={(value: any) => [`${value} dias`, '']}
                    showComparison={true}
                  />
                }
              />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
                formatter={(value) => (
                  <span style={{ fontSize: '12px', color: '#475569' }}>
                    {value}
                  </span>
                )}
              />
              {/* Barra atual com cores baseadas no status */}
              <Bar
                dataKey="currentDays"
                name="Média Atual"
                fill="url(#gradientCurrent)"
                radius={[4, 4, 0, 0]}
                animationBegin={0}
                animationDuration={800}
                className="chart-hover"
              >
                {chartData.map((entry, index) => {
                  const color =
                    entry.status === 'IDEAL'
                      ? '#10b981'
                      : entry.status === 'ACCEPTABLE'
                        ? '#f59e0b'
                        : entry.status === 'CRITICAL'
                          ? '#dc2626'
                          : '#6b7280';
                  return <Cell key={`cell-${index}`} fill={color} />;
                })}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Métricas por tipo de câncer */}
      <div className="space-y-6">
        {Object.entries(metricsByCancerType).map(
          ([cancerType, metrics], index) => (
            <div
              key={cancerType}
              className="border rounded-lg p-4 shadow-sm bg-white chart-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <h4 className="text-md font-semibold mb-4 text-gray-800">
                {CANCER_TYPE_LABELS[cancerType] || cancerType}
              </h4>
              <div className="space-y-3">
                {metrics.map((metric) => {
                  const StatusIcon = STATUS_ICONS[metric.status];
                  const percentage = metric.currentAverageDays
                    ? Math.min(
                        (metric.currentAverageDays /
                          metric.benchmark.criticalDays) *
                          100,
                        100
                      )
                    : 0;

                  return (
                    <div
                      key={`${cancerType}-${metric.metric}`}
                      className={cn(
                        'border rounded-lg p-4 shadow-sm transition-all duration-200 hover:shadow-md',
                        STATUS_COLORS[metric.status]
                      )}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <StatusIcon className="w-5 h-5" />
                          <span className="font-medium">
                            {metric.metricLabel}
                          </span>
                        </div>
                        {metric.currentAverageDays !== null && (
                          <div className="text-right">
                            <div className="text-lg font-bold">
                              {metric.currentAverageDays} dias
                            </div>
                            <div className="text-xs opacity-75">
                              {metric.patientsCount} pacientes
                              {metric.patientsAtRisk > 0 && (
                                <span className="text-red-600 ml-1">
                                  ({metric.patientsAtRisk} em risco)
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Barra de progresso comparativa */}
                      {metric.currentAverageDays !== null && (
                        <div className="mt-3 space-y-1">
                          <div className="flex justify-between text-xs mb-1">
                            <span>
                              Benchmark Ideal: {metric.benchmark.idealDays} dias
                            </span>
                            <span>
                              Crítico: {metric.benchmark.criticalDays} dias
                            </span>
                          </div>
                          <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                            {/* Zona ideal */}
                            <div
                              className="absolute h-full bg-green-500"
                              style={{
                                left: 0,
                                width: `${(metric.benchmark.idealDays / metric.benchmark.criticalDays) * 100}%`,
                              }}
                            />
                            {/* Zona aceitável */}
                            <div
                              className="absolute h-full bg-yellow-500"
                              style={{
                                left: `${(metric.benchmark.idealDays / metric.benchmark.criticalDays) * 100}%`,
                                width: `${((metric.benchmark.acceptableDays - metric.benchmark.idealDays) / metric.benchmark.criticalDays) * 100}%`,
                              }}
                            />
                            {/* Zona crítica */}
                            <div
                              className="absolute h-full bg-red-500"
                              style={{
                                left: `${(metric.benchmark.acceptableDays / metric.benchmark.criticalDays) * 100}%`,
                                width: `${((metric.benchmark.criticalDays - metric.benchmark.acceptableDays) / metric.benchmark.criticalDays) * 100}%`,
                              }}
                            />
                            {/* Indicador da média atual */}
                            <div
                              className="absolute top-0 w-1 h-full bg-black"
                              style={{
                                left: `${Math.min(percentage, 100)}%`,
                              }}
                            />
                          </div>
                          <div className="flex justify-between text-xs mt-1">
                            <span
                              className={cn(
                                metric.currentAverageDays <=
                                  metric.benchmark.idealDays &&
                                  'text-green-700 font-semibold',
                                metric.currentAverageDays >
                                  metric.benchmark.idealDays &&
                                  metric.currentAverageDays <=
                                    metric.benchmark.acceptableDays &&
                                  'text-yellow-700 font-semibold',
                                metric.currentAverageDays >
                                  metric.benchmark.acceptableDays &&
                                  'text-red-700 font-semibold'
                              )}
                            >
                              Média atual: {metric.currentAverageDays} dias
                            </span>
                            {metric.currentAverageDays >
                              metric.benchmark.acceptableDays && (
                              <span className="text-red-600 font-semibold">
                                {metric.currentAverageDays -
                                  metric.benchmark.acceptableDays}{' '}
                                dias acima do aceitável
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {metric.currentAverageDays === null && (
                        <div className="text-sm opacity-75 mt-2">
                          Sem dados suficientes para calcular esta métrica
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
