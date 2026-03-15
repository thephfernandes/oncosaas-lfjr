import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';

const createMockPrisma = () => ({
  patient: {
    count: jest.fn(),
    findMany: jest.fn(),
    groupBy: jest.fn(),
  },
  alert: {
    count: jest.fn(),
    findMany: jest.fn(),
    groupBy: jest.fn(),
  },
  message: {
    count: jest.fn(),
  },
  navigationStep: {
    count: jest.fn(),
    findMany: jest.fn(),
  },
  patientJourney: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
});

/**
 * Helper: configura mocks padrão para getMetrics com banco "vazio".
 * Cada teste pode sobrescrever mocks específicos ANTES de chamar getMetrics.
 */
function setupDefaultMocks(mockPrisma: ReturnType<typeof createMockPrisma>) {
  mockPrisma.patient.count.mockResolvedValue(0);
  mockPrisma.alert.groupBy.mockResolvedValue([]);
  mockPrisma.message.count.mockResolvedValue(0);
  mockPrisma.alert.findMany.mockResolvedValue([]);
  mockPrisma.patient.groupBy.mockResolvedValue([]);
  mockPrisma.navigationStep.count.mockResolvedValue(0);
  mockPrisma.patientJourney.findMany.mockResolvedValue([]);
  mockPrisma.patient.findMany.mockResolvedValue([]);
  mockPrisma.navigationStep.findMany.mockResolvedValue([]);
}

