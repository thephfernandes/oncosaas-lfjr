export class DashboardMetricsDto {
  // KPIs operacionais
  totalActivePatients: number;
  criticalPatientsCount: number; // Score >= 75
  totalPendingAlerts: number;
  criticalAlertsCount: number;
  highAlertsCount: number;
  mediumAlertsCount: number;
  lowAlertsCount: number;
  unassumedMessagesCount: number;
  averageResponseTimeMinutes: number | null;
  overdueStepsCount: number; // Etapas de navegação atrasadas (OVERDUE)

  // Métricas Clínicas
  averageTimeToTreatmentDays: number | null; // Tempo médio desde diagnóstico até início de tratamento (meta <30 dias)
  averageTimeToDiagnosisDays: number | null; // Tempo médio desde suspeita até diagnóstico confirmado (meta <60 dias)
  pendingBiomarkersCount: number; // Pacientes aguardando resultados de biomarcadores críticos
  treatmentAdherencePercentage: number; // % de pacientes que completam ciclos conforme planejado

  // Distribuição
  priorityDistribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}
