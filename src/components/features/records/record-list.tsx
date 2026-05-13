'use client';

import { useState } from 'react';
import { useRecords } from '@/hooks/use-records';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  Pagination,
} from '@/components/ui/table';
import { RecordRow } from './record-row';
import { RecordForm } from './record-form';
import type { CreateRecordPayload } from '@/types/domain/record';

export function RecordList() {
  const {
    records,
    total,
    page,
    pageSize,
    isLoading,
    error,
    search,
    goToPage,
    createRecord,
    updateRecord,
    deleteRecord,
  } = useRecords();

  const toast = useToast();
  const [searchInput, setSearchInput] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    search(searchInput);
  }

  async function handleCreate(payload: CreateRecordPayload | Partial<import('@/types/domain/record').RecordFields>): Promise<boolean> {
    const ok = await createRecord(payload as CreateRecordPayload);
    if (ok) {
      toast.success('Registro creado exitosamente');
      setIsCreateOpen(false);
    } else {
      toast.error('No se pudo crear el registro');
    }
    return ok;
  }

  return (
    <div className="space-y-4">
      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toast.toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-white shadow-lg transition-all ${
              t.type === 'success' ? 'bg-green-600' :
              t.type === 'error' ? 'bg-red-600' : 'bg-gray-800'
            }`}
          >
            {t.message}
            <button onClick={() => toast.removeToast(t.id)} className="ml-2 opacity-70 hover:opacity-100">✕</button>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Buscar por nombre..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-64"
          />
          <Button type="submit" variant="secondary" size="md">
            Buscar
          </Button>
          {searchInput && (
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => { setSearchInput(''); search(''); }}
            >
              Limpiar
            </Button>
          )}
        </form>
        <Button onClick={() => setIsCreateOpen(true)}>
          + Nuevo registro
        </Button>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Nombre</TableHeader>
              <TableHeader>Email</TableHeader>
              <TableHeader>Teléfono</TableHeader>
              <TableHeader>Activo</TableHeader>
              <TableHeader className="w-32">Acciones</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 animate-pulse rounded bg-gray-200" />
                    </td>
                  ))}
                </TableRow>
              ))
            ) : records.length === 0 ? (
              <TableRow>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-400">
                  No se encontraron registros.
                </td>
              </TableRow>
            ) : (
              records.map((record) => (
                <RecordRow
                  key={record.recordId}
                  record={record}
                  onUpdate={updateRecord}
                  onDelete={deleteRecord}
                />
              ))
            )}
          </TableBody>
        </Table>
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={goToPage}
        />
      </div>

      {/* Create modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Nuevo registro"
      >
        <RecordForm
          onSubmit={handleCreate}
          onCancel={() => setIsCreateOpen(false)}
        />
      </Modal>
    </div>
  );
}
