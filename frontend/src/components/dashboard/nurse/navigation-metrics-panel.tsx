'use client';

import { useNavigationMetrics } from '@/hooks/useNavigationMetrics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertTriangle,
  Clock,
  Users,
  CheckCircle2,
  Calendar,
  TrendingUp,
  AlertCircle,
  BarChart3,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
  PieChart,
  Pie,
} from 'recharts';
import { CustomTooltip } from '@/components/dashboard/shared/custom-tooltip';

const JOURNEY_STAGE_LABELS: Record<string, string> = {
  SCREENING: 'Rastreio',
  DIAGNOSIS: 'Diagnóstico',
  TREATMENT: 'Tratamento',
  FOLLOW_UP: 'Seguimento',
};

export function NavigationMetricsPanel() {
  const { data: metrics, isLoading, error } = useNavigationMetrics();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-6 text-red-500">
        Erro ao carregar métricas de navegação: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Etapas Atrasadas
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.overdueStepsCount ?? 0}
            </div>
            {metrics && metrics.criticalOverdueStepsCount > 0 && (
              <p className="text-xs text-red-600 mt-1">
                {metrics.criticalOverdueStepsCount} críticas (&gt;14 dias)
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Etapas Próximas do Prazo
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.stepsDueSoonCount ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Próximos 7 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taxa de Conclusão
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.overallCompletionRate ?? 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Etapas concluídas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Pacientes
            </CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics
                ? Object.values(metrics.patientsByStage).reduce(
                    (a, b) => a + b,
                    0
                  )
                : 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Em acompanhamento
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por fase da jornada */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Pacientes por Fase da Jornada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {metrics &&
              Object.entries(metrics.patientsByStage).map(([stage, count]) => (
                <div
                  key={stage}
                  className="flex flex-col items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Badge variant="outline" className="mb-2">
                    {JOURNEY_STAGE_LABELS[stage] || stage}
                  </Badge>
                  <div className="text-2xl font-bold">{count}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    pacientes
                  </p>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Métricas Avançadas: Taxa de Conclusão e Tempo Médio por Fase */}
      {metrics && metrics.stageMetrics && metrics.stageMetrics.length > 0 && (
        <>
          {/* Gráfico de Taxa de Conclusão por Fase */}
          <Card className="chart-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Taxa de Conclusão por Fase
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={metrics.stageMetrics.map((sm) => ({
                    stage: JOURNEY_STAGE_LABELS[sm.stage] || sm.stage,
                    completionRate: sm.completionRate,
                    patientsCount: sm.patientsCount,
                  }))}
                >
                  <defs>
                    <linearGradient
                      id="gradientCompletion"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                      <stop
                        offset="100%"
                        stopColor="#059669"
                        stopOpacity={0.7}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="4 4"
                    stroke="rgba(148, 163, 184, 0.2)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="stage"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    label={{
                      value: '%',
                      angle: -90,
                      position: 'insideLeft',
                      style: { fill: '#64748b' },
                    }}
                  />
                  <Tooltip content={<CustomTooltip unit="%" />} />
                  <Bar
                    dataKey="completionRate"
                    name="Taxa de Conclusão"
                    fill="url(#gradientCompletion)"
                    radius={[6, 6, 0, 0]}
                    animationBegin={0}
                    animationDuration={600}
                    className="chart-hover"
                  >
                    {metrics.stageMetrics.map((entry, index) => {
                      const color =
                        entry.completionRate >= 80
                          ? '#10b981'
                          : entry.completionRate >= 60
                            ? '#f59e0b'
                            : '#dc2626';
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico de Tempo Médio por Fase */}
          <Card className="chart-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Tempo Médio por Fase
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={metrics.stageMetrics
                    .filter((sm) => sm.averageTimeDays !== null)
                    .map((sm) => ({
                      stage: JOURNEY_STAGE_LABELS[sm.stage] || sm.stage,
                      averageTimeDays: sm.averageTimeDays,
                      patientsCount: sm.patientsCount,
                    }))}
                >
                  <defs>
                    <linearGradient
                      id="gradientTime"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.9} />
                      <stop
                        offset="100%"
                        stopColor="#0284c7"
                        stopOpacity={0.7}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="4 4"
                    stroke="rgba(148, 163, 184, 0.2)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="stage"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    label={{
                      value: 'Dias',
                      angle: -90,
                      position: 'insideLeft',
                      style: { fill: '#64748b' },
                    }}
                  />
                  <Tooltip content={<CustomTooltip unit="dias" />} />
                  <Bar
                    dataKey="averageTimeDays"
                    name="Tempo Médio"
                    fill="url(#gradientTime)"
                    radius={[6, 6, 0, 0]}
                    animationBegin={0}
                    animationDuration={600}
                    className="chart-hover"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Detalhes por Fase */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Métricas Detalhadas por Fase
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.stageMetrics.map((stageMetric) => (
                  <div
                    key={stageMetric.stage}
                    className="border rounded-lg p-4 space-y-2 shadow-sm chart-scale-in"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">
                        {JOURNEY_STAGE_LABELS[stageMetric.stage] ||
                          stageMetric.stage}
                      </h4>
                      <Badge variant="outline">
                        {stageMetric.patientsCount} pacientes
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Taxa de Conclusão
                        </p>
                        <p className="text-lg font-bold">
                          {stageMetric.completionRate}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Tempo Médio
                        </p>
                        <p className="text-lg font-bold">
                          {stageMetric.averageTimeDays !== null
                            ? `${stageMetric.averageTimeDays} dias`
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Etapas Concluídas
                        </p>
                        <p className="text-lg font-bold text-green-600">
                          {stageMetric.completedSteps}/{stageMetric.totalSteps}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Etapas Atrasadas
                        </p>
                        <p
                          className={cn(
                            'text-lg font-bold',
                            stageMetric.overdueSteps > 0
                              ? 'text-red-600'
                              : 'text-gray-600'
                          )}
                        >
                          {stageMetric.overdueSteps}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Identificação de Bottlenecks */}
      {metrics && metrics.bottlenecks && metrics.bottlenecks.length > 0 && (
        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 shadow-sm chart-slide-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="h-5 w-5" />
              Bottlenecks Identificados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Gráfico de Bottlenecks */}
            <div className="mb-6">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={metrics.bottlenecks.map((b) => ({
                    stage: b.stageLabel,
                    percentage: b.percentage,
                    patientsCount: b.patientsCount,
                    averageTimeDays: b.averageTimeDays,
                  }))}
                  layout="vertical"
                >
                  <defs>
                    <linearGradient
                      id="gradientBottleneck"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                    >
                      <stop offset="0%" stopColor="#ea580c" stopOpacity={0.9} />
                      <stop
                        offset="100%"
                        stopColor="#c2410c"
                        stopOpacity={0.7}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="4 4"
                    stroke="rgba(148, 163, 184, 0.2)"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    label={{
                      value: '% dos Pacientes',
                      position: 'insideBottom',
                      offset: -5,
                      style: { fill: '#64748b' },
                    }}
                  />
                  <YAxis
                    type="category"
                    dataKey="stage"
                    width={120}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <Tooltip content={<CustomTooltip unit="%" />} />
                  <Bar
                    dataKey="percentage"
                    name="% dos Pacientes"
                    fill="url(#gradientBottleneck)"
                    radius={[0, 6, 6, 0]}
                    animationBegin={0}
                    animationDuration={600}
                    className="chart-hover"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Lista de Bottlenecks */}
            <div className="space-y-3">
              {metrics.bottlenecks.map((bottleneck, index) => (
                <div
                  key={index}
                  className="bg-white border border-orange-200 rounded-lg p-4 shadow-sm chart-scale-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-orange-900">
                        {bottleneck.stageLabel}
                      </h4>
                      <p className="text-sm text-orange-700 mt-1">
                        {bottleneck.reason}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-orange-100 text-orange-800"
                    >
                      {bottleneck.percentage}% dos pacientes
                    </Badge>
                  </div>
                  <div className="flex gap-4 text-sm text-gray-600 mt-2">
                    <span>
                      <strong>{bottleneck.patientsCount}</strong> pacientes
                      nesta fase
                    </span>
                    {bottleneck.averageTimeDays !== null && (
                      <span>
                        Tempo médio:{' '}
                        <strong>{bottleneck.averageTimeDays} dias</strong>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
