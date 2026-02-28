import { apiClient } from './client';

export interface PatientWithCriticalStep {
  patientId: string;
  patientName: string;
  patientAge: number;
  cancerType: string | null;
  currentStage: string;
  priorityScore: number;
  priorityCategory: string;
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

export interface PatientsCriticalStepsFilters {
  journeyStage?: string;
  cancerType?: string;
  maxResults?: number;
}

export const patientsCriticalStepsApi = {
  async getAll(
    filters?: PatientsCriticalStepsFilters
  ): Promise<PatientWithCriticalStep[]> {
    const params: Record<string, string> = {};
    if (filters?.journeyStage) params.journeyStage = filters.journeyStage;
    if (filters?.cancerType) params.cancerType = filters.cancerType;
    if (filters?.maxResults) params.maxResults = filters.maxResults.toString();

    const response = await apiClient.get<PatientWithCriticalStep[]>(
      '/dashboard/patients-with-critical-steps',
      { params }
    );
    return response;
  },
};
