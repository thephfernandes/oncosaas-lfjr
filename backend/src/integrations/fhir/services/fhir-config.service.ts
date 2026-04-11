import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import {
  FHIRIntegrationConfig,
  FHIRAuthConfig,
} from '../interfaces/fhir-config.interface';

function mergeAuthFromDb(
  authConfigJson: unknown,
  authTypeColumn: string
): FHIRAuthConfig {
  const raw = (authConfigJson && typeof authConfigJson === 'object'
    ? authConfigJson
    : {}) as Record<string, unknown>;
  const typeFromJson = raw.type as FHIRAuthConfig['type'] | undefined;
  const typeFromColumn = authTypeColumn as FHIRAuthConfig['type'];
  return {
    ...raw,
    type: typeFromJson ?? typeFromColumn,
  } as FHIRAuthConfig;
}

@Injectable()
export class FHIRConfigService {
  private readonly logger = new Logger(FHIRConfigService.name);
  private configCache: Map<string, FHIRIntegrationConfig> = new Map();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obter configuração FHIR para um tenant
   */
  async getConfig(tenantId: string): Promise<FHIRIntegrationConfig | null> {
    // Verificar cache
    const cached = this.configCache.get(tenantId);
    if (cached) {
      return cached;
    }

    // Buscar do banco de dados
    const dbConfig = await this.prisma.fHIRIntegrationConfig.findUnique({
      where: { tenantId },
    });

    if (!dbConfig) {
      return null;
    }

    // Converter para formato esperado (auth.type alinhado à coluna authType se JSON não trouxer)
    const config: FHIRIntegrationConfig = {
      tenantId: dbConfig.tenantId,
      enabled: dbConfig.enabled,
      baseUrl: dbConfig.baseUrl,
      auth: mergeAuthFromDb(dbConfig.authConfig, dbConfig.authType),
      syncDirection: dbConfig.syncDirection as
        | 'pull'
        | 'push'
        | 'bidirectional',
      syncFrequency: dbConfig.syncFrequency as 'realtime' | 'hourly' | 'daily',
      retryConfig: {
        maxRetries: dbConfig.maxRetries,
        initialDelay: dbConfig.initialDelay,
        maxDelay: dbConfig.maxDelay,
        backoffMultiplier: Number(dbConfig.backoffMultiplier),
      },
    };

    // Cachear
    this.configCache.set(tenantId, config);

    return config;
  }

  /**
   * Verificar se integração FHIR está habilitada para um tenant
   */
  async isEnabled(tenantId: string): Promise<boolean> {
    const config = await this.getConfig(tenantId);
    return config?.enabled === true;
  }

  /**
   * Limpar cache de configuração
   */
  clearCache(tenantId?: string): void {
    if (tenantId) {
      this.configCache.delete(tenantId);
    } else {
      this.configCache.clear();
    }
  }

  /**
   * GET API: mesma estrutura que getConfig, com segredos mascarados.
   */
  async getConfigForApiResponse(
    tenantId: string
  ): Promise<FHIRIntegrationConfig | null> {
    const config = await this.getConfig(tenantId);
    if (!config) {
      return null;
    }
    return {
      ...config,
      auth: this.redactAuthSecrets(config.auth),
    };
  }

  private redactAuthSecrets(auth: FHIRAuthConfig): FHIRAuthConfig {
    return {
      ...auth,
      clientSecret: auth.clientSecret ? '[REDACTED]' : undefined,
      password: auth.password ? '[REDACTED]' : undefined,
      apiKey: auth.apiKey ? '[REDACTED]' : undefined,
    };
  }

  /**
   * Resposta HTTP com linha Prisma: mascarar authConfig JSON.
   */
  redactAuthConfigJson(authConfig: unknown): Record<string, unknown> {
    if (!authConfig || typeof authConfig !== 'object') {
      return {};
    }
    const o = { ...(authConfig as Record<string, unknown>) };
    if (typeof o.clientSecret === 'string' && o.clientSecret.length > 0) {
      o.clientSecret = '[REDACTED]';
    }
    if (typeof o.password === 'string' && o.password.length > 0) {
      o.password = '[REDACTED]';
    }
    if (typeof o.apiKey === 'string' && o.apiKey.length > 0) {
      o.apiKey = '[REDACTED]';
    }
    return o;
  }
}
