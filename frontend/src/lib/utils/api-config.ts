/**
 * Utilitário para detectar automaticamente o protocolo (HTTP/HTTPS)
 * e construir URLs da API e WebSocket dinamicamente.
 *
 * Funciona tanto em desenvolvimento (HTTP) quanto em produção/HTTPS.
 */

/**
 * Quando `true`, o browser usa `/api/v1` (rewrite no Next → Nest). Cookies de sessão
 * ficam na mesma origem do app; o middleware pode validar `access_token` HttpOnly.
 */
export function isRelativeApiEnabled(): boolean {
  return process.env.NEXT_PUBLIC_USE_RELATIVE_API === 'true';
}

/**
 * URL absoluta do backend (SSR, Docker, scripts Node). Não usar no HTML do browser quando em modo relativo.
 */
export function getBackendInternalUrl(): string {
  const fromEnv =
    process.env.BACKEND_URL ||
    (process.env.NEXT_PUBLIC_API_URL &&
    (process.env.NEXT_PUBLIC_API_URL.startsWith('http://') ||
      process.env.NEXT_PUBLIC_API_URL.startsWith('https://'))
      ? process.env.NEXT_PUBLIC_API_URL
      : '');
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '');
  }
  const protocol = detectProtocol();
  const port = process.env.NEXT_PUBLIC_API_PORT || '3002';
  return `${protocol}://localhost:${port}`;
}

/**
 * Detecta o protocolo baseado na URL atual do navegador
 * @returns 'https' ou 'http'
 */
function detectProtocol(): 'https' | 'http' {
  if (typeof window === 'undefined') {
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    if (envUrl?.startsWith('https://')) {
      return 'https';
    }
    return 'http';
  }

  const protocol = window.location.protocol;
  return protocol === 'https:' ? 'https' : 'http';
}

/**
 * Páginas HTTPS não podem chamar API HTTP nem usar WebSocket `ws:` (mixed content).
 * Quando a env aponta para `http://` ou `ws://` e a página está em HTTPS, alinha para TLS.
 */
function alignUrlWithPageSecurity(url: string): string {
  if (typeof window === 'undefined') return url;
  if (window.location.protocol !== 'https:') return url;
  if (url.startsWith('http://')) {
    return `https://${url.slice('http://'.length)}`;
  }
  if (url.startsWith('ws://')) {
    return `wss://${url.slice('ws://'.length)}`;
  }
  return url;
}

/**
 * Base URL pública da API (browser com rewrite → string vazia; caso contrário URL absoluta do Nest).
 */
export function getApiUrl(): string {
  if (isRelativeApiEnabled()) {
    return '';
  }

  const envUrl = process.env.NEXT_PUBLIC_API_URL;

  if (
    envUrl &&
    (envUrl.startsWith('http://') || envUrl.startsWith('https://'))
  ) {
    return alignUrlWithPageSecurity(envUrl);
  }

  const protocol = detectProtocol();
  const port = process.env.NEXT_PUBLIC_API_PORT || '3002';
  return `${protocol}://localhost:${port}`;
}

/**
 * Base usada pelo Axios: no servidor Node com API relativa, chama o Nest diretamente.
 */
export function getApiUrlForAxios(): string {
  if (isRelativeApiEnabled() && typeof window === 'undefined') {
    return getBackendInternalUrl();
  }
  return getApiUrl();
}

/**
 * Obtém a URL base do WebSocket
 * Prioridade:
 * 1. Variável de ambiente NEXT_PUBLIC_WS_URL (se definida e completa)
 * 2. Protocolo detectado (ws/wss) + localhost:3002
 */
export function getWebSocketUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_WS_URL;

  if (envUrl && (envUrl.startsWith('ws://') || envUrl.startsWith('wss://'))) {
    return alignUrlWithPageSecurity(envUrl);
  }

  const protocol = detectProtocol();
  const wsProtocol = protocol === 'https' ? 'wss' : 'ws';
  const port = process.env.NEXT_PUBLIC_API_PORT || '3002';
  return `${wsProtocol}://localhost:${port}`;
}
