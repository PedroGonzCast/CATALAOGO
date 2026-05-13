/**
 * filemaker.service.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Cliente reutilizable para consumir FileMaker Data API.
 *
 * Expone todas las operaciones CRUD más login/logout con:
 *  - Manejo automático de token (se obtiene y renueva sin intervención manual)
 *  - Respuestas tipadas con ApiResponse<T> (siempre { ok: true/false, ... })
 *  - Manejo global de errores de FileMaker
 *  - Separación clara entre autenticación y operaciones de datos
 *
 * Uso básico:
 *   import { FileMakerService } from '@/services/filemaker.service';
 *   const result = await FileMakerService.getRecords();
 *   if (result.ok) console.log(result.data);
 */

import { getFileMakerToken, releaseFileMakerToken, hasActiveSession } from '@/lib/filemaker/auth';
import { fmGet, fmPost, fmPatch, fmDelete } from '@/lib/filemaker/client';
import { parseFMError } from '@/lib/filemaker/errors';
import { recordsPath, recordPath } from '@/lib/filemaker/helpers';
import type { ApiResponse } from '@/types/api';
import type {
  FMListResponse,
  FMSingleResponse,
  FMCreateResponse,
  FMEditResponse,
  FMRecord,
  FMQuery,
} from '@/types/filemaker';
import type {
  ProductoFields,
  ProductoView,
  CreateProductoPayload,
  UpdateProductoPayload,
} from '@/types/domain/producto';

// ─── Layout ───────────────────────────────────────────────────────────────────
// Lee el layout de la variable de entorno. Cambiar FM_LAYOUT en .env.local
// si necesitas apuntar a otro layout sin tocar el código.

const LAYOUT = process.env.FM_LAYOUT ?? 'Tabla_Productos';

// ─── Mappers ──────────────────────────────────────────────────────────────────

/** Convierte un FMRecord<ProductoFields> al ProductoView del dominio.
 *  FM devuelve precioVenta y cantidad como número — Number() garantiza
 *  compatibilidad aunque FM cambie el tipo en alguna versión futura.
 */
