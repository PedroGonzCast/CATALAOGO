import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { FileMakerService } from '@/services/filemaker.service';
import type { CreateProductoPayload } from '@/types/domain/producto';

async function requireSession() {
  const session = await getSession();
  if (!session.user?.isLoggedIn) return null;
  return session.user;
}

export async function GET(request: NextRequest) {
  const user = await requireSession();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page        = Math.max(1, Number(searchParams.get('page')     ?? '1'));
  const pageSize    = Math.min(100, Math.max(1, Number(searchParams.get('pageSize') ?? '20')));
  const search      = searchParams.get('search')?.trim();
  const idCategoria = searchParams.get('idCategoria')?.trim();

  const offset = (page - 1) * pageSize + 1; // FM _find usa offset base 1
  const { idSistema } = user;

  const criteria: Record<string, string> = { idSistema };
  if (search)      criteria.nombre      = `*${search}*`;
  if (idCategoria) criteria.idCategoria = idCategoria;

  const result = await FileMakerService.findRecords(
    { query: [criteria] },
    { limit: pageSize, offset }
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error, code: result.code }, { status: 400 });
  }

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const user = await requireSession();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 });
  }

  const payload = body as CreateProductoPayload;

  if (!payload?.nombre?.trim()) {
    return NextResponse.json(
      { error: 'El campo nombre es requerido' },
      { status: 422 }
    );
  }

  // Inyectar idSistema del usuario en el registro nuevo
  const result = await FileMakerService.createRecord({
    ...payload,
    idSistema: user.idSistema,
  } as CreateProductoPayload);

  if (!result.ok) {
    return NextResponse.json({ error: result.error, code: result.code }, { status: 400 });
  }

  return NextResponse.json(result, { status: 201 });
}
