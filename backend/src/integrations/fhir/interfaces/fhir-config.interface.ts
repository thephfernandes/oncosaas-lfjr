/**
 * Configuração de integração FHIR por tenant
 */

export interface FHIRAuthConfig {
  type: 'oauth2' | 'basic' | 'apikey';
  // OAuth 2.0
  clientId?: string;
  clientSecret?: string;
  tokenUrl?: string;
  scope?: string;
  // Basic Auth
  username?: string;
  password?: string;
  // API Key
  apiKey?: string;
  apiKeyHeader?: string; // Nome do header (ex: 'X-API-Key')
}

export interface FHIRIntegrationConfig {
  tenantId: string;
  enabled: boolean;
  baseUrl: string;
  auth: FHIRAuthConfig;
  syncDirection: 'pull' | 'push' | 'bidirectional';
  syncFrequency: 'realtime' | 'hourly' | 'daily';
  retryConfig?: {
    maxRetries: number;
    initialDelay: number; // ms
    maxDelay: number; // ms
    backoffMultiplier: number;
  };
}

export interface FHIRToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  tokenType: string;
}
