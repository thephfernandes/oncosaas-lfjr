import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@/prisma/prisma.service';
import { FHIRConfigService } from './fhir-config.service';

const baseRow = {
  tenantId: 'tenant-1',
  enabled: true,
  baseUrl: 'https://fhir.example/fhir',
  syncDirection: 'pull' as const,
  syncFrequency: 'hourly' as const,
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
};

describe('FHIRConfigService', () => {
  let service: FHIRConfigService;
  let findUnique: jest.Mock;

  beforeEach(async () => {
    findUnique = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FHIRConfigService,
        {
          provide: PrismaService,
          useValue: {
            fHIRIntegrationConfig: { findUnique },
          },
        },
      ],
    }).compile();

    service = module.get(FHIRConfigService);
    service.clearCache();
  });

  describe('getConfig', () => {
    it('usa authType da coluna quando JSON não define type', async () => {
      findUnique.mockResolvedValue({
        ...baseRow,
        authConfig: { clientId: 'c1' },
        authType: 'oauth2',
      });

      const config = await service.getConfig('tenant-1');
      expect(config?.auth.type).toBe('oauth2');
      expect(config?.auth.clientId).toBe('c1');
    });

    it('prefere type do JSON quando presente', async () => {
      findUnique.mockResolvedValue({
        ...baseRow,
        authConfig: { type: 'basic', username: 'u', password: 'p' },
        authType: 'oauth2',
      });

      const config = await service.getConfig('tenant-1');
      expect(config?.auth.type).toBe('basic');
    });
  });

  describe('getConfigForApiResponse', () => {
    it('mascara segredos na resposta', async () => {
      findUnique.mockResolvedValue({
        ...baseRow,
        authConfig: {
          type: 'oauth2',
          clientId: 'id',
          clientSecret: 'secret-val',
        },
        authType: 'oauth2',
      });

      const api = await service.getConfigForApiResponse('tenant-1');
      expect(api?.auth.clientId).toBe('id');
      expect(api?.auth.clientSecret).toBe('[REDACTED]');
    });
  });

  describe('redactAuthConfigJson', () => {
    it('mascara clientSecret, password e apiKey', () => {
      const out = service.redactAuthConfigJson({
        clientId: 'pub',
        clientSecret: 'sec',
        password: 'pw',
        apiKey: 'k',
      });
      expect(out.clientId).toBe('pub');
      expect(out.clientSecret).toBe('[REDACTED]');
      expect(out.password).toBe('[REDACTED]');
      expect(out.apiKey).toBe('[REDACTED]');
    });

    it('retorna objeto vazio para entrada inválida', () => {
      expect(service.redactAuthConfigJson(null)).toEqual({});
      expect(service.redactAuthConfigJson(undefined)).toEqual({});
    });
  });
});
