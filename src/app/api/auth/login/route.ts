import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
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

    const supabase = await createSupabaseServerClient();

    // ── 1. Autenticar con Supabase ────────────────────────────────────────────
    const { data, error } = await supabase.auth.signInWithPassword({
      email:    email.trim().toLowerCase(),
      password,
    });

    if (error || !data.user) {
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
    }

    // ── 2. Obtener idSistema y empresa ────────────────────────────────────────
    // Ruta rápida: desde user_metadata (sin consulta extra a BD).
    // Fallback: consultar profiles si los metadatos no están presentes.
    let idSistema = (data.user.user_metadata?.idSistema as string) ?? '';
    let empresa   = (data.user.user_metadata?.empresa   as string) ?? '';

    if (!idSistema) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id_sistema, empresa')
        .eq('id', data.user.id)
        .single();

      idSistema = profile?.id_sistema ?? '';
      empresa   = profile?.empresa    ?? '';
    }

    return NextResponse.json({
      ok:   true,
      user: {
        email:     data.user.email,
        idSistema,
        empresa,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error interno';
    console.error('[login]', message);
    return NextResponse.json({ error: `Error del servidor: ${message}` }, { status: 500 });
  }
}
