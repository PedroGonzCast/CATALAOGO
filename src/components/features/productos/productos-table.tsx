'use client';

import { useState, useTransition, useCallback, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { TableRowSkeleton } from '@/components/ui/skeleton';
import { ProductoRow } from './producto-row';
import { ProductoForm } from './producto-form';
import { useToast } from '@/contexts/toast-context';
import type { ProductoView, CreateProductoPayload, UpdateProductoPayload } from '@/types/domain/producto';
import type { CategoriaView } from '@/types/domain/categoria';

interface ProductosTableProps {
  initialData: ProductoView[];
  initialTotal: number;
}

const PAGE_SIZE = 20;

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
        <svg className="h-8 w-8 text-zinc-400 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
      <h3 className="mt-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        {hasSearch ? 'Sin resultados' : 'Sin productos'}
      </h3>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        {hasSearch
          ? 'No se encontraron productos con ese criterio.'
          : 'Comienza creando tu primer producto en FileMaker.'}
      </p>
    </div>
  );
}

export function ProductosTable({ initialData, initialTotal }: ProductosTableProps) {
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  const [productos, setProductos] = useState<ProductoView[]>(initialData);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [categorias, setCategorias] = useState<CategoriaView[]>([]);
  const [idCategoria, setIdCategoria] = useState('');

  useEffect(() => {
    fetch('/api/categorias')
      .then((r) => r.json())
      .then((json: { ok: boolean; data?: CategoriaView[] }) => {
        if (json.ok) setCategorias(json.data ?? []);
      })
      .catch(() => {});
  }, []);

  // ── Fetch datos desde la API route ────────────────────────────────────────

  const fetchData = useCallback(
    (newPage: number, newSearch: string, newIdCategoria: string = idCategoria) => {
      startTransition(async () => {
        try {
          const params = new URLSearchParams({
            page: String(newPage),
            pageSize: String(PAGE_SIZE),
            ...(newSearch.trim()    ? { search:      newSearch.trim()  } : {}),
            ...(newIdCategoria      ? { idCategoria: newIdCategoria    } : {}),
          });

          const res = await fetch(`/api/records?${params}`);
          const json = (await res.json()) as {
            ok: boolean;
            data?: ProductoView[];
            total?: number;
            error?: string;
          };

          if (!json.ok) {
            toast.error(json.error ?? 'Error al cargar productos');
            return;
          }

          setProductos(json.data ?? []);
          setTotal(json.total ?? 0);
          setPage(newPage);
          setSearch(newSearch);
        } catch {
          toast.error('Error de red. Verifica tu conexión.');
        }
      });
    },
    [toast, idCategoria]
  );

  // ── Acciones CRUD ─────────────────────────────────────────────────────────

  async function handleCreate(payload: CreateProductoPayload | UpdateProductoPayload): Promise<boolean> {
    try {
      const res = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };

      if (!json.ok) {
        toast.error(json.error ?? 'Error al crear el producto');
        return false;
      }

      toast.success('Producto creado exitosamente');
      setIsCreating(false);
      fetchData(1, search);
      return true;
    } catch {
      toast.error('Error de red al crear el producto');
      return false;
    }
  }

  async function handleUpdate(recordId: string, payload: UpdateProductoPayload): Promise<boolean> {
    try {
      const res = await fetch(`/api/records/${recordId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };

      if (!json.ok) {
        toast.error(json.error ?? 'Error al actualizar el producto');
        return false;
      }

      toast.success('Producto actualizado correctamente');
      fetchData(page, search);
      return true;
    } catch {
      toast.error('Error de red al actualizar el producto');
      return false;
    }
  }

  async function handleDelete(recordId: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/records/${recordId}`, { method: 'DELETE' });
      const json = (await res.json()) as { ok: boolean; error?: string };

      if (!json.ok) {
        toast.error(json.error ?? 'Error al eliminar el producto');
        return false;
      }

      toast.success('Producto eliminado');
      fetchData(page, search);
      return true;
    } catch {
      toast.error('Error de red al eliminar el producto');
      return false;
    }
  }

  // ── Search ────────────────────────────────────────────────────────────────

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    fetchData(1, searchInput, idCategoria);
  }

  function clearSearch() {
    setSearchInput('');
    fetchData(1, '', idCategoria);
  }

  function handleCategoriaChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    setIdCategoria(val);
    fetchData(1, search, val);
  }

  function clearFiltros() {
    setSearchInput('');
    setIdCategoria('');
    fetchData(1, '', '');
  }

  // ── Paginación ────────────────────────────────────────────────────────────

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">

        {/* Header de la tabla */}
        <div className="flex flex-col gap-4 border-b border-zinc-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Catálogo de productos</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {total > 0 ? `${total} productos en FileMaker` : 'Sin productos registrados'}
            </p>
          </div>
          <Button onClick={() => setIsCreating(true)} className="shrink-0">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo producto
          </Button>
        </div>

        {/* Filtros */}
        <div className="border-b border-zinc-100 px-6 py-3 dark:border-zinc-800 space-y-2">
          <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2">
            {/* Búsqueda por nombre */}
            <div className="relative flex-1 min-w-[160px] max-w-sm">
              <svg
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Buscar por nombre..."
                className="w-full rounded-xl border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-blue-500 dark:focus:ring-blue-900/30"
              />
            </div>

            {/* Filtro por categoría */}
            <select
              value={idCategoria}
              onChange={handleCategoriaChange}
              className="rounded-xl border border-zinc-300 bg-white py-2 pl-3 pr-8 text-sm text-zinc-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-blue-500 dark:focus:ring-blue-900/30"
            >
              <option value="">Todas las categorías</option>
              {categorias.map((cat) => (
                <option key={cat.recordId} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>

            <Button type="submit" variant="secondary" size="sm" disabled={isPending}>
              Buscar
            </Button>

            {(search || idCategoria) && (
              <Button type="button" variant="ghost" size="sm" onClick={clearFiltros}>
                Limpiar filtros
              </Button>
            )}
          </form>

          {(search || idCategoria) && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {search && (
                <>Nombre: <span className="font-medium text-zinc-700 dark:text-zinc-300">"{search}"</span></>
              )}
              {search && idCategoria && <span className="mx-1">·</span>}
              {idCategoria && (
                <>Categoría: <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {categorias.find((c) => c.id === idCategoria)?.nombre ?? idCategoria}
                </span></>
              )}
            </p>
          )}
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/70 dark:border-zinc-800 dark:bg-zinc-800/40">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Producto
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Precio
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Cantidad
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  ID
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {isPending ? (
                Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={5} />)
              ) : productos.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState hasSearch={!!search} />
                  </td>
                </tr>
              ) : (
                productos.map((producto) => (
                  <ProductoRow
                    key={producto.recordId}
                    producto={producto}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-zinc-100 px-6 py-3 dark:border-zinc-800">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Mostrando{' '}
              <span className="font-medium text-zinc-700 dark:text-zinc-300">{from}–{to}</span>
              {' '}de{' '}
              <span className="font-medium text-zinc-700 dark:text-zinc-300">{total}</span> productos
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fetchData(page - 1, search)}
                disabled={page <= 1 || isPending}
                className="h-8"
              >
                ← Anterior
              </Button>
              <span className="px-3 text-sm text-zinc-500 dark:text-zinc-400">
                {page} / {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fetchData(page + 1, search)}
                disabled={page >= totalPages || isPending}
                className="h-8"
              >
                Siguiente →
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal crear producto */}
      <Modal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        title="Nuevo producto"
        className="max-w-lg"
      >
        <ProductoForm
          onSubmit={handleCreate}
          onCancel={() => setIsCreating(false)}
        />
      </Modal>
    </>
  );
}
