import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

export async function GET() {
  const session = await getSession();

  if (!session.user?.isLoggedIn) {
    return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    user: {
      email:     session.user.email,
      idSistema: session.user.idSistema,
    },
  });
}
