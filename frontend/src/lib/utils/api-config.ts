/**
 * Utilitário para detectar automaticamente o protocolo (HTTP/HTTPS)
 * e construir URLs da API e WebSocket dinamicamente.
 *
 * Funciona tanto em desenvolvimento (HTTP) quanto em produção/HTTPS.
 */

/**
 * Detecta o protocolo baseado na URL atual do navegador
 * @returns 'https' ou 'http'
 */
function detectProtocol(): 'https' | 'http' {
  // No servidor (SSR), usar variável de ambiente ou padrão HTTP
  if (typeof window === 'undefined') {
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    if (envUrl?.startsWith('https://')) {
      return 'https';
    }
    return 'http';
  }

  // No cliente, detectar do protocolo atual da página
  const protocol = window.location.protocol;
  return protocol === 'https:' ? 'https' : 'http';
}

/**
 * Obtém a URL base da API
 * Prioridade:
 * 1. No navegador: alinhar protocolo ao da página (evita HTTP quando a página é HTTPS)
 * 2. Variável de ambiente NEXT_PUBLIC_API_URL (se definida e completa)
 * 3. Protocolo detectado + localhost:3002
 */
export function getApiUrl(): string {
  const port = process.env.NEXT_PUBLIC_API_PORT || '3002';
  const baseHost = `localhost:${port}`;

  // No navegador: usar o mesmo protocolo da página para evitar mixed content (HTTPS página → HTTP API)
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    return `${protocol}//${baseHost}`;
  }

  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (
    envUrl &&
    (envUrl.startsWith('http://') || envUrl.startsWith('https://'))
  ) {
    return envUrl;
  }

  const protocol = detectProtocol();
  return `${protocol}://${baseHost}`;
}

/**
 * Obtém a URL base do WebSocket
 * Prioridade:
 * 1. No navegador: alinhar protocolo ao da página (wss quando a página é HTTPS)
 * 2. Variável de ambiente NEXT_PUBLIC_WS_URL (se definida e completa)
 * 3. Protocolo detectado (ws/wss) + localhost:3002
 */
export function getWebSocketUrl(): string {
  const port = process.env.NEXT_PUBLIC_API_PORT || '3002';
  const baseHost = `localhost:${port}`;

  if (typeof window !== 'undefined') {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    return `${wsProtocol}://${baseHost}`;
  }

  const envUrl = process.env.NEXT_PUBLIC_WS_URL;
  if (envUrl && (envUrl.startsWith('ws://') || envUrl.startsWith('wss://'))) {
    return envUrl;
  }

  const protocol = detectProtocol();
  const wsProtocol = protocol === 'https' ? 'wss' : 'ws';
  return `${wsProtocol}://${baseHost}`;
}
