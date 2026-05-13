import {
  getRecords,
  getRecordById,
  createRecord,
  updateRecord,
  deleteRecord,
  findRecords,
} from '@/lib/filemaker/api';
import { parseFMError } from '@/lib/filemaker/errors';
import type { ApiResponse } from '@/types/api';
import type { FMRecord } from '@/types/filemaker';
import type {
  RecordFields,
  CreateRecordPayload,
  UpdateRecordPayload,
} from '@/types/domain/record';

// Nombre del layout de FileMaker — cambiar según tu base de datos
const LAYOUT = 'web_registros';

const DEFAULT_PAGE_SIZE = 20;

export const RecordsService = {
  async list(
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE
  ): Promise<ApiResponse<FMRecord<RecordFields>[]>> {
    try {
      const offset = (page - 1) * pageSize;
      const res = await getRecords<RecordFields>(LAYOUT, {
        limit: pageSize,
        offset,
      });
      return {
        ok: true,
        data: res.response.data,
        total: res.response.dataInfo.foundCount,
        page,
        pageSize,
      };
    } catch (err) {
      const fmErr = parseFMError(err);
      if (fmErr.isNotFound()) return { ok: true, data: [], total: 0, page, pageSize };
      return { ok: false, error: fmErr.message, code: fmErr.code };
    }
  },

  async getById(
    recordId: string
  ): Promise<ApiResponse<FMRecord<RecordFields>>> {
    try {
      const record = await getRecordById<RecordFields>(LAYOUT, recordId);
      return { ok: true, data: record };
    } catch (err) {
      const fmErr = parseFMError(err);
      return { ok: false, error: fmErr.message, code: fmErr.code };
    }
  },

  async create(
    payload: CreateRecordPayload
  ): Promise<ApiResponse<{ recordId: string }>> {
    try {
      const res = await createRecord<CreateRecordPayload>(LAYOUT, payload);
      return { ok: true, data: { recordId: res.response.recordId } };
    } catch (err) {
      const fmErr = parseFMError(err);
      return { ok: false, error: fmErr.message, code: fmErr.code };
    }
  },

  async update(
    recordId: string,
    payload: UpdateRecordPayload
  ): Promise<ApiResponse<{ modId: string }>> {
    try {
      const res = await updateRecord<UpdateRecordPayload>(LAYOUT, recordId, payload);
      return { ok: true, data: { modId: res.response.modId } };
    } catch (err) {
      const fmErr = parseFMError(err);
      return { ok: false, error: fmErr.message, code: fmErr.code };
    }
  },

  async remove(recordId: string): Promise<ApiResponse<void>> {
    try {
      await deleteRecord(LAYOUT, recordId);
      return { ok: true, data: undefined };
    } catch (err) {
      const fmErr = parseFMError(err);
      return { ok: false, error: fmErr.message, code: fmErr.code };
    }
  },

  async search(
    query: string,
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE
  ): Promise<ApiResponse<FMRecord<RecordFields>[]>> {
    try {
      const offset = (page - 1) * pageSize;
      const res = await findRecords<RecordFields>(LAYOUT, {
        query: [{ Nombre: `*${query}*` }],
        limit: pageSize,
        offset,
      });
      return {
        ok: true,
        data: res.response.data,
        total: res.response.dataInfo.foundCount,
        page,
        pageSize,
      };
    } catch (err) {
      const fmErr = parseFMError(err);
      if (fmErr.isNotFound()) return { ok: true, data: [], total: 0 };
      return { ok: false, error: fmErr.message, code: fmErr.code };
    }
  },
};
