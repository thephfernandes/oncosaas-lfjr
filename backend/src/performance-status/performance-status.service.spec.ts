import { Test, TestingModule } from '@nestjs/testing';
import { PerformanceStatusService } from './performance-status.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  performanceStatusHistory: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  patient: {
    update: jest.fn(),
  },
};

const TENANT = 'tenant-abc';
const PATIENT_ID = 'patient-1';

describe('PerformanceStatusService', () => {
  let service: PerformanceStatusService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PerformanceStatusService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PerformanceStatusService>(PerformanceStatusService);
  });

  // ─── findAll ────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('deve retornar histórico ordenado por data decrescente', async () => {
      const history = [
        { id: '1', ecogScore: 2, assessedAt: new Date('2024-03-01') },
        { id: '2', ecogScore: 1, assessedAt: new Date('2024-01-01') },
      ];
      mockPrisma.performanceStatusHistory.findMany.mockResolvedValue(history);

      const result = await service.findAll(PATIENT_ID, TENANT);

      expect(result).toEqual(history);
      expect(mockPrisma.performanceStatusHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { patientId: PATIENT_ID, tenantId: TENANT },
          orderBy: { assessedAt: 'desc' },
        })
      );
    });
  });

  // ─── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('deve criar entrada no histórico com dados corretos', async () => {
      const dto = { ecogScore: 1, assessedBy: 'dr-1', source: 'MANUAL' as const };
      const entry = { id: 'ps-1', patientId: PATIENT_ID, tenantId: TENANT, ecogScore: 1 };
      mockPrisma.performanceStatusHistory.create.mockResolvedValue(entry);
      mockPrisma.patient.update.mockResolvedValue({});

      const result = await service.create(PATIENT_ID, TENANT, dto);

      expect(result).toEqual(entry);
      expect(mockPrisma.performanceStatusHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            patientId: PATIENT_ID,
            tenantId: TENANT,
            ecogScore: 1,
          }),
        })
      );
    });

    it('deve sincronizar Patient.performanceStatus com o novo valor ECOG', async () => {
      const dto = { ecogScore: 2, assessedBy: 'dr-1' };
      mockPrisma.performanceStatusHistory.create.mockResolvedValue({ id: 'ps-1', ecogScore: 2 });
      mockPrisma.patient.update.mockResolvedValue({});

      await service.create(PATIENT_ID, TENANT, dto);

      expect(mockPrisma.patient.update).toHaveBeenCalledWith({
        where: { id: PATIENT_ID },
        data: { performanceStatus: 2 },
      });
    });

    it('deve usar data atual quando assessedAt não fornecido', async () => {
      const before = new Date();
      mockPrisma.performanceStatusHistory.create.mockResolvedValue({ id: 'ps-1', ecogScore: 0 });
      mockPrisma.patient.update.mockResolvedValue({});

      await service.create(PATIENT_ID, TENANT, { ecogScore: 0 });

      const callData = mockPrisma.performanceStatusHistory.create.mock.calls[0][0].data;
      expect(callData.assessedAt).toBeInstanceOf(Date);
      expect(callData.assessedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });

    it('deve usar source MANUAL como padrão quando não fornecido', async () => {
      mockPrisma.performanceStatusHistory.create.mockResolvedValue({ id: 'ps-1', ecogScore: 1 });
      mockPrisma.patient.update.mockResolvedValue({});

      await service.create(PATIENT_ID, TENANT, { ecogScore: 1 });

      const callData = mockPrisma.performanceStatusHistory.create.mock.calls[0][0].data;
      expect(callData.source).toBe('MANUAL');
    });
  });

  // ─── getDelta ────────────────────────────────────────────────────────────────

  describe('getDelta', () => {
    it('deve retornar null quando há menos de 2 registros', async () => {
      mockPrisma.performanceStatusHistory.findMany.mockResolvedValue([{ ecogScore: 1 }]);

      const result = await service.getDelta(PATIENT_ID, TENANT);

      expect(result).toBeNull();
    });

    it('deve retornar null quando não há registros', async () => {
      mockPrisma.performanceStatusHistory.findMany.mockResolvedValue([]);

      const result = await service.getDelta(PATIENT_ID, TENANT);

      expect(result).toBeNull();
    });

    it('deve retornar delta positivo quando ECOG piorou (0 → 2)', async () => {
      // history[0] = mais recente (2), history[1] = anterior (0)
      mockPrisma.performanceStatusHistory.findMany.mockResolvedValue([
        { ecogScore: 2 },
        { ecogScore: 0 },
      ]);

      const result = await service.getDelta(PATIENT_ID, TENANT);

      expect(result).toBe(2); // 2 - 0 = +2 (piora)
    });

    it('deve retornar delta negativo quando ECOG melhorou (3 → 1)', async () => {
      mockPrisma.performanceStatusHistory.findMany.mockResolvedValue([
        { ecogScore: 1 },
        { ecogScore: 3 },
      ]);

      const result = await service.getDelta(PATIENT_ID, TENANT);

      expect(result).toBe(-2); // 1 - 3 = -2 (melhora)
    });

    it('deve retornar delta 0 quando ECOG não mudou', async () => {
      mockPrisma.performanceStatusHistory.findMany.mockResolvedValue([
        { ecogScore: 2 },
        { ecogScore: 2 },
      ]);

      const result = await service.getDelta(PATIENT_ID, TENANT);

      expect(result).toBe(0);
    });

    it('deve buscar os 2 registros mais recentes escopados pelo tenant', async () => {
      mockPrisma.performanceStatusHistory.findMany.mockResolvedValue([
        { ecogScore: 1 },
        { ecogScore: 0 },
      ]);

      await service.getDelta(PATIENT_ID, TENANT);

      expect(mockPrisma.performanceStatusHistory.findMany).toHaveBeenCalledWith({
        where: { patientId: PATIENT_ID, tenantId: TENANT },
        orderBy: { assessedAt: 'desc' },
        take: 2,
        select: { ecogScore: true },
      });
    });
  });
});
