'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { RecordForm } from './record-form';
import { TableRow, TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils/cn';
import type { RecordView, UpdateRecordPayload } from '@/types/domain/record';

interface RecordRowProps {
  record: RecordView;
  onUpdate: (recordId: string, payload: UpdateRecordPayload) => Promise<boolean>;
  onDelete: (recordId: string) => Promise<boolean>;
}

export function RecordRow({ record, onUpdate, onDelete }: RecordRowProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleUpdate(payload: UpdateRecordPayload): Promise<boolean> {
    const ok = await onUpdate(record.recordId, payload);
    if (ok) setIsEditOpen(false);
    return ok;
  }

  async function handleDelete() {
    setIsDeleting(true);
    const ok = await onDelete(record.recordId);
    if (!ok) setIsDeleting(false);
    setIsDeleteOpen(false);
  }

  return (
    <>
      <TableRow>
        <TableCell className="font-medium text-gray-900">{record.Nombre}</TableCell>
        <TableCell>{record.Email}</TableCell>
        <TableCell>{record.Telefono || '—'}</TableCell>
        <TableCell>
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
              record.Activo === 'Sí'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600'
            )}
          >
            {record.Activo}
          </span>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditOpen(true)}
            >
              Editar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => setIsDeleteOpen(true)}
            >
              Eliminar
            </Button>
          </div>
        </TableCell>
      </TableRow>

      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Editar registro">
        <RecordForm
          defaultValues={record}
          onSubmit={handleUpdate}
          onCancel={() => setIsEditOpen(false)}
          isEdit
        />
      </Modal>

      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Eliminar registro">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            ¿Estás seguro de que deseas eliminar a{' '}
            <span className="font-semibold text-gray-900">{record.Nombre}</span>?
            Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsDeleteOpen(false)} disabled={isDeleting}>
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
