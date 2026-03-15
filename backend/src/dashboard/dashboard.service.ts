import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardMetricsDto } from './dto/dashboard-metrics.dto';
import {
  DashboardStatisticsDto,
  AlertStatisticsPoint,
} from './dto/dashboard-statistics.dto';
import { NavigationMetricsDto } from './dto/navigation-metrics.dto';
import { PatientWithCriticalStepDto } from './dto/patients-with-critical-steps.dto';
import { PendingAlertDto } from './dto/pending-alert.dto';

import {
  PriorityCategory,
  PatientStatus,
  JourneyStage,
  AlertSeverity,
  AlertStatus,
  Patient,
} from '@prisma/client';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getMetrics(tenantId: string): Promise<DashboardMetricsDto> {
    // Total de pacientes ativos
    const totalActivePatients = await this.prisma.patient.count({
      where: {
        tenantId,
        status: {
          in: ['ACTIVE', 'IN_TREATMENT', 'FOLLOW_UP'],
        },
      },
    });

    // Pacientes críticos (score >= 75)
    const criticalPatientsCount = await this.prisma.patient.count({
      where: {
        tenantId,
        priorityScore: { gte: 75 },
        status: {
          in: ['ACTIVE', 'IN_TREATMENT', 'FOLLOW_UP'],
        },
      },
    });

    // Alertas pendentes por severidade
    const alertsBySeverity = await this.prisma.alert.groupBy({
      by: ['severity'],
      where: {
        tenantId,
        status: {
          not: 'RESOLVED',
        },
      },
      _count: true,
    });

    const criticalAlertsCount =
      alertsBySeverity.find((a) => a.severity === 'CRITICAL')?._count || 0;
    const highAlertsCount =
      alertsBySeverity.find((a) => a.severity === 'HIGH')?._count || 0;
    const mediumAlertsCount =
      alertsBySeverity.find((a) => a.severity === 'MEDIUM')?._count || 0;
    const lowAlertsCount =
      alertsBySeverity.find((a) => a.severity === 'LOW')?._count || 0;
    const totalPendingAlerts =
      criticalAlertsCount +
      highAlertsCount +
      mediumAlertsCount +
      lowAlertsCount;

    // Mensagens não assumidas
    const unassumedMessagesCount = await this.prisma.message.count({
      where: {
        tenantId,
        direction: 'INBOUND',
        assumedBy: null,
      },
    });

    // Tempo médio de resposta a alertas (em minutos)
    const resolvedAlerts = await this.prisma.alert.findMany({
      where: {
        tenantId,
        status: 'RESOLVED',
        resolvedAt: { not: null }, // resolvedAt é nullable, então podemos filtrar por not null
        // createdAt não é nullable no schema, então não precisa verificar
      },
      select: {
        createdAt: true,
        resolvedAt: true,
      },
    });

    let averageResponseTimeMinutes: number | null = null;
    if (resolvedAlerts.length > 0) {
      const totalMinutes = resolvedAlerts.reduce((sum, alert) => {
        if (alert.createdAt && alert.resolvedAt) {
          const diffMs = Math.max(
            0,
            new Date(alert.resolvedAt).getTime() -
              new Date(alert.createdAt).getTime(),
          );
          return sum + Math.round(diffMs / (1000 * 60));
        }
        return sum;
      }, 0);
      averageResponseTimeMinutes = Math.round(
        totalMinutes / resolvedAlerts.length,
      );
    }

    // Distribuição por prioridade
    const priorityDistribution = await this.prisma.patient.groupBy({
      by: ['priorityCategory'],
      where: {
        tenantId,
        status: {
          in: ['ACTIVE', 'IN_TREATMENT', 'FOLLOW_UP'],
        },
      },
      _count: true,
    });

    const priorityDist = {
      critical:
        priorityDistribution.find((p) => p.priorityCategory === 'CRITICAL')
          ?._count || 0,
      high:
        priorityDistribution.find((p) => p.priorityCategory === 'HIGH')
          ?._count || 0,
      medium:
        priorityDistribution.find((p) => p.priorityCategory === 'MEDIUM')
          ?._count || 0,
      low:
        priorityDistribution.find((p) => p.priorityCategory === 'LOW')
          ?._count || 0,
    };

    // Contar etapas de navegação atrasadas (OVERDUE)
    const now = new Date();
    const overdueStepsCount = await this.prisma.navigationStep.count({
      where: {
        tenantId,
        status: 'OVERDUE',
        isCompleted: false,
      },
    });

    // ========== MÉTRICAS CLÍNICAS CRÍTICAS ==========

    // 1. Time-to-Treatment: Tempo médio desde diagnóstico confirmado até início de tratamento
    const patientsWithTreatment = await this.prisma.patientJourney.findMany({
      where: {
        tenantId,
        diagnosisConfirmed: true,
        diagnosisDate: { not: null },
        treatmentStartDate: { not: null },
      },
      select: {
        diagnosisDate: true,
        treatmentStartDate: true,
      },
    });

    let averageTimeToTreatmentDays: number | null = null;
    if (patientsWithTreatment.length > 0) {
      const validTreatmentTimes = patientsWithTreatment
        .map((journey) => {
          if (journey.diagnosisDate && journey.treatmentStartDate) {
            const diffMs = Math.max(
              0,
              new Date(journey.treatmentStartDate).getTime() -
                new Date(journey.diagnosisDate).getTime(),
            );
            return Math.floor(diffMs / (1000 * 60 * 60 * 24));
          }
          return null;
        })
        .filter((d): d is number => d !== null && d >= 0);

      if (validTreatmentTimes.length > 0) {
        const totalDays = validTreatmentTimes.reduce(
          (sum, days) => sum + days,
          0,
        );
        averageTimeToTreatmentDays = Math.round(
          totalDays / validTreatmentTimes.length,
        );
      }
    }

    // 2. Time-to-Diagnosis: Tempo médio desde primeira etapa DIAGNOSIS até diagnóstico confirmado
    // Buscar pacientes com diagnóstico confirmado e primeira etapa DIAGNOSIS
    const patientsWithDiagnosis = await this.prisma.patient.findMany({
      where: {
        tenantId,
        journey: {
          diagnosisConfirmed: true,
          diagnosisDate: { not: null },
        },
      },
      include: {
        navigationSteps: {
          where: {
            journeyStage: 'DIAGNOSIS',
          },
          orderBy: {
            createdAt: 'asc',
          },
          take: 1,
        },
        journey: {
          select: {
            diagnosisDate: true,
          },
        },
      },
    });

    let averageTimeToDiagnosisDays: number | null = null;
    const validDiagnosisTimes = patientsWithDiagnosis
      .filter((p) => p.journey?.diagnosisDate && p.navigationSteps.length > 0)
      .map((p) => {
        const firstDiagnosisStep = p.navigationSteps[0];
        const diagnosisDate = p.journey.diagnosisDate;
        const diffMs =
          new Date(diagnosisDate).getTime() -
          new Date(firstDiagnosisStep.createdAt).getTime();
        return Math.floor(diffMs / (1000 * 60 * 60 * 24));
      })
      .filter((days) => days >= 0); // Apenas valores válidos

    if (validDiagnosisTimes.length > 0) {
      const totalDays = validDiagnosisTimes.reduce(
        (sum, days) => sum + days,
        0
      );
      averageTimeToDiagnosisDays = Math.round(
        totalDays / validDiagnosisTimes.length
      );
    }

    // 3. Biomarcadores Pendentes: Pacientes aguardando resultados de biomarcadores críticos
    // Biomarcadores críticos: HER2, EGFR, PD-L1, MSI-H, KRAS, BRAF, ALK
    const biomarkerStepKeys = [
      'her2_test',
      'egfr_test',
      'pdl1_test',
      'msi_test',
      'kras_test',
      'braf_test',
      'alk_test',
      'biomarker_her2',
      'biomarker_egfr',
      'biomarker_pdl1',
      'biomarker_msi',
      'biomarker_kras',
      'biomarker_braf',
      'biomarker_alk',
    ];

    const pendingBiomarkerSteps = await this.prisma.navigationStep.findMany({
      where: {
        tenantId,
        stepKey: {
          in: biomarkerStepKeys,
        },
        isCompleted: false,
        status: {
          in: ['PENDING', 'IN_PROGRESS', 'OVERDUE'],
        },
      },
      select: {
        patientId: true,
      },
      distinct: ['patientId'],
    });

    const pendingBiomarkersCount = pendingBiomarkerSteps.length;

    // 4. Taxa de Adesão ao Tratamento: % de pacientes que completam ciclos conforme planejado.
    // Considera apenas pacientes que já atingiram 80% dos ciclos (avaliamos aderência);
    // pacientes no início (ex: ciclo 1/12) não entram no denominador.
    const patientsInTreatment = await this.prisma.patientJourney.findMany({
      where: {
        tenantId,
        treatmentStartDate: { not: null },
        totalCycles: { not: null },
        currentCycle: { not: null },
      },
      select: {
        currentCycle: true,
        totalCycles: true,
      },
    });

    const eligibleForAdherence = patientsInTreatment.filter(
      (journey) =>
        journey.currentCycle &&
        journey.totalCycles &&
        journey.currentCycle >= Math.floor(journey.totalCycles * 0.8)
    );

    const patientsOnTrack = eligibleForAdherence.filter(
      (journey) =>
        journey.currentCycle &&
        journey.totalCycles &&
        journey.currentCycle >= journey.totalCycles
    ).length;

    const treatmentAdherencePercentage =
      eligibleForAdherence.length > 0
        ? Math.round(
            (patientsOnTrack / eligibleForAdherence.length) * 100
          )
        : 0;

    return {
      totalActivePatients,
      criticalPatientsCount,
      totalPendingAlerts,
      criticalAlertsCount,
      highAlertsCount,
      mediumAlertsCount,
      lowAlertsCount,
      unassumedMessagesCount,
      averageResponseTimeMinutes,
      overdueStepsCount,
      // Métricas Clínicas
      averageTimeToTreatmentDays,
      averageTimeToDiagnosisDays,
      pendingBiomarkersCount,
      treatmentAdherencePercentage,
      priorityDistribution: priorityDist,
    };
  }

  async getStatistics(
    tenantId: string,
    period: '7d' | '30d' | '90d' = '7d'
  ): Promise<DashboardStatisticsDto> {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Estatísticas de alertas por dia
    const alerts = await this.prisma.alert.findMany({
      where: {
        tenantId,
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
        severity: true,
      },
    });

    // Agrupar por data e severidade
    const alertsByDate = new Map<
      string,
      { critical: number; high: number; medium: number; low: number }
    >();

    alerts.forEach((alert) => {
      const dateKey = new Date(alert.createdAt).toISOString().split('T')[0];
      if (!alertsByDate.has(dateKey)) {
        alertsByDate.set(dateKey, { critical: 0, high: 0, medium: 0, low: 0 });
      }
      const dayData = alertsByDate.get(dateKey);
      if (alert.severity === 'CRITICAL') {
        dayData.critical++;
      } else if (alert.severity === 'HIGH') {
        dayData.high++;
      } else if (alert.severity === 'MEDIUM') {
        dayData.medium++;
      } else if (alert.severity === 'LOW') {
        dayData.low++;
      }
    });

    // Preencher dias sem dados com zeros
    const alertStatistics: AlertStatisticsPoint[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      const dayData = alertsByDate.get(dateKey) || {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      };
      alertStatistics.push({
        date: dateKey,
        ...dayData,
        total: dayData.critical + dayData.high + dayData.medium + dayData.low,
      });
    }

    // Estatísticas de pacientes por dia
    const patients = await this.prisma.patient.findMany({
      where: {
        tenantId,
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
        priorityScore: true,
        status: true,
      },
    });

    const patientsByDate = new Map<
      string,
      { active: number; critical: number; new: number }
    >();

    // Para cada dia, contar pacientes ativos e críticos naquele momento
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      date.setHours(23, 59, 59, 999);
      const dateKey = date.toISOString().split('T')[0];

      const activeOnDate = patients.filter(
        (p) =>
          new Date(p.createdAt) <= date &&
          ['ACTIVE', 'IN_TREATMENT', 'FOLLOW_UP'].includes(p.status)
      );

      const criticalOnDate = activeOnDate.filter(
        (p) => (p.priorityScore || 0) >= 75
      );
      const newOnDate = patients.filter((p) => {
        const pDate = new Date(p.createdAt).toISOString().split('T')[0];
        return pDate === dateKey;
      });

      patientsByDate.set(dateKey, {
        active: activeOnDate.length,
        critical: criticalOnDate.length,
        new: newOnDate.length,
      });
    }

    const patientStatistics = Array.from(patientsByDate.entries()).map(
      ([date, data]) => ({
        date,
        ...data,
      })
    );

    // Estatísticas de tempo de resposta
    const resolvedAlerts = await this.prisma.alert.findMany({
      where: {
        tenantId,
        status: 'RESOLVED',
        resolvedAt: { not: null },
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
        resolvedAt: true,
      },
    });

    const responseTimeByDate = new Map<string, number[]>();

    resolvedAlerts.forEach((alert) => {
      if (alert.createdAt && alert.resolvedAt) {
        const dateKey = new Date(alert.resolvedAt).toISOString().split('T')[0];
        const diffMs = Math.max(
          0,
          new Date(alert.resolvedAt).getTime() -
            new Date(alert.createdAt).getTime(),
        );
        const minutes = Math.round(diffMs / (1000 * 60));

        if (!responseTimeByDate.has(dateKey)) {
          responseTimeByDate.set(dateKey, []);
        }
        responseTimeByDate.get(dateKey).push(minutes);
      }
    });

    const responseTimeStatistics = Array.from(responseTimeByDate.entries()).map(
      ([date, times]) => ({
        date,
        averageMinutes: Math.round(
          times.reduce((sum, t) => sum + t, 0) / times.length
        ),
      })
    );

    // Preencher dias sem dados
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      if (!responseTimeStatistics.find((r) => r.date === dateKey)) {
        responseTimeStatistics.push({
          date: dateKey,
          averageMinutes: 0,
        });
      }
    }

    responseTimeStatistics.sort((a, b) => a.date.localeCompare(b.date));

    return {
      period,
      alertStatistics,
      patientStatistics,
      responseTimeStatistics,
    };
  }

  async getNurseMetrics(tenantId: string, userId: string | null) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Filtro por usuário: quando userId é passado (enfermeiro logado), filtra
    // por ele; caso contrário (gestão), mostra dados agregados de toda a equipe.
    const userFilter = userId ? { resolvedBy: userId } : {};
    const interventionUserFilter = userId ? { userId } : {};

    // Alertas resolvidos hoje (pelo enfermeiro ou por toda a equipe)
    const alertsResolvedToday = await this.prisma.alert.count({
      where: {
        tenantId,
        status: 'RESOLVED',
        ...userFilter,
        resolvedAt: {
          gte: todayStart,
        },
      },
    });

    // Tempo médio de resposta (em minutos)
    const resolvedAlerts = await this.prisma.alert.findMany({
      where: {
        tenantId,
        status: 'RESOLVED',
        ...userFilter,
        resolvedAt: { not: null },
      },
      select: {
        createdAt: true,
        resolvedAt: true,
      },
    });

    let averageResponseTimeMinutes: number | null = null;
    if (resolvedAlerts.length > 0) {
      const totalMinutes = resolvedAlerts.reduce((sum, alert) => {
        if (alert.createdAt && alert.resolvedAt) {
          const diffMs = Math.max(
            0,
            new Date(alert.resolvedAt).getTime() -
              new Date(alert.createdAt).getTime(),
          );
          return sum + Math.round(diffMs / (1000 * 60));
        }
        return sum;
      }, 0);
      averageResponseTimeMinutes = Math.round(
        totalMinutes / resolvedAlerts.length,
      );
    }

    // Pacientes atendidos hoje (intervenções do enfermeiro ou de toda a equipe)
    const uniquePatients = await this.prisma.intervention.groupBy({
      by: ['patientId'],
      where: {
        tenantId,
        ...interventionUserFilter,
        createdAt: {
          gte: todayStart,
        },
      },
    });
    const patientsAttendedToday = uniquePatients.length;

    // Sintomas mais reportados (últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);
    const messagesWithSymptoms = await this.prisma.message.findMany({
      where: {
        tenantId,
        direction: 'INBOUND',
        createdAt: {
          gte: thirtyDaysAgo,
        },
        criticalSymptomsDetected: {
          isEmpty: false,
        },
      },
      select: {
        criticalSymptomsDetected: true,
      },
    });

    // Contar sintomas
    const symptomCounts = new Map<string, number>();
    messagesWithSymptoms.forEach((message) => {
      message.criticalSymptomsDetected.forEach((symptom) => {
        symptomCounts.set(symptom, (symptomCounts.get(symptom) || 0) + 1);
      });
    });

    // Converter para array e ordenar
    const totalSymptomMessages = messagesWithSymptoms.length;
    const topReportedSymptoms = Array.from(symptomCounts.entries())
      .map(([symptom, count]) => ({
        symptom,
        count,
        percentage:
          totalSymptomMessages > 0
            ? Math.round((count / totalSymptomMessages) * 100 * 10) / 10
            : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5

    return {
      alertsResolvedToday,
      averageResponseTimeMinutes,
      patientsAttendedToday,
      topReportedSymptoms,
    };
  }

  /**
   * Calcula métricas de navegação oncológica para o dashboard da nurse
   */
  async getNavigationMetrics(tenantId: string): Promise<NavigationMetricsDto> {
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    // Etapas atrasadas (OVERDUE ou dueDate no passado)
    const overdueSteps = await this.prisma.navigationStep.findMany({
      where: {
        tenantId,
        status: {
          in: ['OVERDUE', 'PENDING', 'IN_PROGRESS'],
        },
        isCompleted: false,
        OR: [
          { status: 'OVERDUE' },
          {
            dueDate: {
              lt: now,
            },
          },
        ],
      },
    });

    const overdueStepsCount = overdueSteps.length;

    // Etapas críticas atrasadas (obrigatórias + >14 dias)
    const criticalOverdueSteps = overdueSteps.filter((step) => {
      if (!step.isRequired || !step.dueDate) {
        return false;
      }
      const daysOverdue = Math.floor(
        (now.getTime() - new Date(step.dueDate).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      return daysOverdue > 14;
    });
    const criticalOverdueStepsCount = criticalOverdueSteps.length;

    // Pacientes por fase da jornada
    const patientsByStage = await this.prisma.patient.groupBy({
      by: ['currentStage'],
      where: {
        tenantId,
        status: {
          in: ['ACTIVE', 'IN_TREATMENT', 'FOLLOW_UP'],
        },
      },
      _count: true,
    });

    const stageCounts = {
      SCREENING: 0,
      DIAGNOSIS: 0,
      TREATMENT: 0,
      FOLLOW_UP: 0,
    };

    patientsByStage.forEach((item) => {
      if (item.currentStage in stageCounts) {
        stageCounts[item.currentStage as keyof typeof stageCounts] =
          item._count;
      }
    });

    // Etapas próximas do prazo (próximas 7 dias)
    const stepsDueSoon = await this.prisma.navigationStep.count({
      where: {
        tenantId,
        status: {
          in: ['PENDING', 'IN_PROGRESS'],
        },
        isCompleted: false,
        dueDate: {
          gte: now,
          lte: sevenDaysFromNow,
        },
      },
    });

    // Taxa de conclusão geral de etapas
    const allSteps = await this.prisma.navigationStep.findMany({
      where: {
        tenantId,
      },
      select: {
        isCompleted: true,
      },
    });

    const totalSteps = allSteps.length;
    const completedSteps = allSteps.filter((s) => s.isCompleted).length;
    const overallCompletionRate =
      totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    return {
      overdueStepsCount,
      criticalOverdueStepsCount,
      patientsByStage: stageCounts,
      stepsDueSoonCount: stepsDueSoon,
      overallCompletionRate,
    };
  }

  /**
   * Lista pacientes com etapas críticas, priorizados por urgência
   */
  async getPatientsWithCriticalSteps(
    tenantId: string,
    filters?: {
      journeyStage?: JourneyStage;
      cancerType?: string;
      maxResults?: number;
      /** Quando true, retorna apenas etapas já atrasadas (OVERDUE ou dueDate < now). */
      overdueOnly?: boolean;
    }
  ): Promise<PatientWithCriticalStepDto[]> {
    const now = new Date();
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const overdueOnly = filters?.overdueOnly === true;
    const pendingOrInProgress: ('PENDING' | 'IN_PROGRESS')[] = [
      'PENDING',
      'IN_PROGRESS',
    ];
    const orConditions = overdueOnly
      ? [
          { status: 'OVERDUE' as const },
          {
            status: { in: pendingOrInProgress },
            dueDate: { lte: now },
          },
        ]
      : [
          { status: 'OVERDUE' as const },
          {
            status: { in: pendingOrInProgress },
            dueDate: { lte: now },
          },
          {
            status: { in: pendingOrInProgress },
            dueDate: {
              gte: now,
              lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
            },
          },
        ];

    // Buscar etapas críticas (atrasadas ou, se !overdueOnly, próximas do prazo)
    const criticalSteps = await this.prisma.navigationStep.findMany({
      where: {
        tenantId,
        isCompleted: false,
        isRequired: true,
        ...(filters?.journeyStage && { journeyStage: filters.journeyStage }),
        ...(filters?.cancerType && {
          patient: {
            cancerType: filters.cancerType,
          },
        }),
        OR: orConditions,
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            birthDate: true,
            cancerType: true,
            currentStage: true,
            priorityScore: true,
            priorityCategory: true,
          },
        },
      },
      orderBy: [
        {
          dueDate: 'asc', // Mais atrasadas primeiro
        },
        {
          isRequired: 'desc',
        },
      ],
      take: filters?.maxResults || 50,
    });

    // Agrupar por paciente e pegar a etapa mais crítica de cada um
    const patientMap = new Map<string, PatientWithCriticalStepDto>();

    type StepWithPatient = (typeof criticalSteps)[number] & {
      patient: {
        id: string;
        name: string;
        birthDate: Date | null;
        cancerType: string | null;
        currentStage: string;
        priorityScore: number | null;
        priorityCategory: string | null;
      };
    };

    for (const step of criticalSteps) {
      const patient = (step as StepWithPatient).patient;
      const patientId = patient.id;

      // Calcular dias de atraso
      let daysOverdue: number | null = null;
      if (step.dueDate && new Date(step.dueDate) < now) {
        daysOverdue = Math.floor(
          (now.getTime() - new Date(step.dueDate).getTime()) /
            (1000 * 60 * 60 * 24)
        );
      }

      // Se paciente já está no mapa, verificar se esta etapa é mais crítica
      if (patientMap.has(patientId)) {
        const existing = patientMap.get(patientId);
        // Se esta etapa está mais atrasada, substituir
        if (
          daysOverdue !== null &&
          (existing.criticalStep.daysOverdue === null ||
            daysOverdue > existing.criticalStep.daysOverdue)
        ) {
          existing.criticalStep = {
            id: step.id,
            stepName: step.stepName,
            stepDescription: step.stepDescription,
            journeyStage: step.journeyStage,
            status: step.status,
            isRequired: step.isRequired,
            dueDate: step.dueDate?.toISOString() || null,
            daysOverdue,
            expectedDate: step.expectedDate?.toISOString() || null,
          };
        }
      } else {
        // Calcular idade
        const age = patient.birthDate
          ? new Date().getFullYear() - new Date(patient.birthDate).getFullYear()
          : 0;

        // Contar etapas totais e concluídas do paciente
        const allPatientSteps = await this.prisma.navigationStep.findMany({
          where: {
            tenantId,
            patientId,
          },
          select: {
            isCompleted: true,
          },
        });

        const totalSteps = allPatientSteps.length;
        const completedSteps = allPatientSteps.filter(
          (s) => s.isCompleted
        ).length;
        const completionRate =
          totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

        // Contar alertas de navegação do paciente
        const navigationAlertsCount = await this.prisma.alert.count({
          where: {
            tenantId,
            patientId,
            type: {
              in: [
                'NAVIGATION_DELAY',
                'MISSING_EXAM',
                'STAGING_INCOMPLETE',
                'TREATMENT_DELAY',
                'FOLLOW_UP_OVERDUE',
              ],
            },
            status: {
              in: ['PENDING', 'ACKNOWLEDGED'],
            },
          },
        });

        patientMap.set(patientId, {
          patientId,
          patientName: patient.name,
          patientAge: age,
          cancerType: patient.cancerType,
          currentStage: patient.currentStage,
          priorityScore: patient.priorityScore,
          priorityCategory: patient.priorityCategory,
          criticalStep: {
            id: step.id,
            stepName: step.stepName,
            stepDescription: step.stepDescription,
            journeyStage: step.journeyStage,
            status: step.status,
            isRequired: step.isRequired,
            dueDate: step.dueDate?.toISOString() || null,
            daysOverdue,
            expectedDate: step.expectedDate?.toISOString() || null,
          },
          totalSteps,
          completedSteps,
          completionRate,
          navigationAlertsCount,
        });
      }
    }

    // Converter para array e ordenar por urgência
    const result = Array.from(patientMap.values());

    // Ordenar por:
    // 1. Etapas OVERDUE obrigatórias (>14 dias) primeiro
    // 2. Etapas OVERDUE obrigatórias (≤14 dias)
    // 3. Etapas obrigatórias próximas do prazo (próximas 7 dias)
    // 4. Outras etapas críticas
    result.sort((a, b) => {
      const aDays = a.criticalStep.daysOverdue ?? Infinity;
      const bDays = b.criticalStep.daysOverdue ?? Infinity;

      // Etapas atrasadas primeiro
      if (aDays !== Infinity && bDays === Infinity) {
        return -1;
      }
      if (aDays === Infinity && bDays !== Infinity) {
        return 1;
      }

      // Entre etapas atrasadas, mais dias primeiro
      if (aDays !== Infinity && bDays !== Infinity) {
        return bDays - aDays;
      }

      // Entre etapas não atrasadas, prioridade do paciente
      return b.priorityScore - a.priorityScore;
    });

    return result;
  }

  /**
   * Lista alertas pendentes para drill-down do indicador "Alertas Pendentes".
   * Retorna os alertas (não os pacientes) com dados do paciente para exibição.
   */
  async getPendingAlerts(
    tenantId: string,
    maxResults: number = 100
  ): Promise<PendingAlertDto[]> {
    const take = Math.min(Math.max(1, maxResults), 200);
    const alerts = await this.prisma.alert.findMany({
      where: {
        tenantId,
        status: { not: 'RESOLVED' },
      },
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
      take,
    });
    return alerts.map((a) => ({
      id: a.id,
      type: a.type,
      severity: a.severity,
      message: a.message,
      status: a.status,
      createdAt: a.createdAt.toISOString(),
      patientId: a.patientId,
      patient: {
        id: a.patient.id,
        name: a.patient.name,
        phone: a.patient.phone,
      },
    }));
  }

  /**
   * Lista pacientes filtrados por indicador do dashboard (mensagens não assumidas, biomarcadores pendentes).
   * Para alertas pendentes use getPendingAlerts.
   */
  async getPatientsByIndicator(
    tenantId: string,
    indicator: 'alerts' | 'messages' | 'biomarkers',
    maxResults: number = 100
  ): Promise<
    (Patient & {
      _count: { messages: number; alerts: number; observations: number };
      pendingAlertsCount: number;
    })[]
  > {
    const take = Math.min(Math.max(1, maxResults), 200);
    let patientIds: string[] = [];

    if (indicator === 'alerts') {
      const alerts = await this.prisma.alert.findMany({
        where: {
          tenantId,
          status: { not: 'RESOLVED' },
        },
        select: { patientId: true },
        distinct: ['patientId'],
      });
      patientIds = alerts.map((a) => a.patientId);
    } else if (indicator === 'messages') {
      const messages = await this.prisma.message.findMany({
        where: {
          tenantId,
          direction: 'INBOUND',
          assumedBy: null,
        },
        select: { patientId: true },
        distinct: ['patientId'],
      });
      patientIds = messages.map((m) => m.patientId);
    } else if (indicator === 'biomarkers') {
      const biomarkerStepKeys = [
        'her2_test',
        'egfr_test',
        'pdl1_test',
        'msi_test',
        'kras_test',
        'braf_test',
        'alk_test',
        'biomarker_her2',
        'biomarker_egfr',
        'biomarker_pdl1',
        'biomarker_msi',
        'biomarker_kras',
        'biomarker_braf',
        'biomarker_alk',
      ];
      const steps = await this.prisma.navigationStep.findMany({
        where: {
          tenantId,
          stepKey: { in: biomarkerStepKeys },
          isCompleted: false,
          status: { in: ['PENDING', 'IN_PROGRESS', 'OVERDUE'] },
        },
        select: { patientId: true },
        distinct: ['patientId'],
      });
      patientIds = steps.map((s) => s.patientId);
    }

    if (patientIds.length === 0) {
      return [];
    }

    const patients = await this.prisma.patient.findMany({
      where: {
        id: { in: patientIds },
        tenantId,
      },
      include: {
        _count: {
          select: {
            messages: true,
            alerts: true,
            observations: true,
          },
        },
      },
      orderBy: [
        { priorityScore: 'desc' },
        { createdAt: 'desc' },
      ],
      take,
    });

    const ids = patients.map((p) => p.id);
    const pendingCounts =
      ids.length > 0
        ? await this.prisma.alert.groupBy({
            by: ['patientId'],
            where: {
              patientId: { in: ids },
              tenantId,
              status: 'PENDING',
            },
            _count: { id: true },
          })
        : [];
    const pendingByPatient = new Map(
      pendingCounts.map((r) => [r.patientId, r._count.id])
    );

    return patients.map((p) => ({
      ...p,
      pendingAlertsCount: pendingByPatient.get(p.id) ?? 0,
    }));
  }
}
