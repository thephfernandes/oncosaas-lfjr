import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ComplementaryExamsService } from './complementary-exams.service';
import { PrismaService } from '../prisma/prisma.service';
import { PriorityRecalculationService } from '../oncology-navigation/priority-recalculation.service';

const mockPrisma = {
  patient: {
    findFirst: jest.fn(),
  },
  complementaryExam: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  complementaryExamResult: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

const mockPriorityRecalc = {
  triggerRecalculation: jest.fn(),
};

describe('ComplementaryExamsService', () => {
  let service: ComplementaryExamsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComplementaryExamsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PriorityRecalculationService, useValue: mockPriorityRecalc },
      ],
    }).compile();

    service = module.get<ComplementaryExamsService>(ComplementaryExamsService);
  });

  it('should filter out deleted results when listing exams by patient', async () => {
    mockPrisma.patient.findFirst.mockResolvedValue({ id: 'patient-1' });
    mockPrisma.complementaryExam.findMany.mockResolvedValue([]);

    await service.findAllByPatient('patient-1', 'tenant-1');

    expect(mockPrisma.complementaryExam.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: {
          results: expect.objectContaining({
            where: { deletedAt: null },
          }),
        },
      }),
    );
  });

  it('should not return deleted results by default in findResults', async () => {
    mockPrisma.patient.findFirst.mockResolvedValue({ id: 'patient-1' });
    mockPrisma.complementaryExam.findFirst.mockResolvedValue({ id: 'exam-1' });
    mockPrisma.complementaryExamResult.findMany.mockResolvedValue([]);

    await service.findResults('patient-1', 'exam-1', 'tenant-1');

    expect(mockPrisma.complementaryExamResult.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ deletedAt: null }),
      }),
    );
  });

  it('should include deleted results when includeDeleted=true', async () => {
    mockPrisma.patient.findFirst.mockResolvedValue({ id: 'patient-1' });
    mockPrisma.complementaryExam.findFirst.mockResolvedValue({ id: 'exam-1' });
    mockPrisma.complementaryExamResult.findMany.mockResolvedValue([]);

    await service.findResults('patient-1', 'exam-1', 'tenant-1', true);

    expect(mockPrisma.complementaryExamResult.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { examId: 'exam-1', tenantId: 'tenant-1' },
      }),
    );
  });

  it('should soft delete a result (set deletedAt/deletedByUserId/deleteReason)', async () => {
    mockPrisma.patient.findFirst.mockResolvedValue({ id: 'patient-1' });
    mockPrisma.complementaryExam.findFirst.mockResolvedValue({ id: 'exam-1' });
    mockPrisma.complementaryExamResult.findFirst.mockResolvedValue({
      id: 'result-1',
      deletedAt: null,
    });
    mockPrisma.complementaryExamResult.update.mockResolvedValue({ id: 'result-1' });

    await service.removeResult('patient-1', 'exam-1', 'result-1', 'tenant-1', {
      reason: 'duplicado',
      deletedByUserId: 'user-1',
    });

    expect(mockPrisma.complementaryExamResult.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'result-1', tenantId: 'tenant-1' },
        data: expect.objectContaining({
          deletedAt: expect.any(Date),
          deletedByUserId: 'user-1',
          deleteReason: 'duplicado',
        }),
      }),
    );
  });

  it('should throw NotFound when trying to soft delete a non-existing/non-visible result', async () => {
    mockPrisma.patient.findFirst.mockResolvedValue({ id: 'patient-1' });
    mockPrisma.complementaryExam.findFirst.mockResolvedValue({ id: 'exam-1' });
    mockPrisma.complementaryExamResult.findFirst.mockResolvedValue(null);

    await expect(
      service.removeResult('patient-1', 'exam-1', 'result-1', 'tenant-1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('should restore a result (clear deleted fields)', async () => {
    mockPrisma.patient.findFirst.mockResolvedValue({ id: 'patient-1' });
    mockPrisma.complementaryExam.findFirst.mockResolvedValue({ id: 'exam-1' });
    mockPrisma.complementaryExamResult.findFirst.mockResolvedValue({ id: 'result-1' });
    mockPrisma.complementaryExamResult.update.mockResolvedValue({ id: 'result-1' });

    await service.restoreResult('patient-1', 'exam-1', 'result-1', 'tenant-1');

    expect(mockPrisma.complementaryExamResult.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'result-1', tenantId: 'tenant-1' },
        data: {
          deletedAt: null,
          deletedByUserId: null,
          deleteReason: null,
        },
      }),
    );
  });
});

