import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { MedicationsService } from './medications.service';
import { PrismaService } from '../prisma/prisma.service';
import { MedicationCategory } from '@prisma/client';

const mockPrisma = {
  medication: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

const TENANT = 'tenant-abc';
const OTHER_TENANT = 'tenant-xyz';
const PATIENT_ID = 'patient-1';
const MED_ID = 'med-1';

const baseMed = {
  id: MED_ID,
  patientId: PATIENT_ID,
  tenantId: TENANT,
  name: 'Warfarina',
  category: MedicationCategory.ANTICOAGULANT,
  isAnticoagulant: true,
  isAntiplatelet: false,
  isCorticosteroid: false,
  isImmunosuppressant: false,
  isOpioid: false,
  isNSAID: false,
  isGrowthFactor: false,
  isActive: true,
  dosage: '5mg',
  frequency: '1x/dia',
};

describe('MedicationsService', () => {
  let service: MedicationsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MedicationsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<MedicationsService>(MedicationsService);
  });

  // ─── findAll ────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('deve escopar query por patientId e tenantId', async () => {
      mockPrisma.medication.findMany.mockResolvedValue([baseMed]);

      await service.findAll(PATIENT_ID, TENANT);

      expect(mockPrisma.medication.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { patientId: PATIENT_ID, tenantId: TENANT },
        })
      );
    });
  });

  // ─── findOne ────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('deve lançar NotFoundException quando medicação não existe', async () => {
      mockPrisma.medication.findFirst.mockResolvedValue(null);

      await expect(service.findOne(MED_ID, TENANT)).rejects.toThrow(NotFoundException);
    });

    it('deve lançar NotFoundException para medicação de outro tenant', async () => {
      mockPrisma.medication.findFirst.mockResolvedValue(null);

      await expect(service.findOne(MED_ID, OTHER_TENANT)).rejects.toThrow(NotFoundException);

      expect(mockPrisma.medication.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: MED_ID, tenantId: OTHER_TENANT } })
      );
    });

    it('deve retornar medicação quando tenant corresponde', async () => {
      mockPrisma.medication.findFirst.mockResolvedValue(baseMed);

      const result = await service.findOne(MED_ID, TENANT);

      expect(result.id).toBe(MED_ID);
    });
  });

  // ─── create — clinical flags ─────────────────────────────────────────────

  describe('create — clinical flags por categoria', () => {
    const base = { name: 'Med X', dosage: '10mg', frequency: '1x/dia' };

    it('deve marcar isAnticoagulant para categoria ANTICOAGULANT', async () => {
      mockPrisma.medication.create.mockResolvedValue(baseMed);

      await service.create(PATIENT_ID, TENANT, {
        ...base,
        category: MedicationCategory.ANTICOAGULANT,
      });

      expect(mockPrisma.medication.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isAnticoagulant: true, isCorticosteroid: false }),
        })
      );
    });

    it('deve marcar isCorticosteroid para categoria CORTICOSTEROID', async () => {
      mockPrisma.medication.create.mockResolvedValue({ ...baseMed, category: MedicationCategory.CORTICOSTEROID });

      await service.create(PATIENT_ID, TENANT, {
        ...base,
        category: MedicationCategory.CORTICOSTEROID,
      });

      expect(mockPrisma.medication.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isCorticosteroid: true, isAnticoagulant: false }),
        })
      );
    });

    it('deve marcar isImmunosuppressant para categoria IMMUNOSUPPRESSANT', async () => {
      mockPrisma.medication.create.mockResolvedValue(baseMed);

      await service.create(PATIENT_ID, TENANT, {
        ...base,
        category: MedicationCategory.IMMUNOSUPPRESSANT,
      });

      const callData = mockPrisma.medication.create.mock.calls[0][0].data;
      expect(callData.isImmunosuppressant).toBe(true);
      expect(callData.isAnticoagulant).toBe(false);
    });

    it('deve definir todos os flags como false para categoria OTHER', async () => {
      mockPrisma.medication.create.mockResolvedValue(baseMed);

      await service.create(PATIENT_ID, TENANT, { ...base, category: MedicationCategory.OTHER });

      const callData = mockPrisma.medication.create.mock.calls[0][0].data;
      expect(callData.isAnticoagulant).toBe(false);
      expect(callData.isCorticosteroid).toBe(false);
      expect(callData.isImmunosuppressant).toBe(false);
      expect(callData.isOpioid).toBe(false);
    });

    it('deve usar categoria OTHER como padrão quando não fornecida', async () => {
      mockPrisma.medication.create.mockResolvedValue(baseMed);

      await service.create(PATIENT_ID, TENANT, { ...base });

      const callData = mockPrisma.medication.create.mock.calls[0][0].data;
      expect(callData.category).toBe(MedicationCategory.OTHER);
    });

    it('deve incluir tenantId e patientId no create', async () => {
      mockPrisma.medication.create.mockResolvedValue(baseMed);

      await service.create(PATIENT_ID, TENANT, {
        ...base,
        category: MedicationCategory.ANTICOAGULANT,
      });

      const callData = mockPrisma.medication.create.mock.calls[0][0].data;
      expect(callData.tenantId).toBe(TENANT);
      expect(callData.patientId).toBe(PATIENT_ID);
    });
  });

  // ─── update ─────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('deve lançar NotFoundException para medicação de outro tenant', async () => {
      mockPrisma.medication.findFirst.mockResolvedValue(null);

      await expect(
        service.update(MED_ID, OTHER_TENANT, { name: 'Novo Nome' })
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.medication.update).not.toHaveBeenCalled();
    });

    it('deve rederivir flags clínicos ao mudar categoria no update', async () => {
      mockPrisma.medication.findFirst.mockResolvedValue(baseMed);
      mockPrisma.medication.update.mockResolvedValue(baseMed);

      await service.update(MED_ID, TENANT, { category: MedicationCategory.OPIOID_ANALGESIC });

      const callData = mockPrisma.medication.update.mock.calls[0][0].data;
      expect(callData.isOpioid).toBe(true);
      expect(callData.isAnticoagulant).toBe(false);
    });
  });

  // ─── remove ─────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('deve lançar NotFoundException para medicação de outro tenant', async () => {
      mockPrisma.medication.findFirst.mockResolvedValue(null);

      await expect(service.remove(MED_ID, OTHER_TENANT)).rejects.toThrow(NotFoundException);

      expect(mockPrisma.medication.delete).not.toHaveBeenCalled();
    });

    it('deve deletar a medicação quando tenant corresponde', async () => {
      mockPrisma.medication.findFirst.mockResolvedValue(baseMed);
      mockPrisma.medication.delete.mockResolvedValue(baseMed);

      await service.remove(MED_ID, TENANT);

      expect(mockPrisma.medication.delete).toHaveBeenCalledWith({ where: { id: MED_ID } });
    });
  });

  // ─── findCriticalFlags ───────────────────────────────────────────────────────

  describe('findCriticalFlags', () => {
    it('deve filtrar apenas medicações ativas com flags de risco', async () => {
      mockPrisma.medication.findMany.mockResolvedValue([baseMed]);

      await service.findCriticalFlags(PATIENT_ID, TENANT);

      expect(mockPrisma.medication.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            patientId: PATIENT_ID,
            tenantId: TENANT,
            isActive: true,
          }),
        })
      );
    });
  });
});
