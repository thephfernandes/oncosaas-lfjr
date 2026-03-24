import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { OncologyNavigationService } from './oncology-navigation.service';
import { PrismaService } from '../prisma/prisma.service';
import { AlertsService } from '../alerts/alerts.service';
import { NavigationStepStatus, JourneyStage } from '@prisma/client';

const mockPrisma = {
  navigationStep: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
  },
  patient: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  patientJourney: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

const mockAlertsService = {
  create: jest.fn(),
};

const TENANT = 'tenant-abc';
const OTHER_TENANT = 'tenant-xyz';
const PATIENT_ID = 'patient-1';
const STEP_ID = 'step-1';

const baseStep = {
  id: STEP_ID,
  patientId: PATIENT_ID,
  tenantId: TENANT,
  journeyStage: JourneyStage.DIAGNOSIS,
  stepKey: 'biopsy',
  stepName: 'Biópsia',
  status: NavigationStepStatus.PENDING,
  isCompleted: false,
  isRequired: true,
  stepOrder: 1,
  dueDate: null,
  expectedDate: null,
  completedAt: null,
  completedBy: null,
  actualDate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('OncologyNavigationService', () => {
  let service: OncologyNavigationService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OncologyNavigationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AlertsService, useValue: mockAlertsService },
      ],
    }).compile();

    service = module.get<OncologyNavigationService>(OncologyNavigationService);
  });

  // ─── getPatientNavigationSteps ───────────────────────────────────────────────

  describe('getPatientNavigationSteps', () => {
    it('deve retornar etapas escopadas pelo tenantId', async () => {
      mockPrisma.navigationStep.findMany.mockResolvedValue([baseStep]);

      const result = await service.getPatientNavigationSteps(PATIENT_ID, TENANT);

      expect(result).toEqual([baseStep]);
      expect(mockPrisma.navigationStep.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { patientId: PATIENT_ID, tenantId: TENANT },
        })
      );
    });

    it('não deve retornar etapas de outro tenant', async () => {
      mockPrisma.navigationStep.findMany.mockResolvedValue([]);

      const result = await service.getPatientNavigationSteps(PATIENT_ID, OTHER_TENANT);

      expect(result).toEqual([]);
      expect(mockPrisma.navigationStep.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { patientId: PATIENT_ID, tenantId: OTHER_TENANT },
        })
      );
    });
  });

  // ─── getStepsByJourneyStage ──────────────────────────────────────────────────

  describe('getStepsByJourneyStage', () => {
    it('deve filtrar por journeyStage e tenantId', async () => {
      mockPrisma.navigationStep.findMany.mockResolvedValue([baseStep]);

      await service.getStepsByJourneyStage(PATIENT_ID, TENANT, JourneyStage.DIAGNOSIS);

      expect(mockPrisma.navigationStep.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { patientId: PATIENT_ID, tenantId: TENANT, journeyStage: JourneyStage.DIAGNOSIS },
        })
      );
    });
  });

  // ─── getStepById ─────────────────────────────────────────────────────────────

  describe('getStepById', () => {
    it('deve lançar NotFoundException quando etapa não encontrada', async () => {
      mockPrisma.navigationStep.findFirst.mockResolvedValue(null);

      await expect(service.getStepById(STEP_ID, TENANT)).rejects.toThrow(NotFoundException);
    });

    it('deve lançar NotFoundException para etapa de outro tenant', async () => {
      mockPrisma.navigationStep.findFirst.mockResolvedValue(null);

      await expect(service.getStepById(STEP_ID, OTHER_TENANT)).rejects.toThrow(NotFoundException);

      expect(mockPrisma.navigationStep.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: STEP_ID, tenantId: OTHER_TENANT } })
      );
    });

    it('deve retornar etapa quando tenant corresponde', async () => {
      mockPrisma.navigationStep.findFirst.mockResolvedValue(baseStep);

      const result = await service.getStepById(STEP_ID, TENANT);

      expect(result.id).toBe(STEP_ID);
    });
  });

  // ─── createStep ──────────────────────────────────────────────────────────────

  describe('createStep', () => {
    const createDto = {
      patientId: PATIENT_ID,
      journeyStage: JourneyStage.DIAGNOSIS,
      stepKey: 'biopsy',
      stepName: 'Biópsia',
      cancerType: 'bladder',
    };

    it('deve lançar NotFoundException quando paciente não pertence ao tenant', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(null);

      await expect(service.createStep(createDto as any, TENANT)).rejects.toThrow(NotFoundException);

      expect(mockPrisma.navigationStep.create).not.toHaveBeenCalled();
    });

    it('deve criar etapa com status PENDING e isCompleted = false', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue({ id: PATIENT_ID });
      mockPrisma.patientJourney.findUnique.mockResolvedValue(null);
      mockPrisma.navigationStep.create.mockResolvedValue(baseStep);

      await service.createStep(createDto as any, TENANT);

      expect(mockPrisma.navigationStep.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: NavigationStepStatus.PENDING,
            isCompleted: false,
            tenantId: TENANT,
          }),
        })
      );
    });

    it('deve verificar que o paciente pertence ao tenant correto', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(null); // não existe para OTHER_TENANT

      await expect(service.createStep(createDto as any, OTHER_TENANT)).rejects.toThrow(NotFoundException);

      expect(mockPrisma.patient.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: PATIENT_ID, tenantId: OTHER_TENANT },
        })
      );
    });
  });

  // ─── updateStep ──────────────────────────────────────────────────────────────

  describe('updateStep', () => {
    it('deve lançar NotFoundException quando etapa não existe no tenant', async () => {
      mockPrisma.navigationStep.findFirst.mockResolvedValue(null);

      await expect(
        service.updateStep(STEP_ID, { isCompleted: true }, TENANT)
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.navigationStep.update).not.toHaveBeenCalled();
    });

    it('deve marcar status COMPLETED ao marcar isCompleted = true', async () => {
      const now = new Date();
      const updatedStep = {
        ...baseStep,
        isCompleted: true,
        status: NavigationStepStatus.COMPLETED,
        completedAt: now,
        actualDate: now,
      };
      mockPrisma.navigationStep.findFirst.mockResolvedValue(baseStep);
      mockPrisma.navigationStep.update.mockResolvedValue(updatedStep);
      // cascade: sem etapas dependentes
      mockPrisma.navigationStep.findMany.mockResolvedValue([]);

      await service.updateStep(STEP_ID, { isCompleted: true, completedAt: now.toISOString() }, TENANT);

      const callData = mockPrisma.navigationStep.update.mock.calls[0][0].data;
      expect(callData.status).toBe(NavigationStepStatus.COMPLETED);
    });

    it('deve marcar status PENDING ao desmarcar isCompleted (reverter conclusão)', async () => {
      const now = new Date();
      const completedStep = {
        ...baseStep,
        isCompleted: true,
        status: NavigationStepStatus.COMPLETED,
        completedAt: now,
        actualDate: now,
      };
      const pendingStep = {
        ...completedStep,
        isCompleted: false,
        status: NavigationStepStatus.PENDING,
        completedAt: null,
        actualDate: null,
      };
      mockPrisma.navigationStep.findFirst.mockResolvedValue(completedStep);
      mockPrisma.navigationStep.update.mockResolvedValue(pendingStep);
      mockPrisma.navigationStep.findMany.mockResolvedValue([]);

      await service.updateStep(STEP_ID, { isCompleted: false }, TENANT);

      const callData = mockPrisma.navigationStep.update.mock.calls[0][0].data;
      expect(callData.status).toBe(NavigationStepStatus.PENDING);
    });
  });
});
