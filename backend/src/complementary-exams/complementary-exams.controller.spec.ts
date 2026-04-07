import { ComplementaryExamsController } from './complementary-exams.controller';
import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@generated/prisma/client';

describe('ComplementaryExamsController', () => {
  it('should forbid includeDeleted results for non-admin', () => {
    const service = {
      findResults: jest.fn(),
    } as any;
    const controller = new ComplementaryExamsController(service);

    expect(() =>
      controller.findResults(
        'patient-1' as any,
        'exam-1' as any,
        { user: { tenantId: 'tenant-1', role: UserRole.DOCTOR } } as any,
        'true',
      ),
    ).toThrow(ForbiddenException);
  });

  it('should allow includeDeleted results for admin', () => {
    const service = {
      findResults: jest.fn().mockResolvedValue([]),
    } as any;
    const controller = new ComplementaryExamsController(service);

    controller.findResults(
      'patient-1' as any,
      'exam-1' as any,
      { user: { tenantId: 'tenant-1', role: UserRole.ADMIN } } as any,
      'true',
    );

    expect(service.findResults).toHaveBeenCalledWith(
      'patient-1',
      'exam-1',
      'tenant-1',
      true,
    );
  });
});

