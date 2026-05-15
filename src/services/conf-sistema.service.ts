import { fmPost, fmGet } from '@/lib/filemaker/client';
import { parseFMError } from '@/lib/filemaker/errors';
import { recordsPath, recordPath } from '@/lib/filemaker/helpers';
import type { ApiResponse } from '@/types/api';
import type { FMCreateResponse, FMSingleResponse, FMRecord } from '@/types/filemaker';

const LAYOUT = process.env.FM_LAYOUT_CONF_SISTEMA ?? 'Tabla_ConfSistema';

interface ConfSistemaFields {
  id:     string; // UUID auto-generado por FileMaker (este es el idSistema)
  nombre: string; // nombre de la empresa
}

function extractIdSistema(record: FMRecord<ConfSistemaFields>): string {
  return record.fieldData.id ?? '';
}

export const ConfSistemaService = {

  /**
   * Crea una nueva empresa en FileMaker (tabla confSistema).
   * FileMaker genera automáticamente el campo `id` (UUID) que usamos como idSistema.
   *
   * Flujo:
   *  1. POST /records → FM crea el registro y devuelve recordId interno
   *  2. GET /records/{recordId} → leemos el campo `id` auto-generado
   *
   * @param nombre  Nombre de la empresa
   * @returns       idSistema (UUID generado por FM) y recordId interno de FM
   */
  async create(nombre: string): Promise<ApiResponse<{ idSistema: string; recordId: string }>> {
    try {
      // Paso 1 — crear el registro; FM auto-genera el campo `id`
      const createRes = await fmPost<FMCreateResponse>(
        recordsPath(LAYOUT),
        { fieldData: { nombre } }
      );

      const recordId = createRes.response.recordId;

      // Paso 2 — leer el registro para obtener el `id` generado por FM
      const getRes = await fmGet<FMSingleResponse<ConfSistemaFields>>(
        recordPath(LAYOUT, recordId)
      );

      const record = getRes.response.data[0];
      if (!record) {
        return { ok: false, error: 'No se pudo leer el registro creado en FileMaker', code: '404' };
      }

      const idSistema = extractIdSistema(record);
      if (!idSistema) {
        return { ok: false, error: 'FileMaker no generó el idSistema — verifica el campo `id` en confSistema', code: '500' };
      }

      return { ok: true, data: { idSistema, recordId } };
    } catch (err) {
      const fmErr = parseFMError(err);
      return { ok: false, error: fmErr.message, code: fmErr.code };
    }
  },
};
