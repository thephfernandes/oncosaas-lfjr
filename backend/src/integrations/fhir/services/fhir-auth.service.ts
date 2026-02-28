import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import {
  FHIRAuthConfig,
  FHIRIntegrationConfig,
  FHIRToken,
} from '../interfaces/fhir-config.interface';

@Injectable()
export class FHIRAuthService {
  private readonly logger = new Logger(FHIRAuthService.name);
  private tokenCache: Map<string, FHIRToken> = new Map();

  constructor(private readonly configService: ConfigService) {}

  /**
   * Obter token de autenticação para um tenant
   */
  async getToken(config: FHIRIntegrationConfig): Promise<string> {
    const cacheKey = config.tenantId;
    const cachedToken = this.tokenCache.get(cacheKey);

    // Verificar se token está válido (com margem de 5 minutos)
    if (
      cachedToken &&
      cachedToken.expiresAt > new Date(Date.now() + 5 * 60 * 1000)
    ) {
      return cachedToken.accessToken;
    }

    // Obter novo token
    const token = await this.authenticate(config.auth, config.baseUrl);
    this.tokenCache.set(cacheKey, token);

    return token.accessToken;
  }

  /**
   * Autenticar conforme tipo configurado
   */
  private async authenticate(
    authConfig: FHIRAuthConfig,
    baseUrl: string
  ): Promise<FHIRToken> {
    switch (authConfig.type) {
      case 'oauth2':
        return this.authenticateOAuth2(authConfig, baseUrl);
      case 'basic':
        return this.authenticateBasic(authConfig);
      case 'apikey':
        return this.authenticateApiKey(authConfig);
      default:
        throw new Error(
          `Tipo de autenticação não suportado: ${authConfig.type}`
        );
    }
  }

  /**
   * Autenticação OAuth 2.0
   */
  private async authenticateOAuth2(
    authConfig: FHIRAuthConfig,
    baseUrl: string
  ): Promise<FHIRToken> {
    if (
      !authConfig.clientId ||
      !authConfig.clientSecret ||
      !authConfig.tokenUrl
    ) {
      throw new Error('Configuração OAuth 2.0 incompleta');
    }

    try {
      const response = await axios.post(
        authConfig.tokenUrl,
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: authConfig.clientId,
          client_secret: authConfig.clientSecret,
          scope: authConfig.scope || 'system/*.read system/*.write',
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const expiresIn = response.data.expires_in || 3600; // Default 1 hora
      const expiresAt = new Date(Date.now() + expiresIn * 1000);

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresAt,
        tokenType: response.data.token_type || 'Bearer',
      };
    } catch (error) {
      this.logger.error('Erro ao autenticar OAuth 2.0', error);
      throw new Error(`Falha na autenticação OAuth 2.0: ${error.message}`);
    }
  }

  /**
   * Autenticação Basic Auth
   */
  private async authenticateBasic(
    authConfig: FHIRAuthConfig
  ): Promise<FHIRToken> {
    if (!authConfig.username || !authConfig.password) {
      throw new Error('Configuração Basic Auth incompleta');
    }

    // Basic Auth não precisa de token, retornar token dummy
    // O cliente HTTP vai usar Basic Auth diretamente
    return {
      accessToken: Buffer.from(
        `${authConfig.username}:${authConfig.password}`
      ).toString('base64'),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
      tokenType: 'Basic',
    };
  }

  /**
   * Autenticação API Key
   */
  private async authenticateApiKey(
    authConfig: FHIRAuthConfig
  ): Promise<FHIRToken> {
    if (!authConfig.apiKey) {
      throw new Error('API Key não configurada');
    }

    // API Key não expira (ou expira muito longe)
    return {
      accessToken: authConfig.apiKey,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 ano
      tokenType: 'ApiKey',
    };
  }

  /**
   * Limpar cache de tokens
   */
  clearCache(tenantId?: string): void {
    if (tenantId) {
      this.tokenCache.delete(tenantId);
    } else {
      this.tokenCache.clear();
    }
  }
}
