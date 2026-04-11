import type { Response } from 'express';

/** Nome do cookie HttpOnly com o refresh token (enviado só para rotas sob /api/v1/auth). */
export const REFRESH_TOKEN_COOKIE = 'refresh_token';

/** Nome do cookie HttpOnly com o access token (JWT) para chamadas à API em /api/v1). */
export const ACCESS_TOKEN_COOKIE = 'access_token';

const AUTH_COOKIE_PATH = '/api/v1/auth';
/** Path amplo para o JWT: enviado em `/api/v1/*`, Socket.io e demais rotas do mesmo host. */
const ACCESS_TOKEN_PATH = '/';

function cookieSecureFlag(): boolean {
  return (
    process.env.NODE_ENV === 'production' || process.env.USE_HTTPS === 'true'
  );
}

/** Converte JWT_EXPIRES_IN estilo Nest (ex.: 24h, 7d, 3600s) para milissegundos. */
export function jwtExpiresInToMs(expiresIn?: string): number {
  const v = (expiresIn || process.env.JWT_EXPIRES_IN || '24h').trim();
  const m = /^(\d+)([smhd])$/i.exec(v);
  if (!m) {
    return 24 * 60 * 60 * 1000;
  }
  const n = parseInt(m[1], 10);
  const u = m[2].toLowerCase();
  const mult =
    u === 's' ? 1000 : u === 'm' ? 60_000 : u === 'h' ? 3_600_000 : 86_400_000;
  return n * mult;
}

export function setRefreshTokenCookie(res: Response, refreshToken: string): void {
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    secure: cookieSecureFlag(),
    sameSite: 'lax',
    path: AUTH_COOKIE_PATH,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias — alinhado ao TTL Redis do refresh
  });
}

export function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    httpOnly: true,
    secure: cookieSecureFlag(),
    sameSite: 'lax',
    path: AUTH_COOKIE_PATH,
  });
}

export function setAccessTokenCookie(res: Response, accessToken: string): void {
  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure: cookieSecureFlag(),
    sameSite: 'lax',
    path: ACCESS_TOKEN_PATH,
    maxAge: jwtExpiresInToMs(),
  });
}

export function clearAccessTokenCookie(res: Response): void {
  res.clearCookie(ACCESS_TOKEN_COOKIE, {
    httpOnly: true,
    secure: cookieSecureFlag(),
    sameSite: 'lax',
    path: ACCESS_TOKEN_PATH,
  });
}
