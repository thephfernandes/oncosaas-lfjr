export class PatientWithCriticalStepDto {
  patientId: string;
  patientName: string;
  patientAge: number;
  cancerType: string | null;
  currentStage: string;
  priorityScore: number;
  priorityCategory: string;

  // Etapa crítica
  criticalStep: {
    id: string;
    stepName: string;
    stepDescription: string | null;
    journeyStage: string;
    status: string;
    isRequired: boolean;
    dueDate: string | null;
    daysOverdue: number | null; // null se não estiver atrasada
    expectedDate: string | null;
  };

  // Progresso geral
  totalSteps: number;
  completedSteps: number;
  completionRate: number; // Percentual (0-100)

  // Alertas relacionados
  navigationAlertsCount: number;
}