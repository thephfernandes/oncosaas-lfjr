import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = new Set([
  '/login',
  '/register',
  '/',
  '/termos',
  '/privacidade',
  '/forgot-password',
]);

function isResetPasswordRoute(pathname: string): boolean {
  return /^\/reset-password\/[^/]+$/.test(pathname);
}

const SESSION_PROBE_PATH = '/api/v1/auth/profile';
const SESSION_PROBE_TIMEOUT_MS = 2000;

async function hasActiveSession(request: NextRequest): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SESSION_PROBE_TIMEOUT_MS);

  try {
    const url = new URL(SESSION_PROBE_PATH, request.url);
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        // Importante: repassar cookies para o backend validar `access_token`/`refresh_token` HttpOnly.
        cookie: request.headers.get('cookie') ?? '',
      },
      cache: 'no-store',
      signal: controller.signal,
    });

    return res.ok;
  } catch {
    // Falha segura: erro/timeout no probe => exigir novo login.
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_ROUTES.has(pathname) || isResetPasswordRoute(pathname)) {
    return NextResponse.next();
  }

  const sessionActive = await hasActiveSession(request);

  if (!sessionActive) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
