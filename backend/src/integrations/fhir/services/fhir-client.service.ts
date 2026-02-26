import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  FHIRPatient,
  FHIRObservation,
  FHIRBundle,
  FHIRSearchParams,
} from '../interfaces/fhir-resource.interface';
import { FHIRIntegrationConfig } from '../interfaces/fhir-config.interface';
import { FHIRAuthService } from './fhir-auth.service';
import {
  retryWithBackoff,
  isRetryableError,
  RetryConfig,
} from '../utils/retry.util';

@Injectable()
export class FHIRClientService {
  private readonly logger = new Logger(FHIRClientService.name);
  private clients: Map<string, AxiosInstance> = new Map();

  constructor(private readonly authService: FHIRAuthService) {}

  /**
   * Obter cliente HTTP configurado para um tenant
   */
  private async getClient(
    config: FHIRIntegrationConfig
  ): Promise<AxiosInstance> {
    const cacheKey = config.tenantId;
    let client = this.clients.get(cacheKey);

    if (!client) {
      client = axios.create({
        baseURL: config.baseUrl,
        headers: {
          'Content-Type': 'application/fhir+json',
          Accept: 'application/fhir+json',
        },
        timeout: 30000, // 30 segundos
      });

      // Interceptor para adicionar autenticação
      client.interceptors.request.use(async (requestConfig) => {
        const token = await this.authService.getToken(config);

        if (config.auth.type === 'basic') {
          // Basic Auth já está no token como base64
          requestConfig.headers.Authorization = `Basic ${token}`;
        } else if (config.auth.type === 'apikey') {
          // API Key no header configurado
          const headerName = config.auth.apiKeyHeader || 'X-API-Key';
          requestConfig.headers[headerName] = token;
        } else {
          // OAuth 2.0
          requestConfig.headers.Authorization = `Bearer ${token}`;
        }

        return requestConfig;
      });

      // Interceptor para tratamento de erros e retry
      client.interceptors.response.use(
        (response) => response,
        async (error: AxiosError) => {
          // Se 401, tentar refresh token e retry
          if (error.response?.status === 401 && config.auth.type === 'oauth2') {
            this.authService.clearCache(config.tenantId);
            const newToken = await this.authService.getToken(config);
            if (error.config) {
              error.config.headers.Authorization = `Bearer ${newToken}`;
              return client.request(error.config);
            }
          }
          return Promise.reject(error);
        }
      );

      this.clients.set(cacheKey, client);
    }

    return client;
  }

  /**
   * Buscar paciente por ID
   */
  async getPatient(
    config: FHIRIntegrationConfig,
    patientId: string
  ): Promise<FHIRPatient> {
    const client = await this.getClient(config);
    const retryConfig: RetryConfig = config.retryConfig || {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
    };

    return retryWithBackoff(
      async () => {
        const response = await client.get<FHIRPatient>(`/Patient/${patientId}`);
        return response.data;
      },
      retryConfig,
      {
        shouldRetry: isRetryableError,
        onRetry: (error, attempt) => {
          this.logger.warn(
            `Tentativa ${attempt} de buscar paciente ${patientId} falhou`,
            error.message
          );
        },
      }
    ).catch((error) => {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw new NotFoundException(
          `Paciente ${patientId} não encontrado no EHR`
        );
      }
      throw error;
    });
  }

  /**
   * Criar ou atualizar paciente
   */
  async upsertPatient(
    config: FHIRIntegrationConfig,
    patient: FHIRPatient
  ): Promise<FHIRPatient> {
    const client = await this.getClient(config);

    try {
      if (patient.id) {
        // PUT para atualizar
        const response = await client.put<FHIRPatient>(
          `/Patient/${patient.id}`,
          patient
        );
        return response.data;
      } else {
        // POST para criar
        const response = await client.post<FHIRPatient>('/Patient', patient);
        return response.data;
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(
          'Erro ao criar/atualizar paciente',
          error.response?.data
        );
      }
      throw error;
    }
  }

  /**
   * Criar observação FHIR
   */
  async createObservation(
    config: FHIRIntegrationConfig,
    observation: FHIRObservation
  ): Promise<FHIRObservation> {
    const client = await this.getClient(config);
    const retryConfig: RetryConfig = config.retryConfig || {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
    };

    return retryWithBackoff(
      async () => {
        try {
          const response = await client.post<FHIRObservation>(
            '/Observation',
            observation
          );
          return response.data;
        } catch (error) {
          if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            if (status === 404) {
              throw new NotFoundException(
                'Paciente referenciado não existe no EHR'
              );
            }
            if (status === 409) {
              // Conflito - recurso já existe, tentar atualizar
              const existingId = this.extractIdFromLocation(
                error.response?.headers?.location
              );
              if (existingId) {
                observation.id = existingId;
                return this.updateObservation(config, observation);
              }
            }
            // Se não é retryable, lançar erro imediatamente
            if (!isRetryableError(error)) {
              this.logger.error(
                'Erro não retryable ao criar observação FHIR',
                error.response?.data
              );
              throw error;
            }
            // Se é retryable, lançar para o retry handler
            throw error;
          }
          throw error;
        }
      },
      retryConfig,
      {
        shouldRetry: isRetryableError,
        onRetry: (error, attempt) => {
          this.logger.warn(
            `Tentativa ${attempt} de criar observação FHIR falhou, tentando novamente...`,
            error.message
          );
        },
      }
    );
  }

  /**
   * Atualizar observação FHIR
   */
  async updateObservation(
    config: FHIRIntegrationConfig,
    observation: FHIRObservation
  ): Promise<FHIRObservation> {
    if (!observation.id) {
      throw new Error('ID da observação é obrigatório para atualização');
    }

    const client = await this.getClient(config);

    try {
      const response = await client.put<FHIRObservation>(
        `/Observation/${observation.id}`,
        observation
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(
          'Erro ao atualizar observação FHIR',
          error.response?.data
        );
      }
      throw error;
    }
  }

  /**
   * Buscar observações de um paciente
   */
  async searchObservations(
    config: FHIRIntegrationConfig,
    params: FHIRSearchParams
  ): Promise<FHIRBundle> {
    const client = await this.getClient(config);

    try {
      const response = await client.get<FHIRBundle>('/Observation', { params });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error('Erro ao buscar observações', error.response?.data);
      }
      throw error;
    }
  }

  /**
   * Extrair ID de uma URL de localização FHIR
   */
  private extractIdFromLocation(location?: string): string | null {
    if (!location) {
      return null;
    }
    const match = location.match(/\/(Observation|Patient)\/([^/]+)/);
    return match ? match[2] : null;
  }
}
