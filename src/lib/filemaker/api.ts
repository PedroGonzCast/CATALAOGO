import { fmGet, fmPost, fmPatch, fmDelete } from './client';
import type {
  FMListResponse,
  FMFindResponse,
  FMSingleResponse,
  FMCreateResponse,
  FMEditResponse,
  FMRecord,
  FMQuery,
} from '@/types/filemaker';

function layoutPath(layout: string): string {
  return `/layouts/${encodeURIComponent(layout)}`;
}

// GET /layouts/{layout}/records — Lista registros con paginación
export async function getRecords<T>(
  layout: string,
  options: { limit?: number; offset?: number } = {}
): Promise<FMListResponse<T>> {
  const params: Record<string, number> = {};
  if (options.limit !== undefined) params['_limit'] = options.limit;
  if (options.offset !== undefined) params['_offset'] = options.offset;

  return fmGet<FMListResponse<T>>(
    `${layoutPath(layout)}/records`,
    params
  );
}

// GET /layouts/{layout}/records/{recordId} — Obtiene un registro por ID
export async function getRecordById<T>(
  layout: string,
  recordId: string
): Promise<FMRecord<T>> {
  const res = await fmGet<FMSingleResponse<T>>(
    `${layoutPath(layout)}/records/${recordId}`
  );
  const record = res.response.data[0];
  if (!record) throw new Error(`Record ${recordId} not found`);
  return record;
}

// POST /layouts/{layout}/records — Crea un registro
export async function createRecord<T>(
  layout: string,
  fieldData: T
): Promise<FMCreateResponse> {
  return fmPost<FMCreateResponse>(
    `${layoutPath(layout)}/records`,
    { fieldData }
  );
}

// PATCH /layouts/{layout}/records/{recordId} — Actualiza un registro
export async function updateRecord<T>(
  layout: string,
  recordId: string,
  fieldData: Partial<T>
): Promise<FMEditResponse> {
  return fmPatch<FMEditResponse>(
    `${layoutPath(layout)}/records/${recordId}`,
    { fieldData }
  );
}

// DELETE /layouts/{layout}/records/{recordId} — Elimina un registro
export async function deleteRecord(
  layout: string,
  recordId: string
): Promise<void> {
  await fmDelete(`${layoutPath(layout)}/records/${recordId}`);
}

// POST /layouts/{layout}/_find — Búsqueda avanzada con query FM
export async function findRecords<T>(
  layout: string,
  query: FMQuery
): Promise<FMFindResponse<T>> {
  return fmPost<FMFindResponse<T>>(
    `${layoutPath(layout)}/_find`,
    query
  );
}
