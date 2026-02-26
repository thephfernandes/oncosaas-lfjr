import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rotas públicas - permitir acesso sem autenticação
  const publicRoutes = ['/login', '/'];
  const isPublicRoute = publicRoutes.includes(pathname);

  // Para rotas protegidas, a verificação será feita no cliente
  // pois o token está no localStorage (não em cookies)
  // O middleware apenas permite acesso às rotas públicas

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
