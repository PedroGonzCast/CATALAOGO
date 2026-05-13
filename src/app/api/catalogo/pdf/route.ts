import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { getSession } from '@/lib/auth/session';
import { FileMakerService } from '@/services/filemaker.service';
import { CategoriasService } from '@/services/categorias.service';
import { CatalogoPDF } from '@/lib/pdf/catalogo-document';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session.user?.isLoggedIn) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { idSistema } = session.user;
  const { searchParams } = new URL(request.url);
  const idCategoria = searchParams.get('idCategoria')?.trim() || undefined;

  // Traer productos de FileMaker filtrados por sistema y categoría
  const criteria: Record<string, string> = { idSistema };
  if (idCategoria) criteria.idCategoria = idCategoria;

  const result = await FileMakerService.findRecords(
    { query: [criteria] },
    { limit: 500, offset: 1 }
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? 'Error al obtener productos' }, { status: 400 });
  }

  // Resolver nombre de la categoría si se filtra
  let categoriaNombre: string | undefined;
  if (idCategoria) {
    const cats = await CategoriasService.getAll();
    if (cats.ok) {
      categoriaNombre = cats.data.find((c) => c.id === idCategoria)?.nombre;
    }
  }

  const fecha = new Date().toLocaleDateString('es-CO', {
    year:  'numeric',
    month: 'long',
    day:   'numeric',
  });

  let buffer: Buffer;
  try {
    buffer = await renderToBuffer(
      React.createElement(CatalogoPDF, {
        products:       result.data,
        sistemaId:      idSistema,
        fecha,
        categoriaNombre,
      })
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al generar el PDF';
    console.error('[catalogo/pdf]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const filename = `catalogo-${new Date().toISOString().slice(0, 10)}.pdf`;

  return new NextResponse(buffer, {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length':      String(buffer.length),
    },
  });
}
