import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { CategoriasService } from '@/services/categorias.service';

export async function GET() {
  const session = await getSession();
  if (!session.user?.isLoggedIn) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const result = await CategoriasService.getAll();

  if (!result.ok) {
    return NextResponse.json({ error: result.error, code: result.code }, { status: 400 });
  }

  return NextResponse.json(result);
}
