import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientDto, Gender, CancerType } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { UpdatePriorityDto } from './dto/update-priority.dto';
import { ImportPatientRowDto } from './dto/import-patients.dto';
import { PatientDetailResponse } from './dto/patient-detail-response.dto';
import { CreateCancerDiagnosisDto } from './dto/create-cancer-diagnosis.dto';
import { UpdateCancerDiagnosisDto } from './dto/update-cancer-diagnosis.dto';
import {
  Patient,
  Prisma,
  JourneyStage,
  ComorbidityType,
  MedicationCategory,
} from '@prisma/client';
import { OncologyNavigationService } from '../oncology-navigation/oncology-navigation.service';
import { PriorityRecalculationService } from '../oncology-navigation/priority-recalculation.service';
import {
  TimelineEvent,
  TimelineEventType,
  TimelineQueryDto,
  TimelineResponse,
} from './dto/timeline-event.dto';
import {
  normalizePhoneNumber,
  hashPhoneNumber,
} from '../common/utils/phone.util';
import * as csv from 'csv-parser';
import { Readable } from 'stream';

type PatientWithDiagnoses = Prisma.PatientGetPayload<{
  include: {
    cancerDiagnoses: true;
  };
}>;

@Injectable()
export class PatientsService {
  private readonly logger = new Logger(PatientsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => OncologyNavigationService))
    private readonly navigationService?: OncologyNavigationService,
    private readonly priorityRecalculationService?: PriorityRecalculationService
  ) {}

  async findAll(
    tenantId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<Patient[]> {
    // Limite padrão de 200 pacientes para evitar problemas de performance
    const limit =
      options?.limit && options.limit > 0 ? Math.min(options.limit, 500) : 200;
    const offset = options?.offset && options.offset > 0 ? options.offset : 0;

    const patients = await this.prisma.patient.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: {
            messages: true,
            alerts: true,
            observations: true,
          },
        },
      },
      orderBy: [
        { priorityScore: 'desc' }, // Maior score primeiro
        { createdAt: 'desc' }, // Mais recente primeiro
      ],
      take: limit,
      skip: offset,
    });

    // Contar apenas alertas PENDENTES por paciente (alinhado com AlertsPanel)
    const patientIds = patients.map((p) => p.id);
    const pendingCounts =
      patientIds.length > 0
        ? await this.prisma.alert.groupBy({
            by: ['patientId'],
            where: {
              patientId: { in: patientIds },
              tenantId,
              status: 'PENDING',
            },
            _count: { id: true },
          })
        : [];
    const pendingByPatient = new Map(
      pendingCounts.map((r) => [r.patientId, r._count.id])
    );

    const patientsWithPending = patients.map((p) => ({
      ...p,
      pendingAlertsCount: pendingByPatient.get(p.id) ?? 0,
    }));

    // Ordenar por prioridade: CRITICAL > HIGH > MEDIUM > LOW
    // Dentro da mesma categoria, ordenar por score (maior primeiro)
    const priorityOrder = {
      CRITICAL: 0,
      HIGH: 1,
      MEDIUM: 2,
      LOW: 3,
    };

    return patientsWithPending.sort((a, b) => {
      const priorityA = priorityOrder[a.priorityCategory || 'MEDIUM'] ?? 2;
      const priorityB = priorityOrder[b.priorityCategory || 'MEDIUM'] ?? 2;

      // Primeiro critério: categoria de prioridade
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // Segundo critério: score de prioridade (maior primeiro)
      const scoreA = a.priorityScore || 0;
      const scoreB = b.priorityScore || 0;
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }

      // Terceiro critério: data de criação (mais recente primeiro)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  async findOne(id: string, tenantId: string): Promise<Patient> {
    const patient = await this.prisma.patient.findFirst({
      where: {
        id,
        tenantId, // SEMPRE incluir tenantId para isolamento
      },
      include: {
        journey: true,
        cancerDiagnoses: {
          where: { isActive: true, primaryDiagnosisId: null },
          orderBy: [{ isPrimary: 'desc' }, { diagnosisDate: 'desc' }],
          include: {
            metastaticDiagnoses: {
              where: { isActive: true },
              orderBy: { diagnosisDate: 'desc' },
            },
          },
        },
        medications: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
        comorbidities: {
          orderBy: [{ severity: 'desc' }, { name: 'asc' }],
        },
        performanceStatusHistory: {
          orderBy: { assessedAt: 'desc' },
          take: 5, // Últimas 5 avaliações para calcular delta
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        alerts: {
          where: { status: { not: 'RESOLVED' } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    return patient;
  }

  /**
   * Buscar paciente por número de telefone
   * Usa hash do telefone para busca eficiente mesmo com campo criptografado
   *
   * @param phone Número de telefone (qualquer formato)
   * @param tenantId ID do tenant
   * @returns Paciente encontrado ou null
   */
  async findByPhone(phone: string, tenantId: string): Promise<Patient | null> {
    try {
      // Normalizar telefone
      const normalizedPhone = normalizePhoneNumber(phone);

      // Gerar hash para busca
      const phoneHash = hashPhoneNumber(normalizedPhone);

      // Buscar paciente usando hash (busca eficiente mesmo com phone criptografado)
      const patient = await this.prisma.patient.findFirst({
        where: {
          tenantId, // SEMPRE incluir tenantId para isolamento
          phoneHash, // Busca por hash indexado
        },
        include: {
          journey: true,
          cancerDiagnoses: {
            where: { isActive: true, primaryDiagnosisId: null },
            orderBy: [{ isPrimary: 'desc' }, { diagnosisDate: 'desc' }],
            include: {
              metastaticDiagnoses: {
                where: { isActive: true },
                orderBy: { diagnosisDate: 'desc' },
              },
            },
          },
          medications: {
            where: { isActive: true },
            orderBy: { name: 'asc' },
          },
          comorbidities: {
            orderBy: [{ severity: 'desc' }, { name: 'asc' }],
          },
          performanceStatusHistory: {
            orderBy: { assessedAt: 'desc' },
            take: 5,
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          alerts: {
            where: {
              status: { not: 'RESOLVED' },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      return patient;
    } catch (error) {
      // Se erro na normalização, retornar null
      if (error instanceof Error && error.message.includes('Invalid phone')) {
        throw new BadRequestException(`Invalid phone number format: ${phone}`);
      }
      throw error;
    }
  }

  async create(
    createPatientDto: CreatePatientDto,
    tenantId: string
  ): Promise<Patient> {
    // Normalizar telefone e calcular hash para busca eficiente
    const normalizedPhone = normalizePhoneNumber(createPatientDto.phone);
    const phoneHash = hashPhoneNumber(normalizedPhone);

    // Verificar duplicidade de telefone por tenant
    const existingByPhone = await this.prisma.patient.findFirst({
      where: { tenantId, phoneHash },
    });
    if (existingByPhone) {
      throw new ConflictException(
        'Já existe um paciente cadastrado com este telefone neste tenant.'
      );
    }

    // Verificar duplicidade de CPF por tenant (se informado)
    if (createPatientDto.cpf) {
      const existingByCpf = await this.prisma.patient.findFirst({
        where: { tenantId, cpf: createPatientDto.cpf },
      });
      if (existingByCpf) {
        throw new ConflictException(
          'Já existe um paciente cadastrado com este CPF neste tenant.'
        );
      }
    }

    // Extrair relações do DTO para processar separadamente
    const {
      cancerDiagnoses,
      comorbidities,
      currentMedications,
      ...patientData
    } = createPatientDto;

    // Processar cancerDiagnoses se fornecidos
    const processedDiagnoses = cancerDiagnoses?.map((diagnosis) => {
      // Calcular stage automaticamente se campos TNM fornecidos
      const calculatedStage = this.calculateStageFromTNM(
        diagnosis.tStage,
        diagnosis.nStage,
        diagnosis.mStage,
        diagnosis.grade
      );

      return {
        ...diagnosis,
        tenantId,
        stage: calculatedStage, // Usar stage calculado a partir de TNM
        diagnosisDate: diagnosis.diagnosisDate
          ? new Date(diagnosis.diagnosisDate)
          : new Date(),
      };
    });

    const patient = await this.prisma.patient.create({
      data: {
        name: patientData.name,
        cpf: patientData.cpf,
        birthDate: new Date(createPatientDto.birthDate),
        gender: patientData.gender,
        phone: normalizedPhone,
        email: patientData.email,
        cancerType: patientData.cancerType,
        stage: patientData.stage,
        diagnosisDate: patientData.diagnosisDate
          ? new Date(patientData.diagnosisDate)
          : undefined,
        performanceStatus: patientData.performanceStatus,
        currentStage: patientData.currentStage,
        smokingHistory: patientData.smokingHistory,
        alcoholHistory: patientData.alcoholHistory,
        occupationalExposure: patientData.occupationalExposure,
        familyHistory: patientData.familyHistory as any,
        ehrPatientId: patientData.ehrId,
        maxDaysWithoutInteractionAlert: patientData.maxDaysWithoutInteractionAlert,
        tenantId, // SEMPRE incluir tenantId
        phoneHash, // Hash para busca eficiente
        cancerDiagnoses: processedDiagnoses
          ? {
              create: processedDiagnoses,
            }
          : undefined,
        comorbidities:
          comorbidities && comorbidities.length > 0
            ? {
                create: comorbidities.map((c) => ({
                  tenantId,
                  name: c.name,
                  type: c.type,
                  severity: c.severity,
                  controlled: c.controlled ?? false,
                  ...this.resolveComorbidityRiskFlags(c.type),
                })),
              }
            : undefined,
        medications:
          currentMedications && currentMedications.length > 0
            ? {
                create: currentMedications.map((m) => ({
                  tenantId,
                  name: m.name,
                  dosage: m.dosage,
                  frequency: m.frequency,
                  indication: m.indication,
                  category: m.category,
                  ...this.resolveMedicationRiskFlags(m.category),
                })),
              }
            : undefined,
      },
      include: {
        cancerDiagnoses: {
          where: { isActive: true },
          orderBy: { isPrimary: 'desc' },
        },
      },
    });

    // Inicializar etapas de navegação oncológica se tipo de câncer informado
    // Prioridade: cancerType direto > primeiro cancerDiagnosis primário
    const patientWithDiagnoses = patient as PatientWithDiagnoses;
    const primaryDiagnosis = patientWithDiagnoses.cancerDiagnoses?.[0];
    const cancerTypeToInitialize =
      createPatientDto.cancerType ||
      (primaryDiagnosis?.cancerType
        ? String(primaryDiagnosis.cancerType)
        : null);

    if (cancerTypeToInitialize && this.navigationService) {
      try {
        // Usar currentStage do paciente criado (pode ser default SCREENING)
        await this.navigationService.initializeNavigationSteps(
          patient.id,
          tenantId,
          cancerTypeToInitialize,
          patient.currentStage || JourneyStage.SCREENING
        );
      } catch (error) {
        // Log erro mas não falha a criação do paciente
        this.logger.error(
          'Erro ao inicializar etapas de navegação:',
          error instanceof Error ? error.stack : String(error)
        );
      }
    }

    return patient;
  }

  async update(
    id: string,
    updatePatientDto: UpdatePatientDto,
    tenantId: string
  ): Promise<Patient> {
    // Verificar se paciente existe e pertence ao tenant
    const existingPatient = await this.prisma.patient.findFirst({
      where: { id, tenantId },
      include: {
        cancerDiagnoses: {
          where: { isActive: true },
          orderBy: { isPrimary: 'desc' },
        },
      },
    });

    if (!existingPatient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    const updateData: Prisma.PatientUpdateInput = {};

    // Copiar campos permitidos do DTO
    if (updatePatientDto.name !== undefined) {
      updateData.name = updatePatientDto.name;
    }
    if (updatePatientDto.cpf !== undefined) {
      updateData.cpf = updatePatientDto.cpf;
    }
    if (updatePatientDto.birthDate !== undefined) {
      updateData.birthDate = new Date(updatePatientDto.birthDate);
    }
    if (updatePatientDto.gender !== undefined) {
      updateData.gender = updatePatientDto.gender;
    }
    if (updatePatientDto.phone !== undefined) {
      const normalizedPhone = normalizePhoneNumber(updatePatientDto.phone);
      updateData.phone = normalizedPhone;
      updateData.phoneHash = hashPhoneNumber(normalizedPhone);
    }
    if (updatePatientDto.email !== undefined) {
      updateData.email = updatePatientDto.email;
    }
    if (updatePatientDto.cancerType !== undefined) {
      updateData.cancerType = updatePatientDto.cancerType;
    }
    if (updatePatientDto.stage !== undefined) {
      updateData.stage = updatePatientDto.stage;
    }
    if (updatePatientDto.diagnosisDate !== undefined) {
      updateData.diagnosisDate = new Date(updatePatientDto.diagnosisDate);
    }
    if (updatePatientDto.performanceStatus !== undefined) {
      updateData.performanceStatus = updatePatientDto.performanceStatus;
    }
    if (updatePatientDto.currentStage !== undefined) {
      updateData.currentStage = updatePatientDto.currentStage as JourneyStage;
    }
    if (updatePatientDto.smokingHistory !== undefined) {
      updateData.smokingHistory = updatePatientDto.smokingHistory;
    }
    if (updatePatientDto.alcoholHistory !== undefined) {
      updateData.alcoholHistory = updatePatientDto.alcoholHistory;
    }
    if (updatePatientDto.occupationalExposure !== undefined) {
      updateData.occupationalExposure = updatePatientDto.occupationalExposure;
    }
    if (updatePatientDto.familyHistory !== undefined) {
      updateData.familyHistory = updatePatientDto.familyHistory as any;
    }
    if (updatePatientDto.ehrId !== undefined) {
      updateData.ehrPatientId = updatePatientDto.ehrId;
    }
    if (updatePatientDto.maxDaysWithoutInteractionAlert !== undefined) {
      updateData.maxDaysWithoutInteractionAlert = updatePatientDto.maxDaysWithoutInteractionAlert;
    }
    if ((updatePatientDto as any).clinicalDisposition !== undefined) {
      updateData.clinicalDisposition = (updatePatientDto as any).clinicalDisposition;
    }
    if ((updatePatientDto as any).clinicalDispositionAt !== undefined) {
      updateData.clinicalDispositionAt = new Date((updatePatientDto as any).clinicalDispositionAt);
    }
    if ((updatePatientDto as any).clinicalDispositionReason !== undefined) {
      updateData.clinicalDispositionReason = (updatePatientDto as any).clinicalDispositionReason;
    }
    if ((updatePatientDto as any).preferredEmergencyHospital !== undefined) {
      updateData.preferredEmergencyHospital = (updatePatientDto as any).preferredEmergencyHospital;
    }

    const updatedPatient = await this.prisma.patient.update({
      where: { id },
      data: updateData,
      include: {
        cancerDiagnoses: {
          where: { isActive: true },
          orderBy: { isPrimary: 'desc' },
        },
      },
    });

    // Se mudou o tipo de câncer ou fase, reinicializar etapas
    if (this.navigationService) {
      const existingPatientWithDiagnoses =
        existingPatient as PatientWithDiagnoses;
      const updatedPatientWithDiagnoses =
        updatedPatient as PatientWithDiagnoses;
      const oldPrimaryDiagnosis =
        existingPatientWithDiagnoses.cancerDiagnoses?.[0];
      const newPrimaryDiagnosis =
        updatedPatientWithDiagnoses.cancerDiagnoses?.[0];
      const oldCancerType =
        existingPatient.cancerType ||
        (oldPrimaryDiagnosis?.cancerType
          ? String(oldPrimaryDiagnosis.cancerType)
          : null);
      const newCancerType =
        updatedPatient.cancerType ||
        (newPrimaryDiagnosis?.cancerType
          ? String(newPrimaryDiagnosis.cancerType)
          : null);
      const oldStage = existingPatient.currentStage;
      const newStage = updatedPatient.currentStage || JourneyStage.SCREENING;

      // Quando currentStage ou cancerType mudam: etapas são recriadas em initializeNavigationSteps;
      // prazos (dueDate/expectedDate) são atribuídos apenas às etapas da fase atual (oncology-navigation.service).
      if (
        newCancerType &&
        (newCancerType !== oldCancerType || newStage !== oldStage)
      ) {
        try {
          await this.navigationService.initializeNavigationSteps(
            id,
            tenantId,
            newCancerType,
            newStage
          );
        } catch (error) {
          this.logger.error(
            'Erro ao atualizar etapas de navegação:',
            error instanceof Error ? error.stack : String(error)
          );
        }
      } else {
        // Sem reinit: garantir que etapas de fases futuras não tenham prazo (dados legados)
        try {
          await this.navigationService.clearFuturePhaseStepDates(
            id,
            tenantId
          );
        } catch (err) {
          this.logger.warn(
            'Falha ao limpar prazos de etapas futuras:',
            err instanceof Error ? err.message : err
          );
        }
      }
    }

    return updatedPatient;
  }

  /**
   * Atualizar score de priorização do paciente
   * Atualiza o campo priorityScore no paciente e cria registro histórico
   *
   * @param id ID do paciente
   * @param updatePriorityDto Dados do score de priorização
   * @param tenantId ID do tenant
   * @returns Paciente atualizado
   */
  async updatePriority(
    id: string,
    updatePriorityDto: UpdatePriorityDto,
    tenantId: string
  ): Promise<Patient> {
    // Verificar se paciente existe e pertence ao tenant
    const existingPatient = await this.prisma.patient.findFirst({
      where: { id, tenantId },
    });

    if (!existingPatient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    // Atualizar paciente e criar registro histórico em transação
    const [updatedPatient] = await this.prisma.$transaction([
      // Atualizar score no paciente
      this.prisma.patient.update({
        where: { id },
        data: {
          priorityScore: updatePriorityDto.score,
          priorityCategory: updatePriorityDto.category,
          priorityReason: updatePriorityDto.reason,
          priorityUpdatedAt: new Date(),
        },
      }),
      // Criar registro histórico
      this.prisma.priorityScore.create({
        data: {
          tenantId,
          patientId: id,
          score: updatePriorityDto.score,
          category: updatePriorityDto.category,
          reason: updatePriorityDto.reason,
          modelVersion: updatePriorityDto.modelVersion,
        },
      }),
    ]);

    return updatedPatient;
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const patient = await this.prisma.patient.findFirst({
      where: { id, tenantId },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    await this.prisma.patient.delete({
      where: { id },
    });
  }

  /**
   * Importa pacientes de um arquivo CSV
   * @param csvBuffer Buffer do arquivo CSV
   * @param tenantId ID do tenant
   * @returns Resultado da importação com sucessos e erros
   */
  async importFromCsv(
    csvBuffer: Buffer,
    tenantId: string
  ): Promise<{
    success: number;
    errors: Array<{ row: number; errors: string[] }>;
    created: Patient[];
  }> {
    const results: ImportPatientRowDto[] = [];
    const errors: Array<{ row: number; errors: string[] }> = [];
    const created: Patient[] = [];

    return new Promise((resolve, reject) => {
      let streamError: Error | null = null;

      try {
        const stream = Readable.from(csvBuffer.toString('utf-8'));

        stream
          .pipe(
            csv({
              headers: [
                'name',
                'cpf',
                'dataNascimento',
                'sexo',
                'telefone',
                'email',
                'tipoCancer',
                'dataDiagnostico',
                'estagio',
                'oncologistaResponsavel',
                'currentStage',
              ],
            })
          )
          .on('data', (row) => {
            try {
              results.push(row);
            } catch (error) {
              this.logger.error('Erro ao processar linha do CSV:', error);
              // Continuar processamento mesmo com erro em uma linha
            }
          })
          .on('end', async () => {
            try {
              // Validar e criar pacientes
              for (let i = 0; i < results.length; i++) {
                const row = results[i];
                const rowErrors: string[] = [];

                // Validações básicas
                if (!row.name || row.name.trim().length < 2) {
                  rowErrors.push(
                    'Nome é obrigatório e deve ter pelo menos 2 caracteres'
                  );
                }
                if (!row.cpf || row.cpf.trim().length === 0) {
                  rowErrors.push('CPF é obrigatório');
                }
                if (!row.dataNascimento) {
                  rowErrors.push('Data de nascimento é obrigatória');
                }
                if (
                  !row.sexo ||
                  !['male', 'female', 'other'].includes(row.sexo)
                ) {
                  rowErrors.push('Sexo deve ser male, female ou other');
                }
                if (!row.telefone || row.telefone.trim().length < 10) {
                  rowErrors.push(
                    'Telefone é obrigatório e deve ter pelo menos 10 dígitos'
                  );
                }
                if (!row.tipoCancer) {
                  rowErrors.push('Tipo de câncer é obrigatório');
                }
                // Normalizar tipo de câncer: valor canônico é em inglês (ex.: lung)
                const raw = (row.tipoCancer as string).trim();
                const normalizedTipoCancer =
                  raw === 'Pulmão' || raw === 'pulmão' || raw === 'pulmao'
                    ? 'lung'
                    : raw;
                row.tipoCancer = normalizedTipoCancer as CancerType;
                // Data de diagnóstico só é obrigatória se não estiver em rastreio
                // Por padrão, assumimos SCREENING se não especificado
                const currentStage = (row as any).currentStage || 'SCREENING';
                if (!row.dataDiagnostico && currentStage !== 'SCREENING') {
                  rowErrors.push(
                    'Data de diagnóstico é obrigatória quando o paciente não está em rastreio'
                  );
                }

                // Validar formato de data
                if (
                  row.dataNascimento &&
                  isNaN(Date.parse(row.dataNascimento))
                ) {
                  rowErrors.push('Data de nascimento inválida');
                }
                if (
                  row.dataDiagnostico &&
                  isNaN(Date.parse(row.dataDiagnostico))
                ) {
                  rowErrors.push('Data de diagnóstico inválida');
                }

                if (rowErrors.length > 0) {
                  errors.push({ row: i + 2, errors: rowErrors }); // +2 porque linha 1 é header
                  continue;
                }

                try {
                  // Normalizar telefone (já validado como obrigatório acima)
                  let normalizedPhone = row.telefone.trim();
                  let phoneHash = null;
                  try {
                    normalizedPhone = normalizePhoneNumber(normalizedPhone);
                    phoneHash = hashPhoneNumber(normalizedPhone);
                  } catch (error) {
                    rowErrors.push('Telefone inválido');
                    errors.push({ row: i + 2, errors: rowErrors });
                    continue;
                  }

                  // Criar paciente
                  const createDto: CreatePatientDto = {
                    name: row.name.trim(),
                    cpf: row.cpf.trim(),
                    birthDate: row.dataNascimento,
                    gender: row.sexo,
                    phone: normalizedPhone,
                    email: row.email?.trim() || undefined,
                    cancerType: row.tipoCancer,
                    stage: row.estagio?.trim() || undefined,
                    currentTreatment: undefined,
                    ehrId: undefined,
                    ehrSystem: undefined,
                  };

                  // Determinar estágio da jornada
                  const currentStage =
                    (row as any).currentStage ||
                    (row.dataDiagnostico ? 'DIAGNOSIS' : 'SCREENING');

                  // Criar paciente
                  let patient;
                  try {
                    patient = await this.prisma.patient.create({
                      data: {
                        name: createDto.name,
                        cpf: createDto.cpf,
                        birthDate: new Date(row.dataNascimento),
                        gender: createDto.gender,
                        phone: createDto.phone,
                        email: createDto.email,
                        cancerType: createDto.cancerType,
                        stage: createDto.stage,
                        diagnosisDate: row.dataDiagnostico
                          ? new Date(row.dataDiagnostico)
                          : null,
                        currentStage: currentStage as JourneyStage,
                        tenantId,
                        phoneHash,
                      },
                    });
                  } catch (error) {
                    // Erro específico de constraint (ex: CPF duplicado)
                    if (error instanceof Error) {
                      if (
                        error.message.includes('Unique constraint') ||
                        error.message.includes('duplicate')
                      ) {
                        rowErrors.push(
                          `CPF ou telefone já cadastrado: ${error.message}`
                        );
                      } else {
                        rowErrors.push(
                          `Erro ao criar paciente: ${error.message}`
                        );
                      }
                    } else {
                      rowErrors.push('Erro desconhecido ao criar paciente');
                    }
                    errors.push({ row: i + 2, errors: rowErrors });
                    continue;
                  }

                  // Criar diagnóstico de câncer se tipoCancer fornecido
                  if (row.tipoCancer) {
                    try {
                      await this.prisma.cancerDiagnosis.create({
                        data: {
                          tenantId,
                          patientId: patient.id,
                          cancerType: row.tipoCancer,
                          diagnosisDate: row.dataDiagnostico
                            ? new Date(row.dataDiagnostico)
                            : new Date(),
                          diagnosisConfirmed: true,
                          isPrimary: true,
                          isActive: true,
                        },
                      });
                    } catch (error) {
                      this.logger.error(
                        `Erro ao criar diagnóstico para paciente ${patient.id}:`,
                        error instanceof Error ? error.stack : String(error)
                      );
                      // Não falhar o import por erro no diagnóstico, apenas logar
                    }
                  }

                  // Inicializar etapas de navegação
                  if (row.tipoCancer && this.navigationService) {
                    try {
                      await this.navigationService.initializeNavigationSteps(
                        patient.id,
                        tenantId,
                        row.tipoCancer,
                        currentStage as JourneyStage
                      );
                    } catch (error) {
                      this.logger.error(
                        `Erro ao inicializar navegação para paciente ${patient.id}:`,
                        error instanceof Error ? error.stack : String(error)
                      );
                    }
                  }

                  created.push(patient);
                } catch (error) {
                  if (error instanceof Error) {
                    rowErrors.push(error.message);
                  } else {
                    rowErrors.push('Erro desconhecido ao criar paciente');
                  }
                  errors.push({ row: i + 2, errors: rowErrors });
                }
              }

              resolve({
                success: created.length,
                errors,
                created,
              });
            } catch (error) {
              this.logger.error('Erro ao processar CSV:', error);
              reject(
                error instanceof Error
                  ? error
                  : new Error('Erro desconhecido ao processar CSV')
              );
            }
          })
          .on('error', (error) => {
            streamError =
              error instanceof Error ? error : new Error(String(error));
            this.logger.error('Erro no stream do CSV:', streamError);
            reject(new Error(`Erro ao ler CSV: ${streamError.message}`));
          });
      } catch (error) {
        this.logger.error('Erro ao criar stream do CSV:', error);
        reject(
          error instanceof Error
            ? error
            : new Error('Erro ao processar arquivo CSV')
        );
      }
    });
  }

  /**
   * Retorna paciente com todos os relacionamentos necessários
   * @param id ID do paciente
   * @param tenantId ID do tenant
   * @returns Dados completos do paciente
   */
  async getDetail(
    id: string,
    tenantId: string
  ): Promise<PatientDetailResponse> {
    const patient = await this.prisma.patient.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        journey: true,
        cancerDiagnoses: {
          where: { isActive: true },
          orderBy: [{ isPrimary: 'desc' }, { diagnosisDate: 'desc' }],
        },
        complementaryExams: {
          include: {
            results: { orderBy: { performedAt: 'desc' } },
          },
        },
        alerts: {
          where: {
            status: { not: 'RESOLVED' },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            messages: true,
            alerts: true,
            observations: true,
          },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    // Buscar etapas de navegação usando o serviço de navegação
    // Isso garante que etapas faltantes sejam criadas automaticamente
    let navigationSteps: any[] = [];
    if (this.navigationService) {
      try {
        navigationSteps =
          await this.navigationService.getPatientNavigationSteps(id, tenantId);
      } catch (error) {
        // Se houver erro ao buscar etapas, usar array vazio
        this.logger.error(
          'Erro ao buscar etapas de navegação:',
          error instanceof Error ? error.stack : String(error)
        );
        navigationSteps = [];
      }
    }

    // Adicionar navigationSteps ao objeto patient
    return {
      ...patient,
      navigationSteps,
    } as unknown as PatientDetailResponse;
  }

  /**
   * Calcula o campo stage a partir dos campos TNM estruturados
   * @param tStage T stage (T1-T4, Tis, Tx)
   * @param nStage N stage (N0-N3, Nx)
   * @param mStage M stage (M0, M1, Mx)
   * Derives comorbidity risk flags from type.
   */
  private resolveComorbidityRiskFlags(type?: ComorbidityType) {
    if (!type) {return {};}
    const sepsisRisk: ComorbidityType[] = [
      ComorbidityType.DIABETES_TYPE_1,
      ComorbidityType.DIABETES_TYPE_2,
      ComorbidityType.CHRONIC_KIDNEY_DISEASE,
      ComorbidityType.HEART_FAILURE,
      ComorbidityType.HIV_AIDS,
      ComorbidityType.LIVER_CIRRHOSIS,
      ComorbidityType.AUTOIMMUNE_DISEASE,
    ];
    const thrombosis: ComorbidityType[] = [
      ComorbidityType.ATRIAL_FIBRILLATION,
      ComorbidityType.DEEP_VEIN_THROMBOSIS,
      ComorbidityType.PULMONARY_EMBOLISM,
    ];
    const renal: ComorbidityType[] = [ComorbidityType.CHRONIC_KIDNEY_DISEASE];
    const pulmonary: ComorbidityType[] = [
      ComorbidityType.COPD,
      ComorbidityType.ASTHMA,
      ComorbidityType.HEART_FAILURE,
    ];
    return {
      increasesSepsisRisk: sepsisRisk.includes(type),
      increasesBleedingRisk: false,
      increasesThrombosisRisk: thrombosis.includes(type),
      affectsRenalClearance: renal.includes(type),
      affectsPulmonaryReserve: pulmonary.includes(type),
    };
  }

  /**
   * Derives medication clinical flags from category.
   */
  private resolveMedicationRiskFlags(category?: MedicationCategory) {
    if (!category) {return {};}
    return {
      isAnticoagulant: category === MedicationCategory.ANTICOAGULANT,
      isAntiplatelet: category === MedicationCategory.ANTIPLATELET,
      isCorticosteroid: category === MedicationCategory.CORTICOSTEROID,
      isImmunosuppressant: category === MedicationCategory.IMMUNOSUPPRESSANT,
      isOpioid: category === MedicationCategory.OPIOID_ANALGESIC,
      isNSAID: category === MedicationCategory.NSAID,
      isGrowthFactor: category === MedicationCategory.GROWTH_FACTOR,
    };
  }

  /**
   * @param grade Grade (G1-G4, Gx)
   * @returns String formatada como "T2N1M0 G2" ou null se não houver dados suficientes
   */
  calculateStageFromTNM(
    tStage?: string | null,
    nStage?: string | null,
    mStage?: string | null,
    grade?: string | null
  ): string | null {
    const parts: string[] = [];

    if (tStage && tStage !== 'Tx') {
      parts.push(tStage);
    }
    if (nStage && nStage !== 'Nx') {
      parts.push(nStage);
    }
    if (mStage && mStage !== 'Mx') {
      parts.push(mStage);
    }

    if (parts.length === 0) {
      return null;
    }

    const tnmString = parts.join('');
    if (grade && grade !== 'Gx') {
      return `${tnmString} ${grade}`;
    }

    return tnmString;
  }

  /**
   * Cria um novo diagnóstico de câncer para um paciente
   * @param patientId ID do paciente
   * @param tenantId ID do tenant
   * @param createDto Dados do diagnóstico
   * @returns Diagnóstico criado
   */
  async createCancerDiagnosis(
    patientId: string,
    tenantId: string,
    createDto: CreateCancerDiagnosisDto
  ) {
    // Verificar se paciente existe e pertence ao tenant
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, tenantId },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${patientId} not found`);
    }

    // Se for diagnóstico metastático, validar que o primário existe e pertence ao mesmo paciente
    if (createDto.primaryDiagnosisId) {
      const primary = await this.prisma.cancerDiagnosis.findFirst({
        where: {
          id: createDto.primaryDiagnosisId,
          patientId,
          tenantId,
          primaryDiagnosisId: null, // deve ser um primário
        },
      });
      if (!primary) {
        throw new BadRequestException(
          'Diagnóstico primário não encontrado ou não pertence a este paciente.'
        );
      }
    }

    // Calcular stage automaticamente se tStage, nStage, mStage estiverem preenchidos
    const calculatedStage = this.calculateStageFromTNM(
      createDto.tStage,
      createDto.nStage,
      createDto.mStage,
      createDto.grade
    );

    const diagnosisData: Prisma.CancerDiagnosisCreateInput = {
      tenant: { connect: { id: tenantId } },
      patient: { connect: { id: patientId } },
      cancerType: createDto.cancerType,
      icd10Code: createDto.icd10Code,
      tStage: createDto.tStage,
      nStage: createDto.nStage,
      mStage: createDto.mStage,
      grade: createDto.grade,
      stage: calculatedStage, // Usar stage calculado a partir de TNM
      stagingDate: createDto.stagingDate
        ? new Date(createDto.stagingDate)
        : undefined,
      histologicalType: createDto.histologicalType,
      diagnosisDate: new Date(createDto.diagnosisDate),
      diagnosisConfirmed: createDto.diagnosisConfirmed ?? true,
      pathologyReport: createDto.pathologyReport,
      confirmedBy: createDto.confirmedBy,
      // Biomarcadores - Mama
      her2Status: createDto.her2Status,
      erStatus: createDto.erStatus,
      prStatus: createDto.prStatus,
      ki67Percentage: createDto.ki67Percentage,
      // Biomarcadores - Pulmão/Colorretal
      egfrMutation: createDto.egfrMutation,
      alkRearrangement: createDto.alkRearrangement,
      ros1Rearrangement: createDto.ros1Rearrangement,
      brafMutation: createDto.brafMutation,
      krasMutation: createDto.krasMutation,
      nrasMutation: createDto.nrasMutation,
      pdl1Expression: createDto.pdl1Expression,
      msiStatus: createDto.msiStatus,
      // Biomarcadores - Próstata
      psaBaseline: createDto.psaBaseline,
      gleasonScore: createDto.gleasonScore,
      // Marcadores Tumorais
      ceaBaseline: createDto.ceaBaseline,
      ca199Baseline: createDto.ca199Baseline,
      ca125Baseline: createDto.ca125Baseline,
      ca153Baseline: createDto.ca153Baseline,
      afpBaseline: createDto.afpBaseline,
      hcgBaseline: createDto.hcgBaseline,
      // Status (metastático = não primário, vinculado ao primário)
      isPrimary: createDto.primaryDiagnosisId ? false : (createDto.isPrimary ?? true),
      isActive: createDto.isActive ?? true,
      // Vincular ao diagnóstico primário quando for metastático
      ...(createDto.primaryDiagnosisId && {
        primaryDiagnosis: { connect: { id: createDto.primaryDiagnosisId } },
      }),
    };

    const diagnosis = await this.prisma.cancerDiagnosis.create({
      data: diagnosisData,
    });

    // Inicializar etapas de navegação vinculadas a este diagnóstico (excluídas em cascata ao excluir o diagnóstico)
    if (this.navigationService) {
      try {
        const cancerTypeStr = String(createDto.cancerType);
        const journeyStage = patient.currentStage || JourneyStage.SCREENING;
        await this.navigationService.initializeNavigationSteps(
          patientId,
          tenantId,
          cancerTypeStr,
          journeyStage,
          diagnosis.id
        );
      } catch (error) {
        this.logger.error(
          'Erro ao inicializar etapas de navegação após diagnóstico:',
          error instanceof Error ? error.stack : String(error)
        );
      }
    }

    this.priorityRecalculationService?.triggerRecalculation(patientId, tenantId);

    return diagnosis;
  }

  /**
   * Atualiza um diagnóstico de câncer existente
   * @param diagnosisId ID do diagnóstico
   * @param patientId ID do paciente
   * @param tenantId ID do tenant
   * @param updateDto Dados para atualização
   * @returns Diagnóstico atualizado
   */
  async updateCancerDiagnosis(
    diagnosisId: string,
    patientId: string,
    tenantId: string,
    updateDto: UpdateCancerDiagnosisDto
  ) {
    // Verificar se diagnóstico existe e pertence ao paciente/tenant
    const existingDiagnosis = await this.prisma.cancerDiagnosis.findFirst({
      where: {
        id: diagnosisId,
        patientId,
        tenantId,
      },
    });

    if (!existingDiagnosis) {
      throw new NotFoundException(
        `Cancer diagnosis with ID ${diagnosisId} not found`
      );
    }

    // Calcular stage automaticamente se tStage, nStage, mStage foram atualizados
    const tStage = updateDto.tStage ?? existingDiagnosis.tStage;
    const nStage = updateDto.nStage ?? existingDiagnosis.nStage;
    const mStage = updateDto.mStage ?? existingDiagnosis.mStage;
    const grade = updateDto.grade ?? existingDiagnosis.grade;

    const calculatedStage = this.calculateStageFromTNM(
      tStage,
      nStage,
      mStage,
      grade
    );

    const updateData: Prisma.CancerDiagnosisUpdateInput = {
      ...updateDto,
      stage: calculatedStage || existingDiagnosis.stage,
    };

    // Converter datas se fornecidas
    if (updateDto.diagnosisDate) {
      updateData.diagnosisDate = new Date(updateDto.diagnosisDate);
    }
    if (updateDto.stagingDate) {
      updateData.stagingDate = new Date(updateDto.stagingDate);
    }

    const updated = await this.prisma.cancerDiagnosis.update({
      where: { id: diagnosisId },
      data: updateData,
    });

    this.priorityRecalculationService?.triggerRecalculation(patientId, tenantId);

    return updated;
  }

  /**
   * Lista todos os diagnósticos de câncer de um paciente
   * @param patientId ID do paciente
   * @param tenantId ID do tenant
   * @param includeInactive Incluir diagnósticos inativos
   * @returns Lista de diagnósticos
   */
  async getCancerDiagnoses(
    patientId: string,
    tenantId: string,
    includeInactive: boolean = false
  ) {
    // Verificar se paciente existe e pertence ao tenant
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, tenantId },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${patientId} not found`);
    }

    return this.prisma.cancerDiagnosis.findMany({
      where: {
        patientId,
        tenantId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: [{ isPrimary: 'desc' }, { diagnosisDate: 'desc' }],
    });
  }

  /**
   * Remove um diagnóstico de câncer do paciente
   * @param diagnosisId ID do diagnóstico
   * @param patientId ID do paciente
   * @param tenantId ID do tenant
   */
  async deleteCancerDiagnosis(
    diagnosisId: string,
    patientId: string,
    tenantId: string
  ): Promise<void> {
    const existingDiagnosis = await this.prisma.cancerDiagnosis.findFirst({
      where: {
        id: diagnosisId,
        patientId,
        tenantId,
      },
    });

    if (!existingDiagnosis) {
      throw new NotFoundException(
        `Cancer diagnosis with ID ${diagnosisId} not found`
      );
    }

    await this.prisma.cancerDiagnosis.delete({
      where: { id: diagnosisId },
    });
  }

  /**
   * Retorna a timeline unificada do paciente, agregando múltiplas fontes de dados
   * @param patientId ID do paciente
   * @param tenantId ID do tenant
   * @param query Parâmetros de paginação e filtro por tipo
   * @returns Timeline ordenada por data decrescente
   */
  async getTimeline(
    patientId: string,
    tenantId: string,
    query: TimelineQueryDto
  ): Promise<TimelineResponse> {
    // Verificar se paciente existe e pertence ao tenant
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, tenantId },
      select: { id: true },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${patientId} not found`);
    }

    const limit = Math.min(query.limit ?? 100, 500);
    const offset = query.offset ?? 0;
    const typeFilter = query.types;
    const now = new Date();

    const shouldInclude = (type: TimelineEventType) =>
      !typeFilter || typeFilter.length === 0 || typeFilter.includes(type);

    // Executar queries em paralelo para evitar N+1
    const [
      observations,
      alerts,
      examResults,
      navigationSteps,
      diagnoses,
      treatments,
      internalNotes,
      interventions,
      questionnaireResponses,
    ] = await Promise.all([
      shouldInclude('symptom')
        ? this.prisma.observation.findMany({
            where: { patientId, tenantId, effectiveDateTime: { lte: now } },
            select: {
              id: true,
              code: true,
              display: true,
              valueQuantity: true,
              valueString: true,
              unit: true,
              effectiveDateTime: true,
              status: true,
            },
            orderBy: { effectiveDateTime: 'desc' },
          })
        : [],
      shouldInclude('alert')
        ? this.prisma.alert.findMany({
            where: { patientId, tenantId },
            select: {
              id: true,
              type: true,
              severity: true,
              message: true,
              status: true,
              context: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
          })
        : [],
      shouldInclude('exam')
        ? this.prisma.complementaryExamResult.findMany({
            where: { tenantId, exam: { patientId, tenantId }, performedAt: { lte: now } },
            select: {
              id: true,
              performedAt: true,
              valueNumeric: true,
              valueText: true,
              unit: true,
              referenceRange: true,
              isAbnormal: true,
              report: true,
              exam: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                  code: true,
                  labCategory: true,
                },
              },
            },
            orderBy: { performedAt: 'desc' },
          })
        : [],
      shouldInclude('navigation_step') || shouldInclude('consultation')
        ? this.prisma.navigationStep.findMany({
            where: { patientId, tenantId },
            select: {
              id: true,
              stepKey: true,
              stepName: true,
              stepDescription: true,
              cancerType: true,
              journeyStage: true,
              status: true,
              isCompleted: true,
              completedAt: true,
              completedBy: true,
              expectedDate: true,
              dueDate: true,
              actualDate: true,
              institutionName: true,
              professionalName: true,
              result: true,
              notes: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
          })
        : [],
      shouldInclude('diagnosis')
        ? this.prisma.cancerDiagnosis.findMany({
            where: { patientId, tenantId, diagnosisDate: { lte: now } },
            select: {
              id: true,
              cancerType: true,
              icd10Code: true,
              stage: true,
              tStage: true,
              nStage: true,
              mStage: true,
              histologicalType: true,
              diagnosisDate: true,
              diagnosisConfirmed: true,
              isPrimary: true,
              isActive: true,
            },
            orderBy: { diagnosisDate: 'desc' },
          })
        : [],
      shouldInclude('treatment')
        ? this.prisma.treatment.findMany({
            where: { patientId, tenantId, startDate: { lte: now } },
            select: {
              id: true,
              treatmentType: true,
              treatmentName: true,
              protocol: true,
              intent: true,
              startDate: true,
              actualEndDate: true,
              status: true,
              currentCycle: true,
              totalCycles: true,
              response: true,
              notes: true,
            },
            orderBy: { startDate: 'desc' },
          })
        : [],
      shouldInclude('note')
        ? this.prisma.internalNote.findMany({
            where: { patientId, tenantId },
            select: {
              id: true,
              content: true,
              authorId: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
          })
        : [],
      shouldInclude('intervention')
        ? this.prisma.intervention.findMany({
            where: { patientId, tenantId },
            select: {
              id: true,
              type: true,
              notes: true,
              userId: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
          })
        : [],
      shouldInclude('questionnaire')
        ? this.prisma.questionnaireResponse.findMany({
            where: { patientId, tenantId },
            select: {
              id: true,
              completedAt: true,
              scores: true,
              appliedBy: true,
              questionnaire: {
                select: { id: true, code: true, name: true, type: true },
              },
            },
            orderBy: { completedAt: 'desc' },
          })
        : [],
    ]);

    // Mapear cada fonte para TimelineEvent[]
    const events: TimelineEvent[] = [];

    for (const obs of observations) {
      events.push({
        type: 'symptom',
        date: obs.effectiveDateTime.toISOString(),
        payload: {
          id: obs.id,
          code: obs.code,
          display: obs.display,
          valueQuantity: obs.valueQuantity ? Number(obs.valueQuantity) : null,
          valueString: obs.valueString,
          unit: obs.unit,
          status: obs.status,
        },
      });
    }

    for (const alert of alerts) {
      events.push({
        type: 'alert',
        date: alert.createdAt.toISOString(),
        payload: {
          id: alert.id,
          alertType: alert.type,
          severity: alert.severity,
          message: alert.message,
          status: alert.status,
          context: alert.context,
        },
      });
    }

    for (const result of examResults) {
      events.push({
        type: 'exam',
        date: result.performedAt.toISOString(),
        payload: {
          id: result.id,
          examName: result.exam.name,
          examType: result.exam.type,
          examCode: result.exam.code,
          labCategory: result.exam.labCategory,
          valueNumeric: result.valueNumeric,
          valueText: result.valueText,
          unit: result.unit,
          referenceRange: result.referenceRange,
          isAbnormal: result.isAbnormal,
          report: result.report,
        },
      });
    }

    // Separar NavigationSteps em navigation_step e consultation.
    // Só incluir na timeline etapas que tenham alguma data relevante (não usar createdAt como fallback).
    const consultationKeys = ['consulta', 'consultation', 'consult'];
    for (const step of navigationSteps) {
      const stepDate =
        step.completedAt ??
        step.actualDate ??
        step.dueDate ??
        step.expectedDate ??
        null;
      if (stepDate === null) {continue;} // Etapa sem data não aparece na timeline
      // Excluir eventos com data no futuro
      if (stepDate > now) {continue;}
      const isConsultation = consultationKeys.some(
        (k) =>
          step.stepKey.toLowerCase().includes(k) ||
          step.stepName.toLowerCase().includes(k)
      );
      const eventType: TimelineEventType =
        isConsultation && shouldInclude('consultation')
          ? 'consultation'
          : 'navigation_step';

      if (!shouldInclude(eventType)) {continue;}

      events.push({
        type: eventType,
        date: stepDate.toISOString(),
        payload: {
          id: step.id,
          stepKey: step.stepKey,
          stepName: step.stepName,
          stepDescription: step.stepDescription,
          cancerType: step.cancerType,
          journeyStage: step.journeyStage,
          status: step.status,
          isCompleted: step.isCompleted,
          completedAt: step.completedAt?.toISOString() ?? null,
          completedBy: step.completedBy,
          dueDate: step.dueDate?.toISOString() ?? null,
          actualDate: step.actualDate?.toISOString() ?? null,
          institutionName: step.institutionName,
          professionalName: step.professionalName,
          result: step.result,
          notes: step.notes,
        },
      });
    }

    for (const diag of diagnoses) {
      events.push({
        type: 'diagnosis',
        date: diag.diagnosisDate.toISOString(),
        payload: {
          id: diag.id,
          cancerType: diag.cancerType,
          icd10Code: diag.icd10Code,
          stage: diag.stage,
          tStage: diag.tStage,
          nStage: diag.nStage,
          mStage: diag.mStage,
          histologicalType: diag.histologicalType,
          diagnosisConfirmed: diag.diagnosisConfirmed,
          isPrimary: diag.isPrimary,
          isActive: diag.isActive,
        },
      });
    }

    for (const treatment of treatments) {
      // Evento de início
      events.push({
        type: 'treatment',
        date: treatment.startDate.toISOString(),
        payload: {
          id: treatment.id,
          treatmentType: treatment.treatmentType,
          treatmentName: treatment.treatmentName,
          protocol: treatment.protocol,
          intent: treatment.intent,
          status: treatment.status,
          currentCycle: treatment.currentCycle,
          totalCycles: treatment.totalCycles,
          response: treatment.response,
          notes: treatment.notes,
          subEvent: 'start',
        },
      });
      // Se houve término no passado, adicionar evento separado
      if (treatment.actualEndDate && treatment.actualEndDate <= now) {
        events.push({
          type: 'treatment',
          date: treatment.actualEndDate.toISOString(),
          payload: {
            id: treatment.id,
            treatmentType: treatment.treatmentType,
            treatmentName: treatment.treatmentName,
            protocol: treatment.protocol,
            status: treatment.status,
            response: treatment.response,
            subEvent: 'end',
          },
        });
      }
    }

    for (const note of internalNotes) {
      events.push({
        type: 'note',
        date: note.createdAt.toISOString(),
        payload: {
          id: note.id,
          content: note.content,
          authorId: note.authorId,
        },
      });
    }

    for (const intervention of interventions) {
      events.push({
        type: 'intervention',
        date: intervention.createdAt.toISOString(),
        payload: {
          id: intervention.id,
          interventionType: intervention.type,
          notes: intervention.notes,
          userId: intervention.userId,
        },
      });
    }

    for (const qr of questionnaireResponses) {
      events.push({
        type: 'questionnaire',
        date: qr.completedAt.toISOString(),
        payload: {
          id: qr.id,
          scores: qr.scores,
          appliedBy: qr.appliedBy,
          questionnaire: qr.questionnaire,
        },
      });
    }

    // Ordenar por data decrescente
    events.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const total = events.length;
    const paginated = events.slice(offset, offset + limit);

    return {
      data: paginated,
      total,
      limit,
      offset,
    };
  }
}
