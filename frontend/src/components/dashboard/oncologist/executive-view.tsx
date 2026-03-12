'use client';

import { DashboardMetrics, DashboardStatistics } from '@/lib/api/dashboard';
import {
  TrendingUp,
  Clock,
  Users,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { useMemo } from 'react';

interface ExecutiveViewProps {
  metrics: DashboardMetrics;
  statistics: DashboardStatistics;
}

const JOURNEY_STAGE_LABELS: Record<string, string> = {
  SCREENING: 'Rastreio',
  DIAGNOSIS: 'Diagnóstico',
  TREATMENT: 'Tratamento',
  FOLLOW_UP: 'Seguimento',
};

export function ExecutiveView({ metrics, statistics }: ExecutiveViewProps) {
  // Calcular métricas executivas
  const executiveMetrics = useMemo(() => {
    // Taxa de conversão por fase (distribuição atual)
    const totalPatients = metrics.totalActivePatients;
    const conversionRates = metrics.journeyStageDistribution.map((stage) => ({
      stage: JOURNEY_STAGE_LABELS[stage.stage] || stage.stage,
      stageKey: stage.stage,
      count: stage.count,
      percentage: stage.percentage,
    }));

    // Identificar bottlenecks (fases com maior concentração de pacientes)
    const bottlenecks = conversionRates
      .filter((s) => s.percentage > 20) // Mais de 20% dos pacientes em uma fase
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 2);

    // Tempo médio estimado por fase (baseado em dados históricos)
    // TODO: Calcular tempo real quando tivermos dados de transição entre fases
    const estimatedTimePerStage: Record<string, number> = {
      SCREENING: 30, // dias
      DIAGNOSIS: 45,
      TREATMENT: 180,
      FOLLOW_UP: 90,
    };

    const averageJourneyTime = conversionRates.reduce((sum, stage) => {
      const days = estimatedTimePerStage[stage.stageKey] || 0;
      return sum + (days * stage.percentage) / 100;
    }, 0);

    // Taxa de resolução de alertas (últimos 7 dias)
    const last7Days = statistics.alertStatistics.slice(-7);
    const totalAlerts7d = last7Days.reduce((sum, day) => sum + day.total, 0);
    const resolvedAlerts7d = metrics.resolvedTodayCount * 7; // Estimativa
    const resolutionRate =
      totalAlerts7d > 0
        ? Math.round((resolvedAlerts7d / totalAlerts7d) * 100)
        : 0;

    // Taxa de pacientes críticos
    const criticalRate =
      totalPatients > 0
        ? Math.round((metrics.criticalPatientsCount / totalPatients) * 100)
        : 0;

    return {
      conversionRates,
      bottlenecks,
      averageJourneyTime: Math.round(averageJourneyTime),
      resolutionRate,
      criticalRate,
      totalPatients,
    };
  }, [metrics, statistics]);

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border border-indigo-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="h-6 w-6 text-indigo-600" />
        <h2 className="text-xl font-semibold text-gray-900">Visão Executiva</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Tempo Médio de Jornada */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-indigo-600" />
            <h3 className="text-sm font-medium text-gray-600">
              Tempo Médio de Jornada
            </h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {executiveMetrics.averageJourneyTime} dias
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Estimativa baseada em distribuição atual
          </p>
        </div>

        {/* Taxa de Pacientes Críticos */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h3 className="text-sm font-medium text-gray-600">
              Taxa de Pacientes Críticos
            </h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {executiveMetrics.criticalRate}%
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {executiveMetrics.criticalRate} de {executiveMetrics.totalPatients}{' '}
            pacientes
          </p>
        </div>

        {/* Taxa de Resolução */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <h3 className="text-sm font-medium text-gray-600">
              Taxa de Resolução
            </h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {executiveMetrics.resolutionRate}%
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Alertas resolvidos (últimos 7 dias)
          </p>
        </div>

        {/* Total de Pacientes */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5 text-blue-600" />
            <h3 className="text-sm font-medium text-gray-600">
              Pacientes Ativos
            </h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {executiveMetrics.totalPatients}
          </p>
          <p className="text-xs text-gray-500 mt-1">Em acompanhamento ativo</p>
        </div>
      </div>

      {/* Distribuição por Fase e Bottlenecks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Taxa de Conversão por Fase */}
        <div className="bg-white rounded-lg border p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Distribuição por Fase da Jornada
          </h3>
          <div className="space-y-3">
            {executiveMetrics.conversionRates.map((stage, index) => {
              const isLast =
                index === executiveMetrics.conversionRates.length - 1;
              return (
                <div key={stage.stageKey} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        {stage.stage}
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {stage.count} ({stage.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all"
                        style={{ width: `${stage.percentage}%` }}
                      />
                    </div>
                  </div>
                  {!isLast && (
                    <ArrowRight className="h-4 w-4 text-gray-400 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottlenecks Identificados */}
        <div className="bg-white rounded-lg border p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Possíveis Bottlenecks
          </h3>
          {executiveMetrics.bottlenecks.length > 0 ? (
            <div className="space-y-3">
              {executiveMetrics.bottlenecks.map((bottleneck) => (
                <div
                  key={bottleneck.stageKey}
                  className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {bottleneck.stage}
                    </span>
                    <span className="text-sm font-semibold text-yellow-700">
                      {bottleneck.percentage}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    {bottleneck.count} pacientes concentrados nesta fase
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    ⚠️ Possível gargalo - considere revisar processos
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              <p className="text-sm">
                ✅ Nenhum bottleneck crítico identificado
              </p>
              <p className="text-xs mt-1">
                Distribuição de pacientes está equilibrada entre as fases
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Benchmarking */}
      <div className="mt-6 bg-white rounded-lg border p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Comparação com Padrões do Mercado
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div>
              <p className="text-xs text-gray-600">Tempo Médio Diagnóstico</p>
              <p className="text-lg font-semibold text-gray-900">
                {executiveMetrics.averageJourneyTime} dias
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Padrão: 60 dias</p>
              {executiveMetrics.averageJourneyTime < 60 ? (
                <p className="text-xs text-green-600 font-medium">✅ Melhor</p>
              ) : (
                <p className="text-xs text-yellow-600 font-medium">⚠️ Acima</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div>
              <p className="text-xs text-gray-600">Taxa de Resolução</p>
              <p className="text-lg font-semibold text-gray-900">
                {executiveMetrics.resolutionRate}%
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Meta: 80%</p>
              {executiveMetrics.resolutionRate >= 80 ? (
                <p className="text-xs text-green-600 font-medium">
                  ✅ Meta atingida
                </p>
              ) : (
                <p className="text-xs text-yellow-600 font-medium">
                  ⚠️ {80 - executiveMetrics.resolutionRate}% abaixo
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
            <div>
              <p className="text-xs text-gray-600">Pacientes Críticos</p>
              <p className="text-lg font-semibold text-gray-900">
                {executiveMetrics.criticalRate}%
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Ideal: {'<'} 10%</p>
              {executiveMetrics.criticalRate < 10 ? (
                <p className="text-xs text-green-600 font-medium">
                  ✅ Dentro do ideal
                </p>
              ) : (
                <p className="text-xs text-red-600 font-medium">
                  ⚠️ {executiveMetrics.criticalRate - 10}% acima
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
