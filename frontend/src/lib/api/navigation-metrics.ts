import { apiClient } from './client';

export interface StageMetrics {
  stage: string;
  patientsCount: number;
  completionRate: number;
  averageTimeDays: number | null;
  totalSteps: number;
  completedSteps: number;
  pendingSteps: number;
  overdueSteps: number;
}

export interface Bottleneck {
  stage: string;
  stageLabel: string;
  patientsCount: number;
  percentage: number;
  averageTimeDays: number | null;
  reason: string;
}

export interface NavigationMetrics {
  overdueStepsCount: number;
  criticalOverdueStepsCount: number;
  patientsByStage: {
    SCREENING: number;
    DIAGNOSIS: number;
    TREATMENT: number;
    FOLLOW_UP: number;
  };
  stepsDueSoonCount: number;
  overallCompletionRate: number;
  // Métricas Avançadas
  stageMetrics: StageMetrics[];
  bottlenecks: Bottleneck[];
  averageTimePerStage: {
    SCREENING: number | null;
    DIAGNOSIS: number | null;
    TREATMENT: number | null;
    FOLLOW_UP: number | null;
  };
}

export const navigationMetricsApi = {
  async getMetrics(): Promise<NavigationMetrics> {
    const response = await apiClient.get<NavigationMetrics>(
      '/dashboard/navigation-metrics'
    );
    return response;
  },
};
