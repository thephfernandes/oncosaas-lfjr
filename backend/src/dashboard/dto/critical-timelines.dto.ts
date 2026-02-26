export interface CriticalTimelineBenchmark {
  cancerType: string;
  metric: string; // "time_to_diagnosis", "time_to_treatment", "biopsy_to_pathology", etc.
  idealDays: number; // Meta ideal (NCCN/ESMO)
  acceptableDays: number; // Aceitável
  criticalDays: number; // Crítico (impacta prognóstico)
}

export interface CriticalTimelineMetric {
  cancerType: string;
  metric: string;
  metricLabel: string; // "Tempo até Diagnóstico", "Tempo até Tratamento", etc.
  currentAverageDays: number | null; // Média atual do tenant
  benchmark: CriticalTimelineBenchmark;
  status: 'IDEAL' | 'ACCEPTABLE' | 'CRITICAL' | 'NO_DATA';
  patientsCount: number; // Quantos pacientes foram incluídos no cálculo
  patientsAtRisk: number; // Quantos pacientes estão acima do crítico
}

export class CriticalTimelinesDto {
  metrics: CriticalTimelineMetric[];
  summary: {
    totalMetrics: number;
    metricsInIdealRange: number;
    metricsInAcceptableRange: number;
    metricsInCriticalRange: number;
    metricsWithNoData: number;
  };
}
