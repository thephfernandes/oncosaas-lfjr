import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import {
  FHIRIntegrationConfig,
  FHIRAuthConfig,
} from '../interfaces/fhir-config.interface';

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

    // Converter para formato esperado
    const config: FHIRIntegrationConfig = {
      tenantId: dbConfig.tenantId,
      enabled: dbConfig.enabled,
      baseUrl: dbConfig.baseUrl,
      auth: dbConfig.authConfig as any,
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
}
