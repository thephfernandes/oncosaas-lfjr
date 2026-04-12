import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { QuestionnaireResponsesService } from './questionnaire-responses.service';
import { PrismaService } from '../prisma/prisma.service';
import { PriorityRecalculationService } from '../oncology-navigation/priority-recalculation.service';

describe('QuestionnaireResponsesService', () => {
  let service: QuestionnaireResponsesService;

  const mockPrisma = {
    patient: { findFirst: jest.fn() },
    questionnaire: { findFirst: jest.fn() },
    navigationStep: { findFirst: jest.fn() },
    questionnaireResponse: { create: jest.fn() },
  };

  const mockPriority = { triggerRecalculation: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionnaireResponsesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PriorityRecalculationService, useValue: mockPriority },
      ],
    }).compile();

    service = module.get(QuestionnaireResponsesService);
  });

  describe('create', () => {
    const baseDto = {
      patientId: 'p1',
      questionnaireId: 'q1',
      responses: { a: 1 },
      navigationStepId: 'ns1',
    };

    it('rejects navigationStepId that does not belong to patient', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue({ id: 'p1' });
      mockPrisma.questionnaire.findFirst.mockResolvedValue({ id: 'q1' });
      mockPrisma.navigationStep.findFirst.mockResolvedValue(null);

      await expect(
        service.create(baseDto as any, 't1')
      ).rejects.toThrow(NotFoundException);
      expect(mockPrisma.questionnaireResponse.create).not.toHaveBeenCalled();
    });

    it('creates response when navigationStep exists for patient', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue({ id: 'p1' });
      mockPrisma.questionnaire.findFirst.mockResolvedValue({ id: 'q1' });
      mockPrisma.navigationStep.findFirst.mockResolvedValue({ id: 'ns1' });
      mockPrisma.questionnaireResponse.create.mockResolvedValue({
        id: 'r1',
        navigationStepId: 'ns1',
      });

      await service.create(baseDto as any, 't1');

      expect(mockPrisma.questionnaireResponse.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            navigationStepId: 'ns1',
            patientId: 'p1',
          }),
        })
      );
      expect(mockPriority.triggerRecalculation).toHaveBeenCalledWith(
        'p1',
        't1'
      );
    });
  });
});
