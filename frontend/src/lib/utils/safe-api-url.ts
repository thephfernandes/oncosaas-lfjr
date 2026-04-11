/**
 * Monta URL absoluta para recurso sob a API base, rejeitando valores que possam
 * apontar para outro host (ex.: protocol-relative `//` ou esquemas `http:`/`https:`).
 */
export function buildSafeApiFileHref(
  apiBaseUrl: string,
  filePath: string
): string | null {
  if (!filePath || typeof filePath !== 'string') {
    return null;
  }
  const trimmed = filePath.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.startsWith('//') || trimmed.includes('://') || trimmed.includes(':')) {
    return null;
  }
  if (trimmed.includes('..')) {
    return null;
  }
  const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const base = apiBaseUrl.replace(/\/+$/, '');
  return `${base}${normalized}`;
}
