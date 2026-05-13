'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge, stockVariant, stockLabel } from '@/components/ui/badge';
import { ProductoForm } from './producto-form';
import type { ProductoView, UpdateProductoPayload } from '@/types/domain/producto';

interface ProductoRowProps {
  producto: ProductoView;
  onUpdate: (recordId: string, payload: UpdateProductoPayload) => Promise<boolean>;
  onDelete: (recordId: string) => Promise<boolean>;
}

// FM devuelve precioVenta como número — se formatea directamente
function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function ProductoRow({ producto, onUpdate, onDelete }: ProductoRowProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // cantidad ya es number desde el mapper del servicio
  const cantidad = producto.cantidad;

  async function handleUpdate(payload: UpdateProductoPayload): Promise<boolean> {
    const ok = await onUpdate(producto.recordId, payload);
    if (ok) setEditOpen(false);
    return ok;
  }

  async function handleDelete() {
    setIsDeleting(true);
    const ok = await onDelete(producto.recordId);
    if (!ok) setIsDeleting(false);
    else setDeleteOpen(false);
  }

  return (
    <>
      <tr className="group border-b border-zinc-100 transition-colors hover:bg-zinc-50/60 dark:border-zinc-800 dark:hover:bg-zinc-800/40">
        {/* Nombre + imagen */}
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-3">
            {/* Thumbnail */}
            {producto.urlImagen ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={producto.urlImagen}
                alt={producto.nombre}
                className="h-10 w-10 flex-shrink-0 rounded-lg object-cover ring-1 ring-zinc-200 dark:ring-zinc-700"
              />
            ) : (
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <svg className="h-5 w-5 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              </div>
            )}
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">{producto.nombre}</p>
              {producto.descripcion && (
                <p className="mt-0.5 max-w-xs line-clamp-1 text-xs text-zinc-400 dark:text-zinc-500">
                  {producto.descripcion}
                </p>
              )}
            </div>
          </div>
        </td>

        {/* Precio */}
        <td className="px-4 py-3.5">
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
            {formatCOP(producto.precioVenta)}
          </span>
        </td>

        {/* Cantidad */}
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{cantidad}</span>
            <Badge variant={stockVariant(cantidad)} dot>
              {stockLabel(cantidad)}
            </Badge>
          </div>
        </td>

        {/* Record ID */}
        <td className="px-4 py-3.5">
          <span className="rounded bg-zinc-100 px-2 py-0.5 font-mono text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            #{producto.recordId}
          </span>
        </td>

        {/* Acciones */}
        <td className="px-4 py-3.5">
          <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditOpen(true)}
              className="h-8 gap-1.5 text-slate-600"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteOpen(true)}
              className="h-8 gap-1.5 text-red-500 hover:bg-red-50 hover:text-red-600"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Eliminar
            </Button>
          </div>
        </td>
      </tr>

      {/* Modal Editar */}
      <Modal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Editar producto"
        className="max-w-lg"
      >
        <ProductoForm
          defaultValues={producto}
          onSubmit={handleUpdate}
          onCancel={() => setEditOpen(false)}
          isEdit
        />
      </Modal>

      {/* Modal Eliminar */}
      <Modal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Eliminar producto"
        className="max-w-sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl bg-red-50 p-4 ring-1 ring-red-100">
            <svg className="mt-0.5 h-5 w-5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-300">Esta acción no se puede deshacer</p>
              <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                El producto <span className="font-semibold">"{producto.nombre}"</span> será eliminado
                permanentemente de FileMaker.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setDeleteOpen(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button variant="danger" isLoading={isDeleting} onClick={handleDelete}>
              Sí, eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
