export class NurseMetricsDto {
  alertsResolvedToday: number;
  averageResponseTimeMinutes: number | null;
  patientsAttendedToday: number;
  agentResponseRate: number; // Percentual (0-100)
  topReportedSymptoms: Array<{
    symptom: string;
    count: number;
    percentage: number;
  }>;
}
