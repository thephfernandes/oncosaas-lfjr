import { JourneyStage } from '@generated/prisma/client';
import { resolveNavigationStepIdForAgentQuestionnaire } from './questionnaire-navigation.helper';
import { PrismaService } from '../prisma/prisma.service';

describe('resolveNavigationStepIdForAgentQuestionnaire', () => {
  const mockPrisma = {
    patient: { findFirst: jest.fn() },
    navigationStep: { findFirst: jest.fn() },
  } as unknown as PrismaService;

  beforeEach(() => {
    jest.clearAllMocks();
    (mockPrisma as any).patient.findFirst.mockReset();
    (mockPrisma as any).navigationStep.findFirst.mockReset();
  });

  it('returns undefined when patient not found', async () => {
    (mockPrisma as any).patient.findFirst.mockResolvedValue(null);

    const id = await resolveNavigationStepIdForAgentQuestionnaire(
      mockPrisma,
      't1',
      'p1'
    );

    expect(id).toBeUndefined();
    expect((mockPrisma as any).navigationStep.findFirst).not.toHaveBeenCalled();
  });

  it('prefers navigation_consultation in current journey stage', async () => {
    (mockPrisma as any).patient.findFirst.mockResolvedValue({
      currentStage: JourneyStage.TREATMENT,
    });
    (mockPrisma as any).navigationStep.findFirst.mockResolvedValueOnce({
      id: 'ns-treat',
    });

    const id = await resolveNavigationStepIdForAgentQuestionnaire(
      mockPrisma,
      't1',
      'p1'
    );

    expect(id).toBe('ns-treat');
    expect((mockPrisma as any).navigationStep.findFirst).toHaveBeenCalledTimes(1);
  });

  it('falls back to any navigation_consultation for patient', async () => {
    (mockPrisma as any).patient.findFirst.mockResolvedValue({
      currentStage: JourneyStage.TREATMENT,
    });
    (mockPrisma as any).navigationStep.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'ns-fallback' });

    const id = await resolveNavigationStepIdForAgentQuestionnaire(
      mockPrisma,
      't1',
      'p1'
    );

    expect(id).toBe('ns-fallback');
    expect((mockPrisma as any).navigationStep.findFirst).toHaveBeenCalledTimes(2);
  });
});
