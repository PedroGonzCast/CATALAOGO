import { NextResponse } from 'next/server';

// Solo disponible en desarrollo — nunca exponer en producción
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  const FM_HOST     = process.env.FM_HOST;
  const FM_DATABASE = process.env.FM_DATABASE;
  const FM_USERNAME = process.env.FM_USERNAME;
  const FM_PASSWORD = process.env.FM_PASSWORD;
  const FM_LAYOUT   = process.env.FM_LAYOUT;

  // 1. Verificar variables de entorno
  const envCheck = {
    FM_HOST:     FM_HOST     ? `✓ ${FM_HOST}`     : '✗ NO DEFINIDO',
    FM_DATABASE: FM_DATABASE ? `✓ ${FM_DATABASE}` : '✗ NO DEFINIDO',
    FM_USERNAME: FM_USERNAME ? `✓ "${FM_USERNAME}"` : '✗ NO DEFINIDO',
    FM_PASSWORD: FM_PASSWORD ? '✓ (oculto)'       : '✗ NO DEFINIDO',
    FM_LAYOUT:   FM_LAYOUT   ? `✓ ${FM_LAYOUT}`   : '✗ NO DEFINIDO',
  };

  const missing = Object.entries(envCheck)
    .filter(([, v]) => v.startsWith('✗'))
    .map(([k]) => k);

  if (missing.length > 0) {
    return NextResponse.json({
      ok: false,
      step: 'env_vars',
      error: `Variables faltantes: ${missing.join(', ')}`,
      hint: 'Crea o edita .env.local en la raíz del proyecto y reinicia el servidor dev (npm run dev)',
      envCheck,
    });
  }

  // 2. Intentar obtener token de FileMaker
  const sessionUrl = `${FM_HOST}/fmi/data/vLatest/databases/${encodeURIComponent(FM_DATABASE!)}/sessions`;
  const credentials = Buffer.from(`${FM_USERNAME}:${FM_PASSWORD}`).toString('base64');

  let rawResponse: unknown;
  let httpStatus: number;

  try {
    const response = await fetch(sessionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${credentials}`,
      },
      body: JSON.stringify({}),
      cache: 'no-store',
    });

    httpStatus = response.status;
    rawResponse = await response.json();
  } catch (err) {
    return NextResponse.json({
      ok: false,
      step: 'network',
      error: String(err),
      hint: 'El servidor FileMaker no responde. Verifica que la URL sea correcta y el servidor esté activo.',
      sessionUrl,
      envCheck,
    });
  }

  // 3. Evaluar respuesta de FM
  const json = rawResponse as { response?: { token?: string }; messages?: Array<{ code: string; message: string }> };
  const fmCode = json?.messages?.[0]?.code;
  const fmMessage = json?.messages?.[0]?.message;
  const token = json?.response?.token;

  if (fmCode && fmCode !== '0') {
    const hints: Record<string, string> = {
      '212': 'Usuario o contraseña incorrectos. Verifica FM_USERNAME (sensible a mayúsculas) y FM_PASSWORD.',
      '802': 'Base de datos no encontrada. Verifica FM_DATABASE.',
      '960': 'Parámetro faltante. Verifica que FM_USERNAME y FM_PASSWORD no estén vacíos.',
    };

    return NextResponse.json({
      ok: false,
      step: 'filemaker_auth',
      fmCode,
      fmMessage,
      hint: hints[fmCode] ?? 'Error de FileMaker. Revisa los logs del servidor FM.',
      sessionUrl,
      httpStatus,
      rawResponse,
      envCheck,
    });
  }

  return NextResponse.json({
    ok: true,
    message: 'Conexión exitosa con FileMaker',
    tokenPreview: token ? `${token.slice(0, 8)}...` : null,
    sessionUrl,
    httpStatus,
    envCheck,
  });
}