describe('DashboardService', () => {
  let service: DashboardService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma = createMockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  describe('getMetrics', () => {
    it('deve retornar totalActivePatients corretamente (3 de 5 pacientes ativos)', async () => {
      setupDefaultMocks(mockPrisma);
      mockPrisma.patient.count
        .mockResolvedValueOnce(3) // totalActivePatients
        .mockResolvedValueOnce(2); // criticalPatientsCount

      const result = await service.getMetrics('tenant-1');

      expect(result.totalActivePatients).toBe(3);
      expect(mockPrisma.patient.count).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant-1',
          status: { in: ['ACTIVE', 'IN_TREATMENT', 'FOLLOW_UP'] },
        },
      });
    });

    it('deve retornar criticalPatientsCount corretamente (2 com score >= 75)', async () => {
      setupDefaultMocks(mockPrisma);
      mockPrisma.patient.count
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(2);

      const result = await service.getMetrics('tenant-1');

      expect(result.criticalPatientsCount).toBe(2);
    });

    it('deve calcular totalPendingAlerts e criticalAlertsCount corretamente', async () => {
      setupDefaultMocks(mockPrisma);
      mockPrisma.patient.count
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(1);
      mockPrisma.alert.groupBy.mockResolvedValueOnce([
        { severity: 'CRITICAL', _count: 2 },
        { severity: 'HIGH', _count: 1 },
      ]);

      const result = await service.getMetrics('tenant-1');

      expect(result.totalPendingAlerts).toBe(3);
      expect(result.criticalAlertsCount).toBe(2);
      expect(result.highAlertsCount).toBe(1);
    });

    it('deve retornar unassumedMessagesCount corretamente (2 de 4 INBOUND)', async () => {
      setupDefaultMocks(mockPrisma);
      mockPrisma.patient.count
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(1);
      mockPrisma.message.count.mockResolvedValueOnce(2);

      const result = await service.getMetrics('tenant-1');

      expect(result.unassumedMessagesCount).toBe(2);
    });

    it('deve calcular averageResponseTimeMinutes corretamente (60 e 120 min → 90)', async () => {
      const now = new Date();
      const resolved1 = new Date(now.getTime() - 60 * 60 * 1000);
      const resolved2 = new Date(now.getTime() - 120 * 60 * 1000);

      setupDefaultMocks(mockPrisma);
      mockPrisma.patient.count
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(1);
      mockPrisma.alert.findMany.mockResolvedValueOnce([
        { createdAt: resolved1, resolvedAt: now },
        { createdAt: resolved2, resolvedAt: now },
      ]);

      const result = await service.getMetrics('tenant-1');

      expect(result.averageResponseTimeMinutes).toBe(90);
    });

    it('deve retornar null para averageResponseTimeMinutes quando não há alertas resolvidos', async () => {
      setupDefaultMocks(mockPrisma);
      mockPrisma.patient.count
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(1);

      const result = await service.getMetrics('tenant-1');

      expect(result.averageResponseTimeMinutes).toBeNull();
    });

    it('deve retornar overdueStepsCount corretamente (3 etapas OVERDUE)', async () => {
      setupDefaultMocks(mockPrisma);
      mockPrisma.patient.count
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(1);
      mockPrisma.navigationStep.count.mockResolvedValueOnce(3);

      const result = await service.getMetrics('tenant-1');

      expect(result.overdueStepsCount).toBe(3);
    });

    it('deve calcular averageTimeToTreatmentDays corretamente (25 e 35 dias → 30)', async () => {
      const baseDate = new Date('2024-01-01');
      const diag1 = new Date(baseDate);
      const treat1 = new Date(baseDate.getTime() + 25 * 24 * 60 * 60 * 1000);
      const diag2 = new Date(baseDate);
      const treat2 = new Date(baseDate.getTime() + 35 * 24 * 60 * 60 * 1000);

      setupDefaultMocks(mockPrisma);
      mockPrisma.patient.count
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(1);
      mockPrisma.patientJourney.findMany
        .mockResolvedValueOnce([
          { diagnosisDate: diag1, treatmentStartDate: treat1 },
          { diagnosisDate: diag2, treatmentStartDate: treat2 },
        ])
        .mockResolvedValueOnce([]);

      const result = await service.getMetrics('tenant-1');

      expect(result.averageTimeToTreatmentDays).toBe(30);
    });

    it('deve retornar null para averageTimeToTreatmentDays quando não há journeys com tratamento', async () => {
      setupDefaultMocks(mockPrisma);
      mockPrisma.patient.count
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(1);

      const result = await service.getMetrics('tenant-1');

      expect(result.averageTimeToTreatmentDays).toBeNull();
    });

    it('deve retornar pendingBiomarkersCount (2 pacientes distintos)', async () => {
      setupDefaultMocks(mockPrisma);
      mockPrisma.patient.count
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(1);
      mockPrisma.navigationStep.findMany.mockResolvedValueOnce([
        { patientId: 'p1' },
        { patientId: 'p2' },
      ]);

      const result = await service.getMetrics('tenant-1');

      expect(result.pendingBiomarkersCount).toBe(2);
    });

    it('deve calcular treatmentAdherencePercentage - apenas elegíveis (10/12 e 2/12, um completou)', async () => {
      setupDefaultMocks(mockPrisma);
      mockPrisma.patient.count
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(1);
      mockPrisma.patientJourney.findMany
        .mockResolvedValueOnce([]) // time-to-treatment
        .mockResolvedValueOnce([
          { currentCycle: 10, totalCycles: 12 },
          { currentCycle: 2, totalCycles: 12 },
          { currentCycle: 12, totalCycles: 12 },
        ]);

      const result = await service.getMetrics('tenant-1');

      expect(result.treatmentAdherencePercentage).toBe(50);
    });

    it('deve retornar priorityDistribution com valores corretos', async () => {
      setupDefaultMocks(mockPrisma);
      mockPrisma.patient.count
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(2);
      mockPrisma.patient.groupBy.mockResolvedValueOnce([
        { priorityCategory: 'CRITICAL', _count: 2 },
        { priorityCategory: 'HIGH', _count: 1 },
        { priorityCategory: 'MEDIUM', _count: 2 },
      ]);

      const result = await service.getMetrics('tenant-1');

      expect(result.priorityDistribution).toEqual({
        critical: 2,
        high: 1,
        medium: 2,
        low: 0,
      });
    });

    it('deve retornar todas as contagens zeradas quando banco vazio', async () => {
      setupDefaultMocks(mockPrisma);

      const result = await service.getMetrics('tenant-1');

      expect(result.totalActivePatients).toBe(0);
      expect(result.criticalPatientsCount).toBe(0);
      expect(result.totalPendingAlerts).toBe(0);
      expect(result.unassumedMessagesCount).toBe(0);
      expect(result.averageResponseTimeMinutes).toBeNull();
      expect(result.overdueStepsCount).toBe(0);
      expect(result.averageTimeToTreatmentDays).toBeNull();
      expect(result.pendingBiomarkersCount).toBe(0);
      expect(result.treatmentAdherencePercentage).toBe(0);
      expect(result.priorityDistribution).toEqual({
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      });
    });
  });
});
