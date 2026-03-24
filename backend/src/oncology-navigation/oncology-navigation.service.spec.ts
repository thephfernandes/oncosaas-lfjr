import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OncologyNavigationService } from './oncology-navigation.service';
import { PrismaService } from '../prisma/prisma.service';
import { AlertsService } from '../alerts/alerts.service';
import { JourneyStage, NavigationStepStatus, PatientStatus } from '@prisma/client';

const mockPrisma = {
  patient: { findFirst: jest.fn() },
  navigationStep: {
    findMany: jest.fn(),
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
  },
  patientJourney: { findUnique: jest.fn() },
  alert: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
};

const mockAlertsService = {
  createOverdueStepAlert: jest.fn(),
};

const TENANT = 'tenant-abc';
const OTHER_TENANT = 'tenant-xyz';
const PATIENT_ID = 'patient-uuid-1';
const JOURNEY_ID = 'journey-uuid-1';

const basePatient = {
  cancerType: 'bladder',
  status: PatientStatus.ACTIVE,
  cancerDiagnoses: [],
};

const baseJourney = { id: JOURNEY_ID };

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

  // ─── getAvailableStepTemplates ───────────────────────────────────────────────

  describe('getAvailableStepTemplates', () => {
    it('should throw NotFoundException when patient does not exist', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(null);

      await expect(
        service.getAvailableStepTemplates(PATIENT_ID, TENANT, JourneyStage.TREATMENT)
      ).rejects.toThrow(NotFoundException);
    });

    it('should not find patient outside tenant scope', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(null);

      await expect(
        service.getAvailableStepTemplates(PATIENT_ID, OTHER_TENANT, JourneyStage.TREATMENT)
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.patient.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: OTHER_TENANT }),
        })
      );
    });

    it('should throw BadRequestException when patient has no cancer type', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue({
        cancerType: null,
        status: PatientStatus.ACTIVE,
        cancerDiagnoses: [],
      });

      await expect(
        service.getAvailableStepTemplates(PATIENT_ID, TENANT, JourneyStage.TREATMENT)
      ).rejects.toThrow(BadRequestException);
    });

    it('should return templates with existingCount = 0 when no steps exist', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(basePatient);
      mockPrisma.navigationStep.findMany.mockResolvedValue([]);

      const templates = await service.getAvailableStepTemplates(
        PATIENT_ID,
        TENANT,
        JourneyStage.TREATMENT
      );

      expect(templates).toBeInstanceOf(Array);
      expect(templates.length).toBeGreaterThan(0);
      expect(templates[0]).toHaveProperty('stepKey');
      expect(templates[0]).toHaveProperty('stepName');
      expect(templates[0]).toHaveProperty('existingCount', 0);
      for (const t of templates) {
        expect(t.journeyStage).toBe(JourneyStage.TREATMENT);
      }
    });

    it('should count existing instances correctly for base key', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(basePatient);
      // transurethral_resection is a DIAGNOSIS step for bladder cancer
      // Simulate 2 existing steps: one base + one suffixed
      mockPrisma.navigationStep.findMany.mockResolvedValue([
        { stepKey: 'transurethral_resection' },
        { stepKey: 'transurethral_resection-2' },
      ]);

      const templates = await service.getAvailableStepTemplates(
        PATIENT_ID,
        TENANT,
        JourneyStage.DIAGNOSIS
      );

      const rtu = templates.find((t) => t.stepKey === 'transurethral_resection');
      expect(rtu).toBeDefined();
      expect(rtu!.existingCount).toBe(2);
    });

    it('should only return templates for the requested journeyStage', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(basePatient);
      mockPrisma.navigationStep.findMany.mockResolvedValue([]);

      const templates = await service.getAvailableStepTemplates(
        PATIENT_ID,
        TENANT,
        JourneyStage.DIAGNOSIS
      );

      for (const t of templates) {
        expect(t.journeyStage).toBe(JourneyStage.DIAGNOSIS);
      }
    });

    it('should use cancerType from cancerDiagnoses when patient.cancerType is null', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue({
        cancerType: null,
        status: PatientStatus.ACTIVE,
        cancerDiagnoses: [{ cancerType: 'BLADDER' }],
      });
      mockPrisma.navigationStep.findMany.mockResolvedValue([]);

      const templates = await service.getAvailableStepTemplates(
        PATIENT_ID,
        TENANT,
        JourneyStage.TREATMENT
      );

      expect(templates.length).toBeGreaterThan(0);
    });
  });

  // ─── createStepFromTemplate ──────────────────────────────────────────────────

  describe('createStepFromTemplate', () => {
    it('should throw NotFoundException when patient does not exist', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(null);

      await expect(
        service.createStepFromTemplate(
          PATIENT_ID,
          TENANT,
          JourneyStage.TREATMENT,
          'transurethral_resection'
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('should not create step for patient outside tenant scope', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(null);

      await expect(
        service.createStepFromTemplate(
          PATIENT_ID,
          OTHER_TENANT,
          JourneyStage.TREATMENT,
          'transurethral_resection'
        )
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.patient.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: OTHER_TENANT }),
        })
      );
    });

    it('should throw NotFoundException when template stepKey does not exist', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(basePatient);
      mockPrisma.navigationStep.findMany.mockResolvedValue([]);

      await expect(
        service.createStepFromTemplate(
          PATIENT_ID,
          TENANT,
          JourneyStage.TREATMENT,
          'nonexistent_step_key'
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('should create first instance with base stepKey when none exists', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(basePatient);
      mockPrisma.navigationStep.findMany.mockResolvedValue([]);
      mockPrisma.patientJourney.findUnique.mockResolvedValue(baseJourney);

      // intravesical_bcg is a valid TREATMENT step for bladder cancer
      const createdStep = {
        id: 'step-uuid-1',
        stepKey: 'intravesical_bcg',
        stepName: 'BCG Intravesical',
        journeyStage: JourneyStage.TREATMENT,
        tenantId: TENANT,
        patientId: PATIENT_ID,
        status: NavigationStepStatus.PENDING,
        isCompleted: false,
        dueDate: null,
        expectedDate: null,
      };
      mockPrisma.navigationStep.create.mockResolvedValue(createdStep);

      const result = await service.createStepFromTemplate(
        PATIENT_ID,
        TENANT,
        JourneyStage.TREATMENT,
        'intravesical_bcg'
      );

      expect(result.stepKey).toBe('intravesical_bcg');
      expect(mockPrisma.navigationStep.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            stepKey: 'intravesical_bcg',
            tenantId: TENANT,
            patientId: PATIENT_ID,
          }),
        })
      );
    });

    it('should create second instance with -2 suffix when one already exists', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(basePatient);
      // One existing instance
      mockPrisma.navigationStep.findMany.mockResolvedValue([
        { stepKey: 'intravesical_bcg' },
      ]);
      mockPrisma.patientJourney.findUnique.mockResolvedValue(baseJourney);

      const createdStep = {
        id: 'step-uuid-2',
        stepKey: 'intravesical_bcg-2',
        journeyStage: JourneyStage.TREATMENT,
        tenantId: TENANT,
        patientId: PATIENT_ID,
        status: NavigationStepStatus.PENDING,
        isCompleted: false,
        dueDate: null,
        expectedDate: null,
      };
      mockPrisma.navigationStep.create.mockResolvedValue(createdStep);

      const result = await service.createStepFromTemplate(
        PATIENT_ID,
        TENANT,
        JourneyStage.TREATMENT,
        'intravesical_bcg'
      );

      expect(result.stepKey).toBe('intravesical_bcg-2');
      expect(mockPrisma.navigationStep.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            stepKey: 'intravesical_bcg-2',
          }),
        })
      );
    });

    it('should create third instance with -3 suffix when two already exist', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(basePatient);
      // Two existing instances
      mockPrisma.navigationStep.findMany.mockResolvedValue([
        { stepKey: 'intravesical_bcg' },
        { stepKey: 'intravesical_bcg-2' },
      ]);
      mockPrisma.patientJourney.findUnique.mockResolvedValue(baseJourney);

      const createdStep = {
        id: 'step-uuid-3',
        stepKey: 'intravesical_bcg-3',
        journeyStage: JourneyStage.TREATMENT,
        tenantId: TENANT,
        patientId: PATIENT_ID,
        status: NavigationStepStatus.PENDING,
        isCompleted: false,
        dueDate: null,
        expectedDate: null,
      };
      mockPrisma.navigationStep.create.mockResolvedValue(createdStep);

      const result = await service.createStepFromTemplate(
        PATIENT_ID,
        TENANT,
        JourneyStage.TREATMENT,
        'intravesical_bcg'
      );

      expect(result.stepKey).toBe('intravesical_bcg-3');
    });

    it('should create step with PENDING status and no dueDate', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(basePatient);
      mockPrisma.navigationStep.findMany.mockResolvedValue([]);
      mockPrisma.patientJourney.findUnique.mockResolvedValue(baseJourney);

      const createdStep = {
        id: 'step-uuid-1',
        stepKey: 'intravesical_bcg',
        status: NavigationStepStatus.PENDING,
        isCompleted: false,
        dueDate: null,
        expectedDate: null,
      };
      mockPrisma.navigationStep.create.mockResolvedValue(createdStep);

      const result = await service.createStepFromTemplate(
        PATIENT_ID,
        TENANT,
        JourneyStage.TREATMENT,
        'intravesical_bcg'
      );

      expect(result.status).toBe(NavigationStepStatus.PENDING);
      expect(result.isCompleted).toBe(false);
      expect(result.dueDate).toBeNull();
      expect(mockPrisma.navigationStep.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: NavigationStepStatus.PENDING,
            isCompleted: false,
            expectedDate: null,
            dueDate: null,
          }),
        })
      );
    });
  });

  // ─── createMissingStepsForStage ──────────────────────────────────────────────

  describe('createMissingStepsForStage', () => {
    it('should throw NotFoundException when patient does not exist', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(null);

      await expect(
        service.createMissingStepsForStage(PATIENT_ID, TENANT, JourneyStage.TREATMENT)
      ).rejects.toThrow(NotFoundException);
    });

    it('should not process patient outside tenant scope', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(null);

      await expect(
        service.createMissingStepsForStage(PATIENT_ID, OTHER_TENANT, JourneyStage.TREATMENT)
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.patient.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: OTHER_TENANT }),
        })
      );
    });

    it('should throw BadRequestException when patient has no cancer type', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue({
        cancerType: null,
        status: PatientStatus.ACTIVE,
        cancerDiagnoses: [],
      });

      await expect(
        service.createMissingStepsForStage(PATIENT_ID, TENANT, JourneyStage.TREATMENT)
      ).rejects.toThrow(BadRequestException);
    });

    it('should return { created: 0, skipped: N } when all steps already exist', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(basePatient);

      // Bladder cancer TREATMENT has exactly 4 steps:
      // intravesical_bcg, radical_cystectomy, neobladder_or_urostomy, chemotherapy
      mockPrisma.navigationStep.findMany.mockResolvedValue([
        { stepKey: 'intravesical_bcg' },
        { stepKey: 'radical_cystectomy' },
        { stepKey: 'neobladder_or_urostomy' },
        { stepKey: 'chemotherapy' },
      ]);

      const result = await service.createMissingStepsForStage(
        PATIENT_ID,
        TENANT,
        JourneyStage.TREATMENT
      );

      expect(result.created).toBe(0);
      expect(result.skipped).toBe(4);
      expect(mockPrisma.navigationStep.create).not.toHaveBeenCalled();
    });

    it('should only create steps that are missing', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(basePatient);
      mockPrisma.patientJourney.findUnique.mockResolvedValue(baseJourney);

      // Only one TREATMENT step exists
      mockPrisma.navigationStep.findMany.mockResolvedValue([
        { stepKey: 'transurethral_resection' },
      ]);

      mockPrisma.navigationStep.create.mockResolvedValue({
        id: 'new-step',
        stepKey: 'adjuvant_intravesical_therapy',
        dueDate: null,
        isCompleted: false,
      });

      const result = await service.createMissingStepsForStage(
        PATIENT_ID,
        TENANT,
        JourneyStage.TREATMENT
      );

      expect(result.created).toBeGreaterThan(0);
      expect(result.skipped).toBe(1);

      // Verify it did NOT attempt to create transurethral_resection again
      const createCalls = mockPrisma.navigationStep.create.mock.calls;
      const createdKeys = createCalls.map((call: any) => call[0].data.stepKey as string);
      expect(createdKeys).not.toContain('transurethral_resection');
    });

    it('should not treat suffixed key as equivalent to base key (e.g. intravesical_bcg-2 should not block intravesical_bcg)', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(basePatient);
      mockPrisma.patientJourney.findUnique.mockResolvedValue(baseJourney);

      // Only a suffixed version exists, NOT the base key
      mockPrisma.navigationStep.findMany.mockResolvedValue([
        { stepKey: 'intravesical_bcg-2' },
      ]);

      mockPrisma.navigationStep.create.mockResolvedValue({
        id: 'new-step',
        stepKey: 'intravesical_bcg',
        dueDate: null,
        isCompleted: false,
      });

      const result = await service.createMissingStepsForStage(
        PATIENT_ID,
        TENANT,
        JourneyStage.TREATMENT
      );

      // intravesical_bcg-2 has key 'intravesical_bcg-2', not 'intravesical_bcg',
      // so the base key should be considered missing and created
      const createCalls = mockPrisma.navigationStep.create.mock.calls;
      const createdKeys = createCalls.map((call: any) => call[0].data.stepKey as string);
      expect(createdKeys).toContain('intravesical_bcg');
      expect(result.created).toBeGreaterThan(0);
    });

    it('should return correct counts when all steps are missing', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(basePatient);
      mockPrisma.patientJourney.findUnique.mockResolvedValue(baseJourney);
      mockPrisma.navigationStep.findMany.mockResolvedValue([]);

      mockPrisma.navigationStep.create.mockResolvedValue({
        id: 'new-step',
        stepKey: 'any',
        dueDate: null,
        isCompleted: false,
      });

      const result = await service.createMissingStepsForStage(
        PATIENT_ID,
        TENANT,
        JourneyStage.TREATMENT
      );

      expect(result.created).toBeGreaterThan(0);
      expect(result.skipped).toBe(0);
    });
  });
});
