import type { Request } from 'express';
import { ACCESS_TOKEN_COOKIE } from '@/auth/auth-cookies.util';
import { extractAccessJwtFromHttpRequest } from './http-jwt.extractor';

function req(partial: Partial<Request>): Request {
  return partial as Request;
}

describe('extractAccessJwtFromHttpRequest', () => {
  it('prefere cookie (mesma ordem do JwtStrategy)', () => {
    const jwtCookie = 'jwt-from-cookie';
    const jwtBearer = 'jwt-from-bearer';
    const r = req({
      cookies: { [ACCESS_TOKEN_COOKIE]: jwtCookie },
      headers: { authorization: `Bearer ${jwtBearer}` },
    });
    expect(extractAccessJwtFromHttpRequest(r)).toBe(jwtCookie);
  });

  it('usa Bearer quando não há cookie', () => {
    const jwtBearer = 'only-bearer';
    const r = req({
      cookies: {},
      headers: { authorization: `Bearer ${jwtBearer}` },
    });
    expect(extractAccessJwtFromHttpRequest(r)).toBe(jwtBearer);
  });

  it('retorna null sem token', () => {
    expect(extractAccessJwtFromHttpRequest(req({ cookies: {}, headers: {} }))).toBeNull();
  });
});
