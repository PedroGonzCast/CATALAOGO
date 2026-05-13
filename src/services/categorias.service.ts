import { fmGet } from '@/lib/filemaker/client';
import { parseFMError } from '@/lib/filemaker/errors';
import { recordsPath } from '@/lib/filemaker/helpers';
import type { ApiResponse } from '@/types/api';
import type { FMListResponse, FMRecord } from '@/types/filemaker';
import type { CategoriaFields, CategoriaView } from '@/types/domain/categoria';

const LAYOUT = process.env.FM_LAYOUT_CATEGORIAS ?? 'Tabla_Categorias';

function toCategoriaView(record: FMRecord<CategoriaFields>): CategoriaView {
  return {
    recordId: record.recordId,
    id: record.fieldData.id ?? '',
    nombre: record.fieldData.nombre ?? '',
  };
}

export const CategoriasService = {
  async getAll(): Promise<ApiResponse<CategoriaView[]>> {
    try {
      const res = await fmGet<FMListResponse<CategoriaFields>>(
        recordsPath(LAYOUT)
      );
      return {
        ok: true,
        data: res.response.data.map(toCategoriaView),
      };
    } catch (err) {
      const fmErr = parseFMError(err);
      if (fmErr.isNotFound()) return { ok: true, data: [] };
      return { ok: false, error: fmErr.message, code: fmErr.code };
    }
  },
};
