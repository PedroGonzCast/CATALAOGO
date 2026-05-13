import type { ProductoView } from '@/types/domain/producto';

interface StatsCardsProps {
  productos: ProductoView[];
  total: number;
}

function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  accent: string;
}

function StatCard({ label, value, sub, icon, accent }: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className={`absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full opacity-10 ${accent}`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{value}</p>
          {sub && <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-600">{sub}</p>}
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent} bg-opacity-10 dark:bg-opacity-20`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export function StatsCards({ productos, total }: StatsCardsProps) {
  // precioVenta y cantidad llegan como number desde el mapper del servicio
  const totalStock = productos.reduce((sum, p) => sum + (p.cantidad ?? 0), 0);
  const totalValor = productos.reduce(
    (sum, p) => sum + (p.precioVenta ?? 0) * (p.cantidad ?? 0),
    0
  );
  const sinStock = productos.filter((p) => p.cantidad === 0).length;
  const precioPromedio =
    productos.length > 0
      ? productos.reduce((s, p) => s + (p.precioVenta ?? 0), 0) / productos.length
      : 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total Productos"
        value={total.toLocaleString('es-CO')}
        sub="registros en FileMaker"
        accent="bg-blue-500"
        icon={
          <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        }
      />
      <StatCard
        label="Unidades en Stock"
        value={totalStock.toLocaleString('es-CO')}
        sub="unidades disponibles"
        accent="bg-emerald-500"
        icon={
          <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
      <StatCard
        label="Valor del Inventario"
        value={formatCOP(totalValor)}
        sub={`Precio prom. ${formatCOP(precioPromedio)}`}
        accent="bg-violet-500"
        icon={
          <svg className="h-5 w-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
      <StatCard
        label="Sin Stock"
        value={sinStock.toLocaleString('es-CO')}
        sub={sinStock === 0 ? 'Todo en inventario' : 'productos agotados'}
        accent={sinStock > 0 ? 'bg-red-500' : 'bg-slate-400'}
        icon={
          <svg
            className={`h-5 w-5 ${sinStock > 0 ? 'text-red-600' : 'text-slate-400'}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        }
      />
    </div>
  );
}
