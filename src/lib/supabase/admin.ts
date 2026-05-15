import { createClient } from '@supabase/supabase-js';

/**
 * Cliente Supabase con service role key.
 * Bypasea RLS — usar SOLO en rutas de servidor de confianza (Route Handlers).
 * NUNCA exponer al cliente/browser.
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession:   false,
    },
  }
);
