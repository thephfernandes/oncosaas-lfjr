import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AgentService } from './agent.service';
import { PrismaService } from '../prisma/prisma.service';
import { ChannelGatewayService } from '../channel-gateway/channel-gateway.service';
import { ConversationService } from './conversation.service';
import { DecisionGateService } from './decision-gate.service';
import { AlertsGateway } from '../gateways/alerts.gateway';
import { PriorityRecalculationService } from '../oncology-navigation/priority-recalculation.service';

// Suprimir output de logger nos testes
jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => {});

describe('AgentService', () => {
  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'ENCRYPTION_KEY') return 'test-encryption-key-32-chars-long!';
      if (key === 'AI_SERVICE_URL') return 'http://localhost:8001';
      return undefined;
    }),
  };

  const mockPriorityRecalculation = {
    recalculate: jest.fn().mockResolvedValue(true),
    triggerRecalculation: jest.fn().mockResolvedValue(true),
  };

  const mockPrisma = {
    patient: { findFirst: jest.fn(), update: jest.fn() },
    cancerDiagnosis: { findMany: jest.fn().mockResolvedValue([]) },
    treatment: { findMany: jest.fn().mockResolvedValue([]) },
    navigationStep: { findMany: jest.fn().mockResolvedValue([]) },
    alert: { findMany: jest.fn().mockResolvedValue([]), create: jest.fn() },
    questionnaireResponse: { findMany: jest.fn().mockResolvedValue([]) },
    observation: { findMany: jest.fn().mockResolvedValue([]), create: jest.fn().mockResolvedValue({ id: 'obs-1' }) },
    medication: { findMany: jest.fn().mockResolvedValue([]) },
    comorbidity: { findMany: jest.fn().mockResolvedValue([]) },
    performanceStatusHistory: { findMany: jest.fn().mockResolvedValue([]) },
    agentConfig: { findUnique: jest.fn().mockResolvedValue(null) },
    clinicalProtocol: { findFirst: jest.fn().mockResolvedValue(null) },
  };

  const moduleDeps = {
    providers: [
      AgentService,
      { provide: PrismaService, useValue: mockPrisma },
      { provide: ConfigService, useValue: mockConfigService },
      { provide: ChannelGatewayService, useValue: { sendMessage: jest.fn().mockResolvedValue(undefined) } },
      { provide: ConversationService, useValue: { findOne: jest.fn(), getRecentHistory: jest.fn().mockResolvedValue([]), updateState: jest.fn() } },
      { provide: DecisionGateService, useValue: { evaluate: jest.fn(), logDecision: jest.fn() } },
      { provide: AlertsGateway, useValue: { emitCriticalAlert: jest.fn(), emitNewAlert: jest.fn() } },
      { provide: PriorityRecalculationService, useValue: mockPriorityRecalculation },
    ],
  };

  let service: AgentService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule(moduleDeps).compile();
    service = module.get(AgentService);
  });

  // ---------------------------------------------------------------------------
  // executeDecision — RECALCULATE_PRIORITY
  // ---------------------------------------------------------------------------
  describe('executeDecision — RECALCULATE_PRIORITY', () => {
    const tenantId = 'tenant-a';
    const patientId = 'patient-1';
    const conversationId = 'conv-1';

    const baseDecision = {
      decisionType: 'PRIORITY_RECALCULATED',
      reasoning: 'Sintoma registrado',
      confidence: 0.95,
      inputData: {},
      requiresApproval: false,
    };

    it('calls recalculate without clinicalDisposition when payload is empty', async () => {
      const decision = {
        ...baseDecision,
        outputAction: { type: 'RECALCULATE_PRIORITY', payload: {} },
      };

      await (service as any).executeDecision(decision, tenantId, patientId, conversationId);

      expect(mockPriorityRecalculation.recalculate).toHaveBeenCalledWith(
        patientId,
        tenantId,
        undefined,
      );
    });

    it('calls recalculate with clinicalDisposition ER_IMMEDIATE when provided', async () => {
      const decision = {
        ...baseDecision,
        outputAction: {
          type: 'RECALCULATE_PRIORITY',
          payload: { clinicalDisposition: 'ER_IMMEDIATE' },
        },
      };

      await (service as any).executeDecision(decision, tenantId, patientId, conversationId);

      expect(mockPriorityRecalculation.recalculate).toHaveBeenCalledWith(
        patientId,
        tenantId,
        'ER_IMMEDIATE',
      );
    });

    it('calls recalculate with clinicalDisposition ER_DAYS when provided', async () => {
      const decision = {
        ...baseDecision,
        outputAction: {
          type: 'RECALCULATE_PRIORITY',
          payload: { clinicalDisposition: 'ER_DAYS' },
        },
      };

      await (service as any).executeDecision(decision, tenantId, patientId, conversationId);

      expect(mockPriorityRecalculation.recalculate).toHaveBeenCalledWith(
        patientId,
        tenantId,
        'ER_DAYS',
      );
    });

    it('calls recalculate with undefined when clinicalDisposition is not a valid value', async () => {
      const decision = {
        ...baseDecision,
        outputAction: {
          type: 'RECALCULATE_PRIORITY',
          payload: { clinicalDisposition: 'INVALID_VALUE' },
        },
      };

      await (service as any).executeDecision(decision, tenantId, patientId, conversationId);

      expect(mockPriorityRecalculation.recalculate).toHaveBeenCalledWith(
        patientId,
        tenantId,
        undefined,
      );
    });

    it('passes all five valid dispositions through correctly', async () => {
      const validDispositions = [
        'ER_IMMEDIATE',
        'ER_DAYS',
        'ADVANCE_CONSULT',
        'SCHEDULED_CONSULT',
        'REMOTE_NURSING',
      ];

      for (const disp of validDispositions) {
        jest.clearAllMocks();
        const decision = {
          ...baseDecision,
          outputAction: {
            type: 'RECALCULATE_PRIORITY',
            payload: { clinicalDisposition: disp },
          },
        };

        await (service as any).executeDecision(decision, tenantId, patientId, conversationId);

        expect(mockPriorityRecalculation.recalculate).toHaveBeenCalledWith(
          patientId,
          tenantId,
          disp,
        );
      }
    });
  });

  // ---------------------------------------------------------------------------
  // recordSymptom — Bug 2: não deve chamar triggerRecalculation
  // ---------------------------------------------------------------------------
  describe('recordSymptom — sem chamada a triggerRecalculation', () => {
    const tenantId = 'tenant-a';
    const patientId = 'patient-1';
    const conversationId = 'conv-1';

    it('persiste a observation mas NÃO chama priorityRecalculationService após RECORD_SYMPTOM', async () => {
      const decision = {
        decisionType: 'SYMPTOM_RECORDED',
        reasoning: 'Febre relatada',
        confidence: 1.0,
        inputData: {},
        requiresApproval: false,
        outputAction: {
          type: 'RECORD_SYMPTOM',
          payload: { code: 'FEVER', display: 'febre', value: 'HIGH' },
        },
      };

      await (service as any).executeDecision(decision, tenantId, patientId, conversationId);

      // A observação deve ser criada no banco
      expect(mockPrisma.observation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId,
            patientId,
            code: 'FEVER',
            display: 'febre',
            valueString: 'HIGH',
          }),
        }),
      );

      // Nenhuma chamada de recálculo deve ocorrer — responsabilidade da action RECALCULATE_PRIORITY
      expect(mockPriorityRecalculation.recalculate).not.toHaveBeenCalled();
      expect(mockPriorityRecalculation.triggerRecalculation).not.toHaveBeenCalled();
    });

    it('retorna sem criar observation quando payload não tem code', async () => {
      const decision = {
        outputAction: {
          type: 'RECORD_SYMPTOM',
          payload: { display: 'febre', value: 'HIGH' }, // code ausente
        },
      };

      await (service as any).executeDecision(decision, tenantId, patientId, conversationId);

      expect(mockPrisma.observation.create).not.toHaveBeenCalled();
      expect(mockPriorityRecalculation.recalculate).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Bug 1: deduplicação de chaves lowercase/capitalizadas em structuredData.symptoms
  // ---------------------------------------------------------------------------
  describe('processIncomingMessage — deduplicação de chaves de sintomas', () => {
    const tenantId = 'tenant-a';
    const patientId = 'patient-uuid-1';
    const conversationId = 'conv-uuid-1';

    /**
     * Monta um AI response com symptomAnalysis.structuredData.symptoms contendo
     * chaves mistas e uma decision RECORD_SYMPTOM com display capitalizado,
     * depois verifica que o structuredData enviado ao channelGateway não possui
     * entradas duplicadas para o mesmo sintoma.
     */
    it('não gera chave duplicada quando AI retorna "febre" e RECORD_SYMPTOM traz "Febre"', async () => {
      // Arrange
      const mockConversation = {
        id: conversationId,
        handledBy: 'AGENT',
        channel: 'WHATSAPP',
        agentState: {},
      };

      // AI response com symptomAnalysis contendo "febre" em lowercase
      const aiResponse = {
        response: 'Febre detectada, vá ao pronto-socorro.',
        actions: [],
        symptomAnalysis: {
          structuredData: {
            symptoms: { febre: 8 }, // AI já usa lowercase
          },
        },
        newState: null,
        decisions: [
          {
            decisionType: 'SYMPTOM_RECORDED',
            reasoning: 'Febre relatada',
            confidence: 1.0,
            inputData: {},
            requiresApproval: false,
            outputAction: {
              type: 'RECORD_SYMPTOM',
              // display capitalizado — situação que gerava duplicata antes do fix
              payload: { code: 'FEVER', display: 'Febre', value: 'HIGH' },
            },
          },
        ],
      };

      // Mocks de infraestrutura
      const mockPatient = {
        id: patientId,
        tenantId,
        name: 'Paciente Teste',
        cancerType: 'BLADDER',
      };

      mockPrisma.patient.findFirst.mockResolvedValue(mockPatient);

      const conversationServiceMock = {
        findOne: jest.fn().mockResolvedValue(mockConversation),
        getRecentHistory: jest.fn().mockResolvedValue([]),
        updateState: jest.fn(),
      };

      const decisionGateMock = {
        evaluate: jest.fn().mockReturnValue({
          autoApproved: [aiResponse.decisions[0]],
          needsApproval: [],
        }),
        logDecision: jest.fn(),
      };

      const sendMessageMock = jest.fn().mockResolvedValue(undefined);
      const channelGatewayMock = { sendMessage: sendMessageMock };

      // Rebuild module com mocks específicos para este teste
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AgentService,
          { provide: PrismaService, useValue: mockPrisma },
          { provide: ConfigService, useValue: mockConfigService },
          { provide: ChannelGatewayService, useValue: channelGatewayMock },
          { provide: ConversationService, useValue: conversationServiceMock },
          { provide: DecisionGateService, useValue: decisionGateMock },
          { provide: AlertsGateway, useValue: { emitCriticalAlert: jest.fn(), emitNewAlert: jest.fn() } },
          { provide: PriorityRecalculationService, useValue: mockPriorityRecalculation },
        ],
      }).compile();

      const localService = module.get(AgentService);

      // Stub do fetch global para simular resposta do AI service
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          response: aiResponse.response,
          actions: aiResponse.actions,
          symptom_analysis: aiResponse.symptomAnalysis,
          new_state: aiResponse.newState,
          decisions: aiResponse.decisions,
        }),
      }) as any;

      try {
        // Act
        await localService.processIncomingMessage(
          patientId,
          tenantId,
          conversationId,
          'estou com febre',
        );
      } finally {
        global.fetch = originalFetch;
      }

      // Assert: channelGateway.sendMessage foi chamado
      expect(sendMessageMock).toHaveBeenCalled();

      // Extrair structuredData passado para o sendMessage
      const callArgs = sendMessageMock.mock.calls[0];
      const options = callArgs[5] as { structuredData?: any };
      const symptoms: Record<string, number> = options?.structuredData?.symptoms ?? {};

      // Deve existir somente a chave lowercase "febre"
      expect(symptoms['febre']).toBeDefined();

      // A chave capitalizada "Febre" NÃO deve existir como entrada separada
      expect(symptoms['Febre']).toBeUndefined();

      // Apenas uma entrada para o sintoma, não duas
      const febresKeys = Object.keys(symptoms).filter(
        (k) => k.toLowerCase() === 'febre',
      );
      expect(febresKeys).toHaveLength(1);
    });

    it('combina corretamente múltiplos sintomas com variações de case sem duplicar nenhum', async () => {
      // symptomAnalysis já tem "febre" e "nausea" em lowercase
      // RECORD_SYMPTOM traz "Febre" (dup) e "Dor" (nova entrada)
      const decisions = [
        {
          decisionType: 'SYMPTOM_RECORDED',
          reasoning: '',
          confidence: 1.0,
          inputData: {},
          requiresApproval: false,
          outputAction: {
            type: 'RECORD_SYMPTOM',
            payload: { code: 'FEVER', display: 'Febre', value: 'HIGH' },
          },
        },
        {
          decisionType: 'SYMPTOM_RECORDED',
          reasoning: '',
          confidence: 1.0,
          inputData: {},
          requiresApproval: false,
          outputAction: {
            type: 'RECORD_SYMPTOM',
            payload: { code: 'PAIN', display: 'Dor', value: 'CRITICAL' },
          },
        },
      ];

      const aiResponseMulti = {
        response: 'Sintomas registrados.',
        actions: [],
        symptomAnalysis: {
          structuredData: {
            symptoms: { febre: 8, nausea: 5 }, // base com lowercase
          },
        },
        newState: null,
        decisions,
      };

      const mockPatientMulti = {
        id: patientId,
        tenantId,
        name: 'Paciente Teste',
        cancerType: 'BLADDER',
      };

      mockPrisma.patient.findFirst.mockResolvedValue(mockPatientMulti);

      const decisionGateMock = {
        evaluate: jest.fn().mockReturnValue({
          autoApproved: decisions,
          needsApproval: [],
        }),
        logDecision: jest.fn(),
      };

      const sendMessageMock = jest.fn().mockResolvedValue(undefined);

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AgentService,
          { provide: PrismaService, useValue: mockPrisma },
          { provide: ConfigService, useValue: mockConfigService },
          { provide: ChannelGatewayService, useValue: { sendMessage: sendMessageMock } },
          {
            provide: ConversationService,
            useValue: {
              findOne: jest.fn().mockResolvedValue({
                id: conversationId,
                handledBy: 'AGENT',
                channel: 'WHATSAPP',
                agentState: {},
              }),
              getRecentHistory: jest.fn().mockResolvedValue([]),
              updateState: jest.fn(),
            },
          },
          { provide: DecisionGateService, useValue: decisionGateMock },
          { provide: AlertsGateway, useValue: { emitCriticalAlert: jest.fn(), emitNewAlert: jest.fn() } },
          { provide: PriorityRecalculationService, useValue: mockPriorityRecalculation },
        ],
      }).compile();

      const localService = module.get(AgentService);

      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          response: aiResponseMulti.response,
          actions: aiResponseMulti.actions,
          symptom_analysis: aiResponseMulti.symptomAnalysis,
          new_state: aiResponseMulti.newState,
          decisions: aiResponseMulti.decisions,
        }),
      }) as any;

      try {
        await localService.processIncomingMessage(
          patientId,
          tenantId,
          conversationId,
          'febre e dor',
        );
      } finally {
        global.fetch = originalFetch;
      }

      expect(sendMessageMock).toHaveBeenCalled();

      const options = sendMessageMock.mock.calls[0][5] as { structuredData?: any };
      const symptoms: Record<string, number> = options?.structuredData?.symptoms ?? {};

      // "febre" existe (lowercase), "Febre" não existe como chave separada
      expect(symptoms['febre']).toBeDefined();
      expect(symptoms['Febre']).toBeUndefined();

      // "nausea" mantida do base
      expect(symptoms['nausea']).toBeDefined();

      // "dor" (lowercase de "Dor") existe como nova entrada
      expect(symptoms['dor']).toBeDefined();

      // Exatamente 3 entradas: febre, nausea, dor
      expect(Object.keys(symptoms)).toHaveLength(3);
    });
  });
});
