export class NavigationMetricsDto {
  // Etapas atrasadas
  overdueStepsCount: number;
  criticalOverdueStepsCount: number; // Obrigatórias + >14 dias

  // Pacientes por fase da jornada
  patientsByStage: {
    SCREENING: number;
    DIAGNOSIS: number;
    TREATMENT: number;
    FOLLOW_UP: number;
  };

  // Etapas próximas do prazo (próximas 7 dias)
  stepsDueSoonCount: number;

  // Taxa de conclusão de etapas
  overallCompletionRate: number; // Percentual (0-100)
}
