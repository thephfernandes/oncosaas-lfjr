import type { Request } from 'express';
import { ACCESS_TOKEN_COOKIE } from '@/auth/auth-cookies.util';

/**
 * Alinhado ao JwtStrategy: cookie access_token ou Authorization Bearer.
 * Usar onde o raw JWT é necessário após JwtAuthGuard (ex.: socket-ticket → Redis).
 */
export function extractAccessJwtFromHttpRequest(req: Request): string | null {
  const fromCookie = req.cookies?.[ACCESS_TOKEN_COOKIE];
  if (typeof fromCookie === 'string' && fromCookie.length > 0) {
    return fromCookie;
  }
  const authHeader = req.headers?.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    return token.length > 0 ? token : null;
  }
  return null;
}
