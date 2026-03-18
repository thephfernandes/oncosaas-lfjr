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
  averageResponseTimeMinutes: number | null;
  overdueStepsCount: number;
  // Métricas Clínicas
  averageTimeToTreatmentDays: number | null;
  averageTimeToDiagnosisDays: number | null;
  pendingBiomarkersCount: number;
  treatmentAdherencePercentage: number;
  priorityDistribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
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

/** Alerta pendente para drill-down do indicador "Alertas Pendentes". */
export interface PendingAlert {
  id: string;
  type: string;
  severity: string;
  message: string;
  status: string;
  createdAt: string;
  patientId: string;
  patient: {
    id: string;
    name: string;
    phone: string | null;
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
    /** Quando true, retorna apenas pacientes com etapas já atrasadas (não "vence em X dias"). */
    overdueOnly?: boolean;
  }): Promise<PatientWithCriticalStep[]> {
    const queryParams = new URLSearchParams();
    if (params?.journeyStage)
      queryParams.append('journeyStage', params.journeyStage);
    if (params?.cancerType) queryParams.append('cancerType', params.cancerType);
    if (params?.maxResults)
      queryParams.append('maxResults', params.maxResults.toString());
    if (params?.overdueOnly === true)
      queryParams.append('overdueOnly', 'true');

    const queryString = queryParams.toString();
    return apiClient.get<PatientWithCriticalStep[]>(
      `/dashboard/patients-with-critical-steps${queryString ? `?${queryString}` : ''}`
    );
  },

  /**
   * Lista alertas pendentes para o drill-down do indicador "Alertas Pendentes".
   * Retorna os alertas (com dados do paciente), não a lista de pacientes.
   */
  async getPendingAlerts(maxResults: number = 100): Promise<PendingAlert[]> {
    const params = new URLSearchParams();
    if (maxResults) params.append('maxResults', maxResults.toString());
    return apiClient.get<PendingAlert[]>(
      `/dashboard/pending-alerts?${params.toString()}`
    );
  },

  /**
   * Lista pacientes filtrados por indicador (mensagens não assumidas, biomarcadores pendentes).
   * Para alertas use getPendingAlerts.
   */
  async getPatientsByIndicator(
    indicator: 'messages' | 'biomarkers',
    maxResults: number = 100
  ): Promise<import('./patients').Patient[]> {
    const params = new URLSearchParams();
    params.append('indicator', indicator);
    if (maxResults) params.append('maxResults', maxResults.toString());
    return apiClient.get<import('./patients').Patient[]>(
      `/dashboard/patients-by-indicator?${params.toString()}`
    );
  },
};
