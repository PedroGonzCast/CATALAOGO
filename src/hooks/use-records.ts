'use client';

import { useState, useEffect, useCallback } from 'react';
import type { RecordView } from '@/types/domain/record';
import type { CreateRecordPayload, UpdateRecordPayload } from '@/types/domain/record';

interface UseRecordsState {
  records: RecordView[];
  total: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  error: string | null;
}

interface UseRecordsActions {
  search: (query: string) => void;
  goToPage: (page: number) => void;
  createRecord: (payload: CreateRecordPayload) => Promise<boolean>;
  updateRecord: (recordId: string, payload: UpdateRecordPayload) => Promise<boolean>;
  deleteRecord: (recordId: string) => Promise<boolean>;
  refresh: () => void;
}

export function useRecords(initialPageSize = 20): UseRecordsState & UseRecordsActions {
  const [records, setRecords] = useState<RecordView[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(initialPageSize);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        ...(searchQuery ? { search: searchQuery } : {}),
      });

      const res = await fetch(`/api/records?${params.toString()}`);
      const json = await res.json() as {
        ok: boolean;
        data?: Array<{ recordId: string; modId: string; fieldData: Record<string, string> }>;
        total?: number;
        error?: string;
      };

      if (!json.ok) {
        setError(json.error ?? 'Error al cargar registros');
        return;
      }

      const mapped: RecordView[] = (json.data ?? []).map((r) => ({
        recordId: r.recordId,
        modId: r.modId,
        Nombre: r.fieldData['Nombre'] ?? '',
        Email: r.fieldData['Email'] ?? '',
        Telefono: r.fieldData['Telefono'] ?? '',
        Activo: r.fieldData['Activo'] ?? '',
        FechaCreacion: r.fieldData['FechaCreacion'],
        Notas: r.fieldData['Notas'],
      }));

      setRecords(mapped);
      setTotal(json.total ?? 0);
    } catch {
      setError('Error de red. Verifica tu conexión.');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, searchQuery, refreshKey]);

  useEffect(() => {
    void fetchRecords();
  }, [fetchRecords]);

  const search = useCallback((query: string) => {
    setSearchQuery(query);
    setPage(1);
  }, []);

  const goToPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const createRecord = useCallback(async (payload: CreateRecordPayload): Promise<boolean> => {
    try {
      const res = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json() as { ok: boolean };
      if (json.ok) refresh();
      return json.ok;
    } catch {
      return false;
    }
  }, [refresh]);

  const updateRecord = useCallback(async (recordId: string, payload: UpdateRecordPayload): Promise<boolean> => {
    try {
      const res = await fetch(`/api/records/${recordId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json() as { ok: boolean };
      if (json.ok) refresh();
      return json.ok;
    } catch {
      return false;
    }
  }, [refresh]);

  const deleteRecord = useCallback(async (recordId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/records/${recordId}`, { method: 'DELETE' });
      const json = await res.json() as { ok: boolean };
      if (json.ok) refresh();
      return json.ok;
    } catch {
      return false;
    }
  }, [refresh]);

  return {
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
    refresh,
  };
}
