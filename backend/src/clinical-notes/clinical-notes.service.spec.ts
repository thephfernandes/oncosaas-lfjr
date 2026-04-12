import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import {
  ClinicalNoteStatus,
  ClinicalNoteType,
  ClinicalSubrole,
  UserRole,
} from '@generated/prisma/client';
import { ClinicalNotesService } from './clinical-notes.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CLINICAL_NOTE_SECTION_KEYS } from './clinical-notes.constants';

describe('ClinicalNotesService', () => {
  let service: ClinicalNotesService;

  const mockAudit = { log: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClinicalNotesService,
        {
          provide: PrismaService,
          useValue: {},
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('x'.repeat(32)) },
        },
        { provide: AuditLogService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get(ClinicalNotesService);
  });

  describe('normalizeAndValidateSections', () => {
    it('fills missing keys with empty string', () => {
      const out = service.normalizeAndValidateSections({ hda: 'teste' });
      for (const k of CLINICAL_NOTE_SECTION_KEYS) {
        if (k === 'hda') {
          expect(out[k]).toBe('teste');
        } else {
          expect(out[k]).toBe('');
        }
      }
    });

    it('rejects unknown keys', () => {
      expect(() =>
        service.normalizeAndValidateSections({ hda: 'a', extra: 'b' } as any)
      ).toThrow(BadRequestException);
    });
  });

  describe('canCreateOrSignNoteType', () => {
    it('allows NURSE for NURSING', () => {
      expect(
        service.canCreateOrSignNoteType(UserRole.NURSE, null, ClinicalNoteType.NURSING)
      ).toBe(true);
    });

    it('allows COORDINATOR only with NURSING subrole for NURSING note', () => {
      expect(
        service.canCreateOrSignNoteType(
          UserRole.COORDINATOR,
          ClinicalSubrole.NURSING,
          ClinicalNoteType.NURSING
        )
      ).toBe(true);
      expect(
        service.canCreateOrSignNoteType(
          UserRole.COORDINATOR,
          null,
          ClinicalNoteType.NURSING
        )
      ).toBe(false);
    });

    it('allows ONCOLOGIST for MEDICAL', () => {
      expect(
        service.canCreateOrSignNoteType(
          UserRole.ONCOLOGIST,
          null,
          ClinicalNoteType.MEDICAL
        )
      ).toBe(true);
    });

    it('ADMIN exige clinicalSubrole alinhado ao tipo de nota', () => {
      expect(
        service.canCreateOrSignNoteType(
          UserRole.ADMIN,
          null,
          ClinicalNoteType.NURSING
        )
      ).toBe(false);
      expect(
        service.canCreateOrSignNoteType(
          UserRole.ADMIN,
          ClinicalSubrole.NURSING,
          ClinicalNoteType.NURSING
        )
      ).toBe(true);
      expect(
        service.canCreateOrSignNoteType(
          UserRole.ADMIN,
          ClinicalSubrole.NURSING,
          ClinicalNoteType.MEDICAL
        )
      ).toBe(false);
      expect(
        service.canCreateOrSignNoteType(
          UserRole.ADMIN,
          ClinicalSubrole.MEDICAL,
          ClinicalNoteType.MEDICAL
        )
      ).toBe(true);
    });
  });

  describe('toMutationResponse', () => {
    it('maps latest version', () => {
      const r = service.toMutationResponse({
        id: '1',
        patientId: 'p',
        status: ClinicalNoteStatus.DRAFT,
        noteType: ClinicalNoteType.NURSING,
        amendsClinicalNoteId: null,
        navigationStepId: 'ns-1',
        updatedAt: new Date(),
        versions: [{ versionNumber: 2, sectionsContentHash: 'abc' }],
      });
      expect(r.latestVersionNumber).toBe(2);
      expect(r.sectionsContentHash).toBe('abc');
      expect(r.navigationStepId).toBe('ns-1');
    });
  });
});
