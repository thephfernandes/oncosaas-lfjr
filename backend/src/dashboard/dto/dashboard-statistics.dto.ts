export class AlertStatisticsPoint {
  date: string; // ISO date string
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

export class DashboardStatisticsDto {
  period: string; // '7d' | '30d' | '90d'
  alertStatistics: AlertStatisticsPoint[];
  patientStatistics: Array<{
    date: string;
    active: number;
    critical: number;
    new: number;
  }>;
  responseTimeStatistics: Array<{
    date: string;
    averageMinutes: number;
  }>;
}