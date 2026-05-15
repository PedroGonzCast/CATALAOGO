import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { ConfSistemaService } from '@/services/conf-sistema.service';
import { UsuariosFMService } from '@/services/usuarios-fm.service';

export async function POST(request: NextRequest) {
  try {
    // ── 1. Parsear y validar body ─────────────────────────────────────────────
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
    }

    const { email, password, empresa } = body as {
      email?:    string;
      password?: string;
      empresa?:  string;
    };

    if (!email?.trim()) {
      return NextResponse.json({ error: 'El email es requerido' }, { status: 422 });
    }
    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 422 }
      );
    }
    if (!empresa?.trim()) {
      return NextResponse.json({ error: 'El nombre de la empresa es requerido' }, { status: 422 });
    }

    const emailNorm   = email.trim().toLowerCase();
    const empresaNorm = empresa.trim();

    // ── 2. Crear empresa en FileMaker → obtener idSistema ─────────────────────
    const sistemaResult = await ConfSistemaService.create(empresaNorm);
    if (!sistemaResult.ok) {
      console.error('[register] FM confSistema error:', sistemaResult.error);
      return NextResponse.json(
        { error: `No se pudo registrar la empresa en FileMaker: ${sistemaResult.error}` },
        { status: 502 }
      );
    }

    const { idSistema } = sistemaResult.data;

    // ── 3. Crear usuario en Supabase Auth (vía admin) ─────────────────────────
    // Usamos el cliente admin con email_confirm: true para:
    //  - Evitar el envío de email de confirmación (elimina el rate limit)
    //  - Crear la cuenta como activa de inmediato
    //  - Guardar idSistema y empresa en user_metadata desde el inicio
    const { data: adminData, error: adminError } = await supabaseAdmin.auth.admin.createUser({
      email:         emailNorm,
      password,
      email_confirm: true,
      user_metadata: {
        idSistema,
        empresa: empresaNorm,
      },
    });

    if (adminError || !adminData.user) {
      console.error('[register] Supabase admin.createUser error:', adminError?.message);
      return NextResponse.json(
        { error: adminError?.message ?? 'Error al crear el usuario' },
        { status: 400 }
      );
    }

    const userId = adminData.user.id;

    // ── 4. Crear usuario en Tabla_Usuarios de FileMaker ───────────────────────
    const fmUserResult = await UsuariosFMService.create({
      email:     emailNorm,
      idSistema,
    });

    if (!fmUserResult.ok) {
      console.error('[register] FM Tabla_Usuarios error:', fmUserResult.error);
    }

    // ── 5. Insertar perfil en Supabase (tabla profiles) ───────────────────────
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id:         userId,
        email:      emailNorm,
        id_sistema: idSistema,   // snake_case — nombre real de la columna en PostgreSQL
        empresa:    empresaNorm,
      });

    if (profileError) {
      console.error('[register] profiles insert error:', profileError);
      // Eliminar el usuario de Supabase Auth para no dejar estado inconsistente
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: `Error al guardar el perfil: ${profileError.message}` },
        { status: 500 }
      );
    }

    // ── 6. Iniciar sesión automáticamente con las credenciales recién creadas ──
    // Como el usuario ya está confirmado, podemos hacer signIn directamente
    // para que quede autenticado sin pasos extra.
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signInWithPassword({ email: emailNorm, password });

    return NextResponse.json({
      ok:   true,
      user: {
        email:     emailNorm,
        idSistema,
        empresa:   empresaNorm,
      },
    }, { status: 201 });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error interno';
    console.error('[register]', message);
    return NextResponse.json({ error: `Error del servidor: ${message}` }, { status: 500 });
  }
}