function toProductoView(record: FMRecord<ProductoFields>): ProductoView {
  return {
    recordId:    record.recordId,
    modId:       record.modId,
    nombre:      record.fieldData.nombre ?? '',
    descripcion: record.fieldData.descripcion ?? '',
    precioVenta: Number(record.fieldData.precioVenta ?? 0),
    cantidad:    Number(record.fieldData.cantidad ?? 0),
    idSistema:   record.fieldData.idSistema ?? '',
    idCategoria: record.fieldData.idCategoria,
    urlImagen:   record.fieldData.urlImagen,
    id:          record.fieldData.id,
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const FileMakerService = {

  // ── Autenticación ─────────────────────────────────────────────────────────

  /**
   * Inicia sesión en FileMaker y cachea el token.
   * No es necesario llamarlo antes de las operaciones CRUD —
   * el cliente obtiene el token automáticamente.
   * Útil para pre-calentar la sesión o verificar credenciales.
   */
  async login(): Promise<ApiResponse<{ token: string; isNew: boolean }>> {
    try {
      const wasActive = hasActiveSession();
      const token = await getFileMakerToken();
      return {
        ok: true,
        data: {
          token,
          isNew: !wasActive, // indica si se generó un token nuevo
        },
      };
    } catch (err) {
      const fmErr = parseFMError(err);
      return { ok: false, error: fmErr.message, code: fmErr.code };
    }
  },

  /**
   * Cierra la sesión activa en FileMaker (DELETE /sessions/{token}).
   * Después de esto, el próximo CRUD generará un token nuevo automáticamente.
   */
  async logout(): Promise<ApiResponse<void>> {
    try {
      await releaseFileMakerToken();
      return { ok: true, data: undefined };
    } catch (err) {
      const fmErr = parseFMError(err);
      return { ok: false, error: fmErr.message, code: fmErr.code };
    }
  },

  // ── GET — Obtener registros ───────────────────────────────────────────────

  /**
   * Obtiene una lista paginada de productos desde FileMaker.
   * Lee los datos del array `response.data` tal como los devuelve la API.
   *
   * @param options.limit    Cantidad máxima de registros (default: 100)
   * @param options.offset   Desplazamiento para paginación (default: 0)
   *
   * @example
   * const result = await FileMakerService.getRecords({ limit: 20, offset: 0 });
   * if (result.ok) {
   *   console.log(result.data);   // ProductoView[]
   *   console.log(result.total);  // total de registros en FM
   * }
   */
  async getRecords(filters?: { idSistema?: string }): Promise<ApiResponse<ProductoView[]>> {
    // Si hay filtro de idSistema, usar _find en lugar de GET simple
    if (filters?.idSistema) {
      return FileMakerService.findRecords(
        { query: [{ idSistema: filters.idSistema }] }
      );
    }

    try {
      const res = await fmGet<FMListResponse<ProductoFields>>(
        recordsPath(LAYOUT)
      );

      const data = res.response.data.map(toProductoView);

      return {
        ok: true,
        data,
        total: res.response.dataInfo.foundCount,
      };
    } catch (err) {
      const fmErr = parseFMError(err);
      // FM devuelve código 401 cuando no hay registros — lo tratamos como lista vacía
      if (fmErr.isNotFound()) return { ok: true, data: [], total: 0 };
      return { ok: false, error: fmErr.message, code: fmErr.code };
    }
  },

  /**
   * Obtiene un único producto por su recordId de FileMaker.
   *
   * @param recordId  El ID interno de FileMaker (no un campo de tu tabla)
   *
   * @example
   * const result = await FileMakerService.getRecordById('42');
   * if (result.ok) console.log(result.data.nombre);
   */
  async getRecordById(recordId: string): Promise<ApiResponse<ProductoView>> {
    try {
      const res = await fmGet<FMSingleResponse<ProductoFields>>(
        recordPath(LAYOUT, recordId)
      );

      const record = res.response.data[0];
      if (!record) {
        return { ok: false, error: 'Registro no encontrado', code: '401' };
      }

      return { ok: true, data: toProductoView(record) };
    } catch (err) {
      const fmErr = parseFMError(err);
      return { ok: false, error: fmErr.message, code: fmErr.code };
    }
  },

  // ── POST — Crear registro ─────────────────────────────────────────────────

  /**
   * Crea un nuevo producto en FileMaker.
   * Los campos deben coincidir exactamente con los nombres en el layout FM.
   *
   * @param payload  { nombre, descripcion, precioVenta, cantidad }
   *
   * @example
   * const result = await FileMakerService.createRecord({
   *   nombre: 'Teclado',
   *   descripcion: 'Teclado mecánico RGB',
   *   precioVenta: '150000',
   *   cantidad: '10',
   * });
   * if (result.ok) console.log('Creado con ID:', result.data.recordId);
   */
  async createRecord(
    payload: CreateProductoPayload
  ): Promise<ApiResponse<{ recordId: string; modId: string }>> {
    try {
      const res = await fmPost<FMCreateResponse>(
        recordsPath(LAYOUT),
        { fieldData: payload }
      );

      return {
        ok: true,
        data: {
          recordId: res.response.recordId,
          modId: res.response.modId,
        },
      };
    } catch (err) {
      const fmErr = parseFMError(err);
      return { ok: false, error: fmErr.message, code: fmErr.code };
    }
  },

  // ── PATCH — Actualizar registro ───────────────────────────────────────────

  /**
   * Actualiza los campos de un producto existente.
   * FM aplica partial update — solo se modifican los campos enviados.
   *
   * @param recordId  ID interno de FileMaker del registro a modificar
   * @param payload   Campos a actualizar (todos opcionales)
   *
   * @example
   * const result = await FileMakerService.updateRecord('42', {
   *   precioVenta: '175000',
   *   cantidad: '8',
   * });
   * if (result.ok) console.log('Versión actualizada:', result.data.modId);
   */
  async updateRecord(
    recordId: string,
    payload: UpdateProductoPayload
  ): Promise<ApiResponse<{ modId: string }>> {
    try {
      const res = await fmPatch<FMEditResponse>(
        recordPath(LAYOUT, recordId),
        { fieldData: payload }
      );

      return { ok: true, data: { modId: res.response.modId } };
    } catch (err) {
      const fmErr = parseFMError(err);
      return { ok: false, error: fmErr.message, code: fmErr.code };
    }
  },

  // ── DELETE — Eliminar registro ────────────────────────────────────────────

  /**
   * Elimina permanentemente un producto de FileMaker.
   * Esta acción no se puede deshacer.
   *
   * @param recordId  ID interno de FileMaker del registro a eliminar
   *
   * @example
   * const result = await FileMakerService.deleteRecord('42');
   * if (result.ok) console.log('Registro eliminado');
   */
  async deleteRecord(recordId: string): Promise<ApiResponse<void>> {
    try {
      await fmDelete(recordPath(LAYOUT, recordId));
      return { ok: true, data: undefined };
    } catch (err) {
      const fmErr = parseFMError(err);
      return { ok: false, error: fmErr.message, code: fmErr.code };
    }
  },

  // ── POST _find — Búsqueda avanzada ────────────────────────────────────────

  /**
   * Busca registros usando el motor de búsqueda de FileMaker (_find).
   * Soporta wildcards de FM: '*texto*' para contiene, '=texto' para exacto.
   *
   * @param query    Criterios de búsqueda de FileMaker
   * @param options  Paginación opcional
   *
   * @example
   * // Buscar productos cuyo nombre contenga "teclado"
   * const result = await FileMakerService.findRecords({
   *   query: [{ nombre: '*teclado*' }],
   *   sort: [{ fieldName: 'nombre', sortOrder: 'ascend' }],
   * });
   */
  async findRecords(
    query: FMQuery,
    options: { limit?: number; offset?: number; idSistema?: string } = {}
  ): Promise<ApiResponse<ProductoView[]>> {
    try {
      // Si hay idSistema, añadirlo como criterio AND en cada cláusula de la query
      const criteria = options.idSistema
        ? (query.query ?? []).map((q) => ({ ...q, idSistema: options.idSistema! }))
        : (query.query ?? []);

      const body: FMQuery = {
        ...query,
        query: criteria,
        limit: options.limit ?? 100,
        offset: options.offset ?? 1,
      };

      const res = await fmPost<FMListResponse<ProductoFields>>(
        `${recordsPath(LAYOUT).replace('/records', '')}/_find`,
        body
      );

      const data = res.response.data.map(toProductoView);

      return {
        ok: true,
        data,
        total: res.response.dataInfo.foundCount,
      };
    } catch (err) {
      const fmErr = parseFMError(err);
      if (fmErr.isNotFound()) return { ok: true, data: [], total: 0 };
      return { ok: false, error: fmErr.message, code: fmErr.code };
    }
  },
};
