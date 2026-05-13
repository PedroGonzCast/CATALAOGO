import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { FileMakerService } from '@/services/filemaker.service';
import { StatsCards } from '@/components/features/productos/stats-cards';
import { ProductosTable } from '@/components/features/productos/productos-table';
import { CatalogoButton } from '@/components/features/catalogo/catalogo-button';

// Siempre renderizar fresco — sin caché estático, datos en tiempo real de FM
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // Leer sesión — middleware ya garantiza que el usuario está autenticado,
  // pero leemos igualmente para obtener idSistema.
  const session = await getSession();
  if (!session.user?.isLoggedIn) redirect('/login');

  const { idSistema, email } = session.user;

  // Server Component: fetch inicial filtrado por idSistema usando _find
  const result = await FileMakerService.findRecords({ query: [{ idSistema }] });

  const productos = result.ok ? result.data : [];
  const total     = result.ok ? (result.total ?? 0) : 0;
  const hasError  = !result.ok;

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Inventario de Productos
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {email} · sistema{' '}
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              {idSistema}
            </code>
          </p>
        </div>
      </div>

      {/* Error de conexión con FM */}
      {hasError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
          <div className="flex items-start gap-3">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="space-y-1">
              <p className="font-semibold">No se pudo conectar con FileMaker</p>
              <p className="text-red-700">
                {'error' in result ? result.error : 'Error desconocido'}
              </p>
              {'code' in result && result.code && (
                <p className="font-mono text-xs text-red-500">Código FM: {result.code}</p>
              )}
            </div>
          </div>
          <div className="mt-3 border-t border-red-200 pt-3 text-xs text-red-600 space-y-1">
            <p className="font-medium">Lista de verificación:</p>
            <p>① Reinicia el servidor dev tras cambiar <code className="bg-red-100 px-1 rounded">.env.local</code></p>
            <p>② <code className="bg-red-100 px-1 rounded">FM_USERNAME</code> distingue mayúsculas — usa exactamente el mismo que en FileMaker</p>
            <p>③ Abre <code className="bg-red-100 px-1 rounded">/api/debug-connection</code> para diagnóstico detallado</p>
          </div>
        </div>
      )}

      {/* Tarjetas de estadísticas (Server Component — sin estado) */}
      <StatsCards productos={productos} total={total} />

      {/* Generador de catálogo PDF */}
      <CatalogoButton />

      {/* Tabla CRUD (Client Component — maneja estado interactivo) */}
      <ProductosTable initialData={productos} initialTotal={total} />
    </div>
  );
}
