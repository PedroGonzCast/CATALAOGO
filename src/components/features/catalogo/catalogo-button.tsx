'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { CategoriaView } from '@/types/domain/categoria';

function IconPDF({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

export function CatalogoButton() {
  const [categorias, setCategorias]   = useState<CategoriaView[]>([]);
  const [idCategoria, setIdCategoria] = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  useEffect(() => {
    fetch('/api/categorias')
      .then((r) => r.json())
      .then((json: { ok: boolean; data?: CategoriaView[] }) => {
        if (json.ok) setCategorias(json.data ?? []);
      })
      .catch(() => {});
  }, []);

  async function handleGenerate() {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (idCategoria) params.set('idCategoria', idCategoria);

      const res = await fetch(`/api/catalogo/pdf?${params}`);

      if (!res.ok) {
        const json = await res.json().catch(() => ({ error: 'Error al generar el PDF' }));
        throw new Error((json as { error?: string }).error ?? 'Error al generar el PDF');
      }

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `catalogo-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  const catLabel = idCategoria
    ? (categorias.find((c) => c.id === idCategoria)?.nombre ?? 'Categoría seleccionada')
    : 'todos los productos';

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        {/* Icono + texto */}
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/40">
            <IconPDF className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Catálogo PDF
            </h3>
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
              Genera un catálogo de estilo revista con imágenes, precios y referencias
            </p>
          </div>
        </div>

        {/* Controles */}
        <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
          {/* Selector de categoría */}
          <select
            value={idCategoria}
            onChange={(e) => setIdCategoria(e.target.value)}
            disabled={loading}
            className="rounded-xl border border-zinc-300 bg-white py-2 pl-3 pr-8 text-sm text-zinc-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-blue-500 dark:focus:ring-blue-900/30"
          >
            <option value="">Todos los productos</option>
            {categorias.map((cat) => (
              <option key={cat.recordId} value={cat.id}>
                {cat.nombre}
              </option>
            ))}
          </select>

          {/* Botón generar */}
          <Button
            onClick={handleGenerate}
            isLoading={loading}
            disabled={loading}
            className="shrink-0 gap-2"
          >
            {!loading && <IconPDF className="h-4 w-4" />}
            {loading ? 'Generando PDF…' : 'Generar catálogo'}
          </Button>
        </div>
      </div>

      {/* Preview del alcance */}
      <div className="border-t border-zinc-100 bg-zinc-50/60 px-6 py-2.5 dark:border-zinc-800 dark:bg-zinc-800/30">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Se incluirán{' '}
          <span className="font-medium text-zinc-700 dark:text-zinc-300">{catLabel}</span>{' '}
          · Imágenes, nombre, descripción, precio y código · Portada + paginación automática
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="border-t border-red-100 bg-red-50 px-6 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}
