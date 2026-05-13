import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSession } from '@/lib/auth/session';
import { s3, S3_BUCKET, buildS3Url } from '@/lib/aws/s3';

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session.user?.isLoggedIn) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Formato de body inválido' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Formato no permitido. Usa JPG, PNG, WEBP o GIF' },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'La imagen no puede superar 5 MB' }, { status: 400 });
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const key = `productos/${session.user.idSistema}/${uniqueSuffix}.${ext}`;

  let buffer: Buffer;
  try {
    buffer = Buffer.from(await file.arrayBuffer());
  } catch {
    return NextResponse.json({ error: 'No se pudo leer el archivo' }, { status: 400 });
  }

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket:      S3_BUCKET,
        Key:         key,
        Body:        buffer,
        ContentType: file.type,
      })
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al conectar con S3';
    console.error('[upload] S3 error:', message);
    return NextResponse.json({ error: `Error al subir la imagen: ${message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true, url: buildS3Url(key) });
}
