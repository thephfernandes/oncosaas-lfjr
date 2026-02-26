import { apiClient } from './client';

export interface DashboardMetrics {
  totalActivePatients: number;
  criticalPatientsCount: number;
  totalPendingAlerts: number;
  criticalAlertsCount: number;
  highAlertsCount: number;
  mediumAlertsCount: number;
  lowAlertsCount: number;
  unassumedMessagesCount: number;
  resolvedTodayCount: number;
  averageResponseTimeMinutes: number | null;
  overdueStepsCount: number;
  // Métricas Clínicas Críticas
  averageTimeToTreatmentDays: number | null;
  averageTimeToDiagnosisDays: number | null;
  stagingCompletePercentage: number;
  pendingBiomarkersCount: number;
  treatmentAdherencePercentage: number;
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

export interface AlertStatisticsPoint {
  date: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

export interface PatientStatisticsPoint {
  date: string;
  active: number;
  critical: number;
  new: number;
}

export interface ResponseTimeStatisticsPoint {
  date: string;
  averageMinutes: number;
}

export interface DashboardStatistics {
  period: '7d' | '30d' | '90d';
  alertStatistics: AlertStatisticsPoint[];
  patientStatistics: PatientStatisticsPoint[];
  responseTimeStatistics: ResponseTimeStatisticsPoint[];
}

export interface PatientWithCriticalStep {
  patientId: string;
  patientName: string;
  patientAge: number;
  cancerType: string | null;
  currentStage: string;
  priorityScore: number | null;
  priorityCategory: string | null;
  criticalStep: {
    id: string;
    stepName: string;
    stepDescription: string | null;
    journeyStage: string;
    status: string;
    isRequired: boolean;
    dueDate: string | null;
    daysOverdue: number | null;
    expectedDate: string | null;
  };
  totalSteps: number;
  completedSteps: number;
  completionRate: number;
  navigationAlertsCount: number;
}

export interface CriticalTimelineBenchmark {
  cancerType: string;
  metric: string;
  idealDays: number;
  acceptableDays: number;
  criticalDays: number;
}

export interface CriticalTimelineMetric {
  cancerType: string;
  metric: string;
  metricLabel: string;
  currentAverageDays: number | null;
  benchmark: CriticalTimelineBenchmark;
  status: 'IDEAL' | 'ACCEPTABLE' | 'CRITICAL' | 'NO_DATA';
  patientsCount: number;
  patientsAtRisk: number;
}

export interface CriticalTimelines {
  metrics: CriticalTimelineMetric[];
  summary: {
    totalMetrics: number;
    metricsInIdealRange: number;
    metricsInAcceptableRange: number;
    metricsInCriticalRange: number;
    metricsWithNoData: number;
  };
}

export const dashboardApi = {
  async getMetrics(): Promise<DashboardMetrics> {
    return apiClient.get<DashboardMetrics>('/dashboard/metrics');
  },

  async getStatistics(
    period: '7d' | '30d' | '90d' = '7d'
  ): Promise<DashboardStatistics> {
    return apiClient.get<DashboardStatistics>(
      `/dashboard/statistics?period=${period}`
    );
  },

  async getPatientsWithCriticalSteps(params?: {
    journeyStage?: string;
    cancerType?: string;
    maxResults?: number;
  }): Promise<PatientWithCriticalStep[]> {
    const queryParams = new URLSearchParams();
    if (params?.journeyStage)
      queryParams.append('journeyStage', params.journeyStage);
    if (params?.cancerType) queryParams.append('cancerType', params.cancerType);
    if (params?.maxResults)
      queryParams.append('maxResults', params.maxResults.toString());

    const queryString = queryParams.toString();
    return apiClient.get<PatientWithCriticalStep[]>(
      `/dashboard/patients-with-critical-steps${queryString ? `?${queryString}` : ''}`
    );
  },

  async getCriticalTimelines(): Promise<CriticalTimelines> {
    return apiClient.get<CriticalTimelines>('/dashboard/critical-timelines');
  },
};
