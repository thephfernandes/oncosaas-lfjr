import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ComorbiditiesService } from './comorbidities.service';
import { PrismaService } from '../prisma/prisma.service';
import { ComorbidityType, ComorbiditySeverity } from '@prisma/client';

const mockPrisma = {
  comorbidity: {
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
const COMORBIDITY_ID = 'comorbidity-1';

const baseComorbidity = {
  id: COMORBIDITY_ID,
  patientId: PATIENT_ID,
  tenantId: TENANT,
  name: 'Diabetes tipo 2',
  type: ComorbidityType.DIABETES_TYPE_2,
  severity: ComorbiditySeverity.MODERATE,
  controlled: false,
  increasesSepsisRisk: true,
  increasesBleedingRisk: false,
  increasesThrombosisRisk: false,
  affectsRenalClearance: false,
  affectsPulmonaryReserve: false,
};

describe('ComorbiditiesService', () => {
  let service: ComorbiditiesService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComorbiditiesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ComorbiditiesService>(ComorbiditiesService);
  });

  // ─── findAll ────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('deve escopar query por patientId e tenantId', async () => {
      mockPrisma.comorbidity.findMany.mockResolvedValue([baseComorbidity]);

      await service.findAll(PATIENT_ID, TENANT);

      expect(mockPrisma.comorbidity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { patientId: PATIENT_ID, tenantId: TENANT },
        })
      );
    });
  });

  // ─── findOne ────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('deve lançar NotFoundException quando comorbidade não existe', async () => {
      mockPrisma.comorbidity.findFirst.mockResolvedValue(null);

      await expect(service.findOne(COMORBIDITY_ID, TENANT)).rejects.toThrow(NotFoundException);
    });

    it('deve lançar NotFoundException para comorbidade de outro tenant', async () => {
      mockPrisma.comorbidity.findFirst.mockResolvedValue(null);

      await expect(service.findOne(COMORBIDITY_ID, OTHER_TENANT)).rejects.toThrow(NotFoundException);

      expect(mockPrisma.comorbidity.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: COMORBIDITY_ID, tenantId: OTHER_TENANT } })
      );
    });

    it('deve retornar comorbidade quando tenant corresponde', async () => {
      mockPrisma.comorbidity.findFirst.mockResolvedValue(baseComorbidity);

      const result = await service.findOne(COMORBIDITY_ID, TENANT);

      expect(result.id).toBe(COMORBIDITY_ID);
    });
  });

  // ─── create — risk flags ─────────────────────────────────────────────────

  describe('create — flags de risco por tipo', () => {
    const base = { name: 'Condição X', severity: ComorbiditySeverity.MODERATE };

    it('deve marcar increasesSepsisRisk para DIABETES_TYPE_2', async () => {
      mockPrisma.comorbidity.create.mockResolvedValue(baseComorbidity);

      await service.create(PATIENT_ID, TENANT, {
        ...base,
        type: ComorbidityType.DIABETES_TYPE_2,
      });

      const callData = mockPrisma.comorbidity.create.mock.calls[0][0].data;
      expect(callData.increasesSepsisRisk).toBe(true);
      expect(callData.increasesThrombosisRisk).toBe(false);
    });

    it('deve marcar increasesSepsisRisk para HEART_FAILURE', async () => {
      mockPrisma.comorbidity.create.mockResolvedValue(baseComorbidity);

      await service.create(PATIENT_ID, TENANT, {
        ...base,
        type: ComorbidityType.HEART_FAILURE,
      });

      const callData = mockPrisma.comorbidity.create.mock.calls[0][0].data;
      expect(callData.increasesSepsisRisk).toBe(true);
      expect(callData.affectsPulmonaryReserve).toBe(true);
    });

    it('deve marcar increasesThrombosisRisk para ATRIAL_FIBRILLATION', async () => {
      mockPrisma.comorbidity.create.mockResolvedValue(baseComorbidity);

      await service.create(PATIENT_ID, TENANT, {
        ...base,
        type: ComorbidityType.ATRIAL_FIBRILLATION,
      });

      const callData = mockPrisma.comorbidity.create.mock.calls[0][0].data;
      expect(callData.increasesThrombosisRisk).toBe(true);
      expect(callData.increasesSepsisRisk).toBe(false);
    });

    it('deve marcar affectsRenalClearance para CHRONIC_KIDNEY_DISEASE', async () => {
      mockPrisma.comorbidity.create.mockResolvedValue(baseComorbidity);

      await service.create(PATIENT_ID, TENANT, {
        ...base,
        type: ComorbidityType.CHRONIC_KIDNEY_DISEASE,
      });

      const callData = mockPrisma.comorbidity.create.mock.calls[0][0].data;
      expect(callData.affectsRenalClearance).toBe(true);
      expect(callData.increasesSepsisRisk).toBe(true); // CKD também está na lista de sepsis
    });

    it('deve marcar affectsPulmonaryReserve para COPD', async () => {
      mockPrisma.comorbidity.create.mockResolvedValue(baseComorbidity);

      await service.create(PATIENT_ID, TENANT, {
        ...base,
        type: ComorbidityType.COPD,
      });

      const callData = mockPrisma.comorbidity.create.mock.calls[0][0].data;
      expect(callData.affectsPulmonaryReserve).toBe(true);
    });

    it('deve definir todos os flags como false para tipo OTHER', async () => {
      mockPrisma.comorbidity.create.mockResolvedValue(baseComorbidity);

      await service.create(PATIENT_ID, TENANT, {
        ...base,
        type: ComorbidityType.OTHER,
      });

      const callData = mockPrisma.comorbidity.create.mock.calls[0][0].data;
      expect(callData.increasesSepsisRisk).toBe(false);
      expect(callData.increasesBleedingRisk).toBe(false);
      expect(callData.increasesThrombosisRisk).toBe(false);
      expect(callData.affectsRenalClearance).toBe(false);
      expect(callData.affectsPulmonaryReserve).toBe(false);
    });

    it('deve incluir tenantId e patientId no create', async () => {
      mockPrisma.comorbidity.create.mockResolvedValue(baseComorbidity);

      await service.create(PATIENT_ID, TENANT, {
        ...base,
        type: ComorbidityType.DIABETES_TYPE_2,
      });

      const callData = mockPrisma.comorbidity.create.mock.calls[0][0].data;
      expect(callData.tenantId).toBe(TENANT);
      expect(callData.patientId).toBe(PATIENT_ID);
    });

    it('deve usar tipo OTHER como padrão quando não fornecido', async () => {
      mockPrisma.comorbidity.create.mockResolvedValue(baseComorbidity);

      await service.create(PATIENT_ID, TENANT, { name: 'Outra condição' });

      const callData = mockPrisma.comorbidity.create.mock.calls[0][0].data;
      expect(callData.type).toBe(ComorbidityType.OTHER);
    });
  });

  // ─── update ─────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('deve lançar NotFoundException para comorbidade de outro tenant', async () => {
      mockPrisma.comorbidity.findFirst.mockResolvedValue(null);

      await expect(
        service.update(COMORBIDITY_ID, OTHER_TENANT, { name: 'Novo Nome' })
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.comorbidity.update).not.toHaveBeenCalled();
    });

    it('deve rederivir flags de risco ao mudar tipo no update', async () => {
      mockPrisma.comorbidity.findFirst.mockResolvedValue(baseComorbidity);
      mockPrisma.comorbidity.update.mockResolvedValue(baseComorbidity);

      await service.update(COMORBIDITY_ID, TENANT, { type: ComorbidityType.PULMONARY_EMBOLISM });

      const callData = mockPrisma.comorbidity.update.mock.calls[0][0].data;
      expect(callData.increasesThrombosisRisk).toBe(true);
    });
  });

  // ─── remove ─────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('deve lançar NotFoundException para comorbidade de outro tenant', async () => {
      mockPrisma.comorbidity.findFirst.mockResolvedValue(null);

      await expect(service.remove(COMORBIDITY_ID, OTHER_TENANT)).rejects.toThrow(NotFoundException);

      expect(mockPrisma.comorbidity.delete).not.toHaveBeenCalled();
    });

    it('deve deletar a comorbidade quando tenant corresponde', async () => {
      mockPrisma.comorbidity.findFirst.mockResolvedValue(baseComorbidity);
      mockPrisma.comorbidity.delete.mockResolvedValue(baseComorbidity);

      await service.remove(COMORBIDITY_ID, TENANT);

      expect(mockPrisma.comorbidity.delete).toHaveBeenCalledWith({ where: { id: COMORBIDITY_ID } });
    });
  });

  // ─── findRiskFlags ──────────────────────────────────────────────────────────

  describe('findRiskFlags', () => {
    it('deve filtrar por patientId e tenantId com condições OR de flags', async () => {
      mockPrisma.comorbidity.findMany.mockResolvedValue([baseComorbidity]);

      await service.findRiskFlags(PATIENT_ID, TENANT);

      expect(mockPrisma.comorbidity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            patientId: PATIENT_ID,
            tenantId: TENANT,
            OR: expect.arrayContaining([
              { increasesSepsisRisk: true },
              { increasesThrombosisRisk: true },
            ]),
          }),
        })
      );
    });
  });
});
