/**
 * Valida segmentos do path do proxy /api/v1/[[...path]] antes de concatenar em URL do backend.
 */
export function isUnsafeApiPathSegment(segment: string): boolean {
  if (!segment) {
    return true;
  }
  if (segment === '..' || segment === '.') {
    return true;
  }
  if (segment.includes('\0')) {
    return true;
  }
  const lower = segment.toLowerCase();
  if (lower.includes('%2e')) {
    return true;
  }
  return false;
}

export function hasUnsafeApiPathSegments(pathParts: string[] | undefined): boolean {
  if (!pathParts?.length) {
    return false;
  }
  return pathParts.some((p) => isUnsafeApiPathSegment(p));
}
