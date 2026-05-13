import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { unsealData } from 'iron-session';
import type { AppSession } from '@/types/domain/usuario';

// Rutas que requieren sesión activa
const PROTECTED = ['/dashboard'];
// Rutas solo para no autenticados
const AUTH_ONLY = ['/login'];

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sealed = request.cookies.get('fmsys-session')?.value;
  let isLoggedIn = false;

  if (sealed) {
    try {
      const data = await unsealData<AppSession>(sealed, {
        password: process.env.SESSION_SECRET!,
      });
      isLoggedIn = data.user?.isLoggedIn === true;
    } catch {
      // Cookie inválida o expirada — tratar como no autenticado
    }
  }

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  const isAuthOnly  = AUTH_ONLY.some((p) => pathname.startsWith(p));

  // No autenticado intentando acceder a ruta protegida → login
  if (isProtected && !isLoggedIn) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Ya autenticado intentando acceder a login → dashboard
  if (isAuthOnly && isLoggedIn) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
