import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { UsuariosService } from '@/services/usuarios.service';

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const { email, password } = body as { email?: string; password?: string };

  if (!email?.trim() || !password) {
    return NextResponse.json(
      { error: 'Email y contraseña son requeridos' },
      { status: 422 }
    );
  }

  // FileMaker verifica las credenciales directamente con búsqueda exacta (==)
  const result = await UsuariosService.findByCredentials(email.trim().toLowerCase(), password);

  if (!result.ok) {
    return NextResponse.json(
      { error: 'Credenciales incorrectas' },
      { status: 401 }
    );
  }

  const session = await getSession();

  session.user = {
    recordId:  result.data.recordId,
    email:     result.data.email,
    idSistema: result.data.idSistema,
    id:        result.data.id,
    isLoggedIn: true,
  };

  await session.save();

  return NextResponse.json({
    ok: true,
    user: {
      email:     session.user.email,
      idSistema: session.user.idSistema,
    },
  });
}
