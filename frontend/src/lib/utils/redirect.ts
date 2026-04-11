/**
 * Returns a safe in-app redirect destination.
 * Falls back to dashboard for missing or unsafe values.
 */
export function getSafeRedirectTarget(redirectParam: string | null): string {
  if (!redirectParam) {
    return '/dashboard';
  }

  const decoded = (() => {
    try {
      return decodeURIComponent(redirectParam);
    } catch {
      return redirectParam;
    }
  })();

  // Apenas paths relativos ao app; bloqueia open redirect e esquemas.
  if (
    !decoded.startsWith('/') ||
    decoded.startsWith('//') ||
    decoded.includes(':\\') ||
    decoded.includes('\\') ||
    /[\u0000-\u001f\u007f]/.test(decoded)
  ) {
    return '/dashboard';
  }

  return decoded;
}
