import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConsentService } from './consent.service';
import { PrismaService } from '../prisma/prisma.service';

const createMockPrisma = () => ({
  patient: {
    findFirst: jest.fn(),
  },
  patientConsent: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
});

const TENANT_A = 'tenant-a';
const TENANT_B = 'tenant-b';
const PATIENT_ID = 'patient-uuid-1';
const VERSION = '1.0';

const mockPatient = { id: PATIENT_ID, tenantId: TENANT_A, name: 'Paciente Teste' };
const mockConsent = {
  id: 'consent-uuid-1',
  tenantId: TENANT_A,
  patientId: PATIENT_ID,
  version: VERSION,
  consentedAt: new Date(),
  revokedAt: null,
  ipAddress: '127.0.0.1',
  userAgent: 'test-agent',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('ConsentService', () => {
  let service: ConsentService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(async () => {
    mockPrisma = createMockPrisma();
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsentService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ConsentService>(ConsentService);
  });

  // ── createConsent ─────────────────────────────────────────────────────────

  describe('createConsent', () => {
    it('deve incluir tenantId na query de verificação do paciente', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(mockPatient);
      mockPrisma.patientConsent.findFirst.mockResolvedValue(null);
      mockPrisma.patientConsent.create.mockResolvedValue(mockConsent);

      await service.createConsent(PATIENT_ID, { version: VERSION }, TENANT_A);

      expect(mockPrisma.patient.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: TENANT_A }),
        }),
      );
    });

    it('deve lançar NotFoundException quando paciente não pertence ao tenant', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(null);

      await expect(
        service.createConsent(PATIENT_ID, { version: VERSION }, TENANT_B),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.patientConsent.create).not.toHaveBeenCalled();
    });

    it('deve registrar consentimento com dados corretos', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(mockPatient);
      mockPrisma.patientConsent.findFirst.mockResolvedValue(null);
      mockPrisma.patientConsent.create.mockResolvedValue(mockConsent);

      await service.createConsent(
        PATIENT_ID,
        { version: VERSION },
        TENANT_A,
        '192.168.1.1',
        'Mozilla/5.0',
      );

      expect(mockPrisma.patientConsent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: TENANT_A,
            patientId: PATIENT_ID,
            version: VERSION,
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0',
          }),
        }),
      );
    });

    it('deve lançar ConflictException para duplo consentimento da mesma versão', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(mockPatient);
      mockPrisma.patientConsent.findFirst.mockResolvedValue(mockConsent);

      await expect(
        service.createConsent(PATIENT_ID, { version: VERSION }, TENANT_A),
      ).rejects.toThrow(ConflictException);

      expect(mockPrisma.patientConsent.create).not.toHaveBeenCalled();
    });

    it('deve permitir novo consentimento após revogação (revokedAt preenchido)', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(mockPatient);
      // findFirst para verificação de duplicidade retorna null (versão revogada não conta)
      mockPrisma.patientConsent.findFirst.mockResolvedValue(null);
      mockPrisma.patientConsent.create.mockResolvedValue(mockConsent);

      await expect(
        service.createConsent(PATIENT_ID, { version: VERSION }, TENANT_A),
      ).resolves.toBeDefined();
    });
  });

  // ── revokeConsent ─────────────────────────────────────────────────────────

  describe('revokeConsent', () => {
    it('deve lançar NotFoundException quando paciente não pertence ao tenant', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(null);

      await expect(
        service.revokeConsent(PATIENT_ID, { version: VERSION }, TENANT_B),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.patientConsent.update).not.toHaveBeenCalled();
    });

    it('deve lançar NotFoundException quando não há consentimento ativo para revogar', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(mockPatient);
      mockPrisma.patientConsent.findFirst.mockResolvedValue(null);

      await expect(
        service.revokeConsent(PATIENT_ID, { version: VERSION }, TENANT_A),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.patientConsent.update).not.toHaveBeenCalled();
    });

    it('deve incluir tenantId no update de revogação', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(mockPatient);
      mockPrisma.patientConsent.findFirst.mockResolvedValue(mockConsent);
      mockPrisma.patientConsent.update.mockResolvedValue({
        ...mockConsent,
        revokedAt: new Date(),
      });

      await service.revokeConsent(PATIENT_ID, { version: VERSION }, TENANT_A);

      expect(mockPrisma.patientConsent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: TENANT_A }),
          data: expect.objectContaining({ revokedAt: expect.any(Date) }),
        }),
      );
    });
  });

  // ── getConsentStatus ──────────────────────────────────────────────────────

  describe('getConsentStatus', () => {
    it('deve lançar NotFoundException quando paciente não pertence ao tenant', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(null);

      await expect(
        service.getConsentStatus(PATIENT_ID, TENANT_B),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve incluir tenantId na query de consentimentos', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(mockPatient);
      mockPrisma.patientConsent.findMany.mockResolvedValue([mockConsent]);

      await service.getConsentStatus(PATIENT_ID, TENANT_A);

      expect(mockPrisma.patientConsent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            patientId: PATIENT_ID,
            tenantId: TENANT_A,
          }),
        }),
      );
    });

    it('deve retornar hasActiveConsent=true quando há consentimento sem revokedAt', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(mockPatient);
      mockPrisma.patientConsent.findMany.mockResolvedValue([mockConsent]);

      const result = await service.getConsentStatus(PATIENT_ID, TENANT_A);

      expect(result.hasActiveConsent).toBe(true);
      expect(result.activeVersions).toContain(VERSION);
    });

    it('deve retornar hasActiveConsent=false quando todos os consentimentos estão revogados', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(mockPatient);
      mockPrisma.patientConsent.findMany.mockResolvedValue([
        { ...mockConsent, revokedAt: new Date() },
      ]);

      const result = await service.getConsentStatus(PATIENT_ID, TENANT_A);

      expect(result.hasActiveConsent).toBe(false);
      expect(result.activeVersions).toHaveLength(0);
    });
  });

  // ── assertConsented ───────────────────────────────────────────────────────

  describe('assertConsented', () => {
    it('deve lançar ForbiddenException quando não há consentimento ativo', async () => {
      mockPrisma.patientConsent.findFirst.mockResolvedValue(null);

      await expect(
        service.assertConsented(PATIENT_ID, VERSION, TENANT_A),
      ).rejects.toThrow(ForbiddenException);
    });

    it('não deve lançar exceção quando há consentimento ativo', async () => {
      mockPrisma.patientConsent.findFirst.mockResolvedValue(mockConsent);

      await expect(
        service.assertConsented(PATIENT_ID, VERSION, TENANT_A),
      ).resolves.toBeUndefined();
    });

    it('deve incluir tenantId na query de verificação', async () => {
      mockPrisma.patientConsent.findFirst.mockResolvedValue(mockConsent);

      await service.assertConsented(PATIENT_ID, VERSION, TENANT_A);

      expect(mockPrisma.patientConsent.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: TENANT_A }),
        }),
      );
    });
  });
});
