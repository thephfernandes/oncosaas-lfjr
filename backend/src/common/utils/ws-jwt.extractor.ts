import { parse } from 'cookie';
import type { Socket } from 'socket.io';
import { ACCESS_TOKEN_COOKIE } from '@/auth/auth-cookies.util';

/**
 * Obtém JWT do handshake Socket.io: auth.token, Authorization ou cookie access_token.
 */
export function extractJwtFromSocketHandshake(client: Socket): string | null {
  const fromAuth = client.handshake.auth?.token as string | undefined;
  const authHeader = client.handshake.headers?.authorization;
  const fromBearer =
    typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : undefined;
  const raw = client.handshake.headers?.cookie;
  let fromCookie: string | undefined;
  if (raw && typeof raw === 'string') {
    fromCookie = parse(raw)[ACCESS_TOKEN_COOKIE];
  }
  return fromAuth || fromBearer || fromCookie || null;
}
