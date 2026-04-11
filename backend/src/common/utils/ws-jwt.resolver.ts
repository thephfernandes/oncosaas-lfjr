import type { Socket } from 'socket.io';
import { RedisService } from '../../redis/redis.service';
import { extractJwtFromSocketHandshake } from './ws-jwt.extractor';

const TICKET_HEX = /^[a-f0-9]{48}$/i;

/**
 * Resolve JWT para o handshake: Bearer/cookie direto ou ticket de uso único (Redis).
 */
export async function resolveSocketJwt(
  client: Socket,
  redis: RedisService
): Promise<string | null> {
  const direct = extractJwtFromSocketHandshake(client);
  if (direct) {
    return direct;
  }

  const ticket = client.handshake.auth?.ticket as string | undefined;
  if (!ticket || !TICKET_HEX.test(ticket)) {
    return null;
  }

  const key = `wst:${ticket}`;
  const jwt = await redis.get(key);
  if (jwt) {
    await redis.del(key);
  }
  return jwt;
}
