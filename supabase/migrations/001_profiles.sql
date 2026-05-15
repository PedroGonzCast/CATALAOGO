-- ============================================================
-- profiles: tabla de perfiles de usuario ligada a auth.users
-- Ejecutar en: Supabase Dashboard → SQL Editor
--
-- IMPORTANTE: si ya existe la tabla, elimínala primero:
--   DROP TABLE IF EXISTS public.profiles;
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT        NOT NULL,
  id_sistema  TEXT        NOT NULL,
  empresa     TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para búsquedas por tenant
CREATE INDEX IF NOT EXISTS profiles_id_sistema_idx ON public.profiles (id_sistema);

-- ── Row Level Security ──────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: select own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: update own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles: insert own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
