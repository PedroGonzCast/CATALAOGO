import { NextRequest, NextResponse } from 'next/server';
import { FileMakerService } from '@/services/filemaker.service';
import type { UpdateProductoPayload } from '@/types/domain/producto';

type RouteParams = { params: Promise<{ recordId: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { recordId } = await params;
  const result = await FileMakerService.getRecordById(recordId);

  if (!result.ok) {
    const status = result.code === '401' ? 404 : 400;
    return NextResponse.json({ error: result.error, code: result.code }, { status });
  }

  return NextResponse.json(result);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { recordId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 });
  }

  const result = await FileMakerService.updateRecord(recordId, body as UpdateProductoPayload);

  if (!result.ok) {
    return NextResponse.json({ error: result.error, code: result.code }, { status: 400 });
  }

  return NextResponse.json(result);
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { recordId } = await params;
  const result = await FileMakerService.deleteRecord(recordId);

  if (!result.ok) {
    const status = result.code === '401' ? 404 : 400;
    return NextResponse.json({ error: result.error, code: result.code }, { status });
  }

  return NextResponse.json({ ok: true });
}
