import { getIronSession, type SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';
import type { AppSession } from '@/types/domain/usuario';

export type { AppSession };

export const sessionOptions: SessionOptions = {
  // Requiere mínimo 32 caracteres aleatorios en SESSION_SECRET
  password: process.env.SESSION_SECRET!,
  cookieName: 'fmsys-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8 horas
  },
};

// Helper para Server Components y Route Handlers (Node.js runtime)
export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<AppSession>(cookieStore, sessionOptions);
}
