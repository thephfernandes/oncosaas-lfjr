/**
 * Utilitário para retry com exponential backoff
 */

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number; // ms
  maxDelay: number; // ms
  backoffMultiplier: number;
}

export interface RetryOptions {
  onRetry?: (error: Error, attempt: number) => void;
  shouldRetry?: (error: Error) => boolean;
}

/**
 * Executar função com retry e exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig,
  options?: RetryOptions
): Promise<T> {
  let lastError: Error;
  let delay = config.initialDelay;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Verificar se deve tentar novamente
      if (options?.shouldRetry && !options.shouldRetry(lastError)) {
        throw lastError;
      }

      // Se não é a última tentativa, aguardar e tentar novamente
      if (attempt < config.maxRetries) {
        // Chamar callback de retry se fornecido
        if (options?.onRetry) {
          options.onRetry(lastError, attempt + 1);
        }

        // Aguardar antes de tentar novamente
        await sleep(delay);

        // Calcular próximo delay (exponential backoff)
        delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
      }
    }
  }

  // Se chegou aqui, todas as tentativas falharam
  throw lastError;
}

/**
 * Sleep utilitário
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Verificar se erro é retryable (pode tentar novamente)
 */
export function isRetryableError(error: any): boolean {
  if (!error) {
    return false;
  }

  // Erros de rede/timeout são retryable
  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    return true;
  }

  // Status HTTP específicos são retryable
  if (error.response) {
    const status = error.response.status;
    // 5xx: Erros do servidor (retryable)
    // 429: Too Many Requests (retryable)
    // 503: Service Unavailable (retryable)
    return status >= 500 || status === 429 || status === 503;
  }

  // 401 Unauthorized não é retryable (precisa refresh token)
  if (error.response?.status === 401) {
    return false;
  }

  return false;
}
