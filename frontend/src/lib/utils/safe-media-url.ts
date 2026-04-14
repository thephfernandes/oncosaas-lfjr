/**
 * Valida URLs usadas em atributos de mídia (`src`).
 *
 * Objetivo: evitar esquemas perigosos (ex.: `javascript:`, `data:`) e
 * reduzir risco de XSS/SSRF client-side via URLs controladas por input.
 *
 * - Aceita `http:` e `https:` absolutos
 * - Aceita caminhos relativos seguros (começando com `/`)
 * - Aceita `blob:` (gerado pelo browser) quando necessário
 * - Rejeita protocol-relative (`//...`) e qualquer outro esquema
 */
export function buildSafeMediaSrc(input: string | null | undefined): string | null {
  if (!input || typeof input !== 'string') return null;
  const raw = input.trim();
  if (!raw) return null;

  // Bloqueia URLs protocol-relative (podem apontar para outro host).
  if (raw.startsWith('//')) return null;

  // Permite blobs gerados pelo browser.
  if (raw.startsWith('blob:')) return raw;

  // Permite path relativo explícito sob a origem atual.
  if (raw.startsWith('/')) return raw;

  // Tenta validar URL absoluta.
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  return url.toString();
}

