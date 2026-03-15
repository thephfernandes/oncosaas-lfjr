export class NurseMetricsDto {
  alertsResolvedToday: number;
  averageResponseTimeMinutes: number | null;
  patientsAttendedToday: number;
  topReportedSymptoms: Array<{
    symptom: string;
    count: number;
    percentage: number;
  }>;
}
