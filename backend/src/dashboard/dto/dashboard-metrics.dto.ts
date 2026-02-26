export class DashboardMetricsDto {
  // KPIs principais
  totalActivePatients: number;
  criticalPatientsCount: number; // Score >= 75
  totalPendingAlerts: number;
  criticalAlertsCount: number;
  highAlertsCount: number;
  mediumAlertsCount: number;
  lowAlertsCount: number;
  unassumedMessagesCount: number;
  resolvedTodayCount: number;
  averageResponseTimeMinutes: number | null;
  overdueStepsCount: number; // Etapas de navegação atrasadas (OVERDUE)

  // Métricas Clínicas Críticas
  averageTimeToTreatmentDays: number | null; // Tempo médio desde diagnóstico até início de tratamento (meta <30 dias)
  averageTimeToDiagnosisDays: number | null; // Tempo médio desde suspeita até diagnóstico confirmado (meta <60 dias)
  stagingCompletePercentage: number; // % de pacientes com estadiamento completo antes de tratamento
  pendingBiomarkersCount: number; // Pacientes aguardando resultados de biomarcadores críticos
  treatmentAdherencePercentage: number; // % de pacientes que completam ciclos conforme planejado

  // Distribuições
  priorityDistribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };

  cancerTypeDistribution: Array<{
    cancerType: string;
    count: number;
    percentage: number;
  }>;

  journeyStageDistribution: Array<{
    stage: string;
    count: number;
    percentage: number;
  }>;

  statusDistribution: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
}
