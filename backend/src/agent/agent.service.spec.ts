import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AgentService } from './agent.service';
import { PrismaService } from '../prisma/prisma.service';
import { ChannelGatewayService } from '../channel-gateway/channel-gateway.service';
import { ConversationService } from './conversation.service';
import { DecisionGateService } from './decision-gate.service';
import { AlertsGateway } from '../gateways/alerts.gateway';
import { PriorityRecalculationService } from '../oncology-navigation/priority-recalculation.service';

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
  };

  const moduleDeps = {
    providers: [
      AgentService,
      { provide: PrismaService, useValue: {} },
      { provide: ConfigService, useValue: mockConfigService },
      { provide: ChannelGatewayService, useValue: {} },
      { provide: ConversationService, useValue: {} },
      { provide: DecisionGateService, useValue: { evaluate: jest.fn() } },
      { provide: AlertsGateway, useValue: {} },
      { provide: PriorityRecalculationService, useValue: mockPriorityRecalculation },
    ],
  };

  let service: AgentService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule(moduleDeps).compile();
    service = module.get(AgentService);
  });

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
  });
});
