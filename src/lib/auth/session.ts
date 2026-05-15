import { createSupabaseServerClient } from '@/lib/supabase/server';

export interface UserSession {
  id:         string;
  email:      string;
  idSistema:  string;
  empresa:    string;
  isLoggedIn: true;
}

/**
 * Devuelve la sesión del usuario autenticado.
 *
 * Estrategia:
 *  1. Lee el JWT de Supabase (verificado contra el servidor)
 *  2. Obtiene idSistema desde user_metadata (ruta rápida, sin consulta extra)
 *  3. Si user_metadata no tiene idSistema, hace fallback a la tabla profiles
 *
 * Nota: la columna en BD es id_sistema (snake_case PostgreSQL),
 * se expone como idSistema en TypeScript.
 */
export async function getSession(): Promise<{ user: UserSession | undefined }> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { user: undefined };

  let idSistema = (user.user_metadata?.idSistema as string) ?? '';
  let empresa   = (user.user_metadata?.empresa   as string) ?? '';

  // Fallback: consultar profiles si los metadatos no están completos
  if (!idSistema) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id_sistema, empresa')
      .eq('id', user.id)
      .single();

    idSistema = profile?.id_sistema ?? '';
    empresa   = profile?.empresa    ?? '';
  }

  return {
    user: {
      id:         user.id,
      email:      user.email ?? '',
      idSistema,
      empresa,
      isLoggedIn: true,
    },
  };
}
