import { apiClient } from './client';

export interface NurseMetrics {
  alertsResolvedToday: number;
  averageResponseTimeMinutes: number | null;
  patientsAttendedToday: number;
  agentResponseRate: number;
  topReportedSymptoms: Array<{
    symptom: string;
    count: number;
    percentage: number;
  }>;
}

export const nurseMetricsApi = {
  async getMetrics(): Promise<NurseMetrics> {
    const response = await apiClient.get<NurseMetrics>(
      '/dashboard/nurse-metrics'
    );
    return response;
  },
};
