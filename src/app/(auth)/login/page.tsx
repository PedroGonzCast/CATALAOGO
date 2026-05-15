'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      // Parsear JSON de forma segura — el servidor puede devolver HTML en caso de error 500
      let json: { ok: boolean; error?: string };
      try {
        json = (await res.json()) as { ok: boolean; error?: string };
      } catch {
        setError(`Error del servidor (${res.status}). Revisa los logs del servidor.`);
        return;
      }

      if (!json.ok) {
        setError(json.error ?? 'Credenciales incorrectas');
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('No se pudo conectar con el servidor. Verifica tu conexión.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm animate-fade-in">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 dark:bg-white">
          <svg className="h-6 w-6 text-white dark:text-zinc-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          FM Productos
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Ingresa tus credenciales para continuar
        </p>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@empresa.com"
              required
              autoComplete="email"
              autoFocus
              className={cn(
                'block w-full rounded-xl border px-3.5 py-2.5 text-sm transition-colors',
                'bg-white text-zinc-900 placeholder:text-zinc-400',
                'dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500',
                'border-zinc-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100',
                'dark:border-zinc-700 dark:focus:border-blue-500 dark:focus:ring-blue-900/30'
              )}
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className={cn(
                  'block w-full rounded-xl border py-2.5 pl-3.5 pr-10 text-sm transition-colors',
                  'bg-white text-zinc-900 placeholder:text-zinc-400',
                  'dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500',
                  'border-zinc-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100',
                  'dark:border-zinc-700 dark:focus:border-blue-500 dark:focus:ring-blue-900/30'
                )}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPass ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200 dark:bg-red-950/50 dark:text-red-400 dark:ring-red-900">
              <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors',
              'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100',
              'disabled:pointer-events-none disabled:opacity-50'
            )}
          >
            {isLoading && (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {isLoading ? 'Iniciando sesión…' : 'Iniciar sesión'}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
        ¿No tienes cuenta?{' '}
        <Link href="/register" className="font-medium text-zinc-900 hover:underline dark:text-zinc-100">
          Regístrate
        </Link>
      </p>

      <p className="mt-3 text-center text-xs text-zinc-400 dark:text-zinc-600">
        FM Productos · Sistema de gestión
      </p>
    </div>
  );
}
