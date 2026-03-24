import { JourneyStage, PatientStatus } from '@prisma/client';
import { AlertsService } from '../alerts/alerts.service';
import { PrismaService } from '../prisma/prisma.service';
import { OncologyNavigationService, StepConfig } from './oncology-navigation.service';

type MockPrisma = {
  patient: {
    findFirst: jest.Mock;
    findMany: jest.Mock;
  };
  patientJourney: {
    findUnique: jest.Mock;
  };
  navigationStep: {
    findMany: jest.Mock;
    findFirst: jest.Mock;
    create: jest.Mock;
  };
};

describe('OncologyNavigationService', () => {
  let service: OncologyNavigationService;
  let mockPrisma: MockPrisma;

  beforeEach((): void => {
    mockPrisma = {
      patient: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      patientJourney: {
        findUnique: jest.fn(),
      },
      navigationStep: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
      },
    };

    const mockAlertsService = {} as AlertsService;
    service = new OncologyNavigationService(
      mockPrisma as unknown as PrismaService,
      mockAlertsService,
    );
  });

  it('creates all missing steps when onlyStepKey is omitted (undefined)', async () => {
    mockPrisma.patient.findFirst.mockResolvedValue({
      cancerType: 'breast',
      status: PatientStatus.ACTIVE,
      cancerDiagnoses: [],
    });
    mockPrisma.patientJourney.findUnique.mockResolvedValue({ id: 'journey-1' });
    mockPrisma.navigationStep.findMany.mockResolvedValue([]);
    mockPrisma.navigationStep.create.mockResolvedValue({ id: 'step-created' });

    const stepConfigs: StepConfig[] = [
      {
        journeyStage: JourneyStage.DIAGNOSIS,
        stepKey: 'step-a',
        stepName: 'Step A',
        stepDescription: 'A',
        isRequired: true,
        dependsOnStepKey: null,
        relativeDaysMin: null,
        relativeDaysMax: null,
        stepOrder: 1,
      },
      {
        journeyStage: JourneyStage.DIAGNOSIS,
        stepKey: 'step-b',
        stepName: 'Step B',
        stepDescription: 'B',
        isRequired: true,
        dependsOnStepKey: null,
        relativeDaysMin: null,
        relativeDaysMax: null,
        stepOrder: 2,
      },
    ];

    jest
      .spyOn(
        service as unknown as {
          getStepConfigs: (
            cancerType: string,
            status?: string | null,
            currentStage?: JourneyStage,
          ) => StepConfig[];
        },
        'getStepConfigs',
      )
      .mockReturnValue(stepConfigs);

    const result = await service.createMissingStepsForStage(
      'patient-1',
      'tenant-1',
      JourneyStage.DIAGNOSIS,
    );

    expect(result.created).toBe(2);
    expect(mockPrisma.navigationStep.create).toHaveBeenCalledTimes(2);
  });

  it('creates only the requested step when onlyStepKey is provided', async () => {
    mockPrisma.patient.findFirst.mockResolvedValue({
      cancerType: 'breast',
      status: PatientStatus.ACTIVE,
      cancerDiagnoses: [],
    });
    mockPrisma.patientJourney.findUnique.mockResolvedValue({ id: 'journey-1' });
    mockPrisma.navigationStep.findMany.mockResolvedValue([]);
    mockPrisma.navigationStep.create.mockResolvedValue({ id: 'step-created' });

    const stepConfigs: StepConfig[] = [
      {
        journeyStage: JourneyStage.DIAGNOSIS,
        stepKey: 'step-a',
        stepName: 'Step A',
        stepDescription: 'A',
        isRequired: true,
        dependsOnStepKey: null,
        relativeDaysMin: null,
        relativeDaysMax: null,
        stepOrder: 1,
      },
      {
        journeyStage: JourneyStage.DIAGNOSIS,
        stepKey: 'step-b',
        stepName: 'Step B',
        stepDescription: 'B',
        isRequired: true,
        dependsOnStepKey: null,
        relativeDaysMin: null,
        relativeDaysMax: null,
        stepOrder: 2,
      },
    ];

    jest
      .spyOn(
        service as unknown as {
          getStepConfigs: (
            cancerType: string,
            status?: string | null,
            currentStage?: JourneyStage,
          ) => StepConfig[];
        },
        'getStepConfigs',
      )
      .mockReturnValue(stepConfigs);

    const result = await service.createMissingStepsForStage(
      'patient-1',
      'tenant-1',
      JourneyStage.DIAGNOSIS,
      'step-b',
    );

    expect(result.created).toBe(1);
    expect(mockPrisma.navigationStep.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma.navigationStep.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ stepKey: 'step-b' }),
      }),
    );
  });

  it('reinitializes patients that already have legacy navigation steps', async () => {
    mockPrisma.patient.findMany.mockResolvedValue([
      {
        id: 'patient-legacy',
        cancerType: 'breast',
        currentStage: JourneyStage.DIAGNOSIS,
        cancerDiagnoses: [],
        navigationSteps: [{ id: 'existing-step' }],
      },
    ]);
    mockPrisma.navigationStep.findFirst.mockResolvedValue({ id: 'legacy-step' });

    const initializeSpy = jest
      .spyOn(
        service as unknown as {
          initializeNavigationSteps: (
            patientId: string,
            tenantId: string,
            cancerType: string,
            stage: JourneyStage,
          ) => Promise<void>;
        },
        'initializeNavigationSteps',
      )
      .mockResolvedValue(undefined);

    const result = await service.initializeAllPatientsSteps('tenant-1');

    expect(result).toEqual({ initialized: 1, skipped: 0, errors: 0 });
    expect(initializeSpy).toHaveBeenCalledWith(
      'patient-legacy',
      'tenant-1',
      'breast',
      JourneyStage.DIAGNOSIS,
    );
  });

  it('skips patients that already have non-legacy navigation graph', async () => {
    mockPrisma.patient.findMany.mockResolvedValue([
      {
        id: 'patient-modern',
        cancerType: 'breast',
        currentStage: JourneyStage.DIAGNOSIS,
        cancerDiagnoses: [],
        navigationSteps: [{ id: 'existing-step' }],
      },
    ]);
    mockPrisma.navigationStep.findFirst.mockResolvedValue(null);

    const initializeSpy = jest
      .spyOn(
        service as unknown as {
          initializeNavigationSteps: (
            patientId: string,
            tenantId: string,
            cancerType: string,
            stage: JourneyStage,
          ) => Promise<void>;
        },
        'initializeNavigationSteps',
      )
      .mockResolvedValue(undefined);

    const result = await service.initializeAllPatientsSteps('tenant-1');

    expect(result).toEqual({ initialized: 0, skipped: 1, errors: 0 });
    expect(initializeSpy).not.toHaveBeenCalled();
  });

  it('initializes patients with no existing navigation steps', async () => {
    mockPrisma.patient.findMany.mockResolvedValue([
      {
        id: 'patient-empty',
        cancerType: 'breast',
        currentStage: JourneyStage.SCREENING,
        cancerDiagnoses: [],
        navigationSteps: [],
      },
    ]);

    const initializeSpy = jest
      .spyOn(
        service as unknown as {
          initializeNavigationSteps: (
            patientId: string,
            tenantId: string,
            cancerType: string,
            stage: JourneyStage,
          ) => Promise<void>;
        },
        'initializeNavigationSteps',
      )
      .mockResolvedValue(undefined);

    const result = await service.initializeAllPatientsSteps('tenant-1');

    expect(result).toEqual({ initialized: 1, skipped: 0, errors: 0 });
    expect(initializeSpy).toHaveBeenCalledWith(
      'patient-empty',
      'tenant-1',
      'breast',
      JourneyStage.SCREENING,
    );
  });

  it('returns palliative templates when journeyStage is PALLIATIVE even if patient status is ACTIVE', async () => {
    mockPrisma.patient.findFirst.mockResolvedValue({
      cancerType: 'breast',
      status: PatientStatus.ACTIVE,
      cancerDiagnoses: [],
    });
    mockPrisma.navigationStep.findMany.mockResolvedValue([]);

    const templates = await service.getAvailableStepTemplates(
      'patient-1',
      'tenant-1',
      JourneyStage.PALLIATIVE,
    );

    expect(templates.length).toBeGreaterThan(0);
    expect(templates.map((t) => t.stepKey)).toContain('palliative_comfort_care');
  });

  it('creates missing palliative steps for PALLIATIVE stage even when status is ACTIVE', async () => {
    mockPrisma.patient.findFirst.mockResolvedValue({
      cancerType: 'breast',
      status: PatientStatus.ACTIVE,
      cancerDiagnoses: [],
    });
    mockPrisma.patientJourney.findUnique.mockResolvedValue({ id: 'journey-1' });
    mockPrisma.navigationStep.findMany.mockResolvedValue([]);
    mockPrisma.navigationStep.create.mockResolvedValue({ id: 'step-created' });

    const result = await service.createMissingStepsForStage(
      'patient-1',
      'tenant-1',
      JourneyStage.PALLIATIVE,
    );

    expect(result.created).toBeGreaterThan(0);
    const createdStepKeys = mockPrisma.navigationStep.create.mock.calls.map(
      (args) =>
        (
          args[0] as {
            data: { stepKey: string };
          }
        ).data.stepKey,
    );
    expect(createdStepKeys).toContain('palliative_comfort_care');
  });
});
