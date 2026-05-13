import { fmPost } from '@/lib/filemaker/client';
import { parseFMError } from '@/lib/filemaker/errors';
import { layoutPath } from '@/lib/filemaker/helpers';
import type { ApiResponse } from '@/types/api';
import type { FMListResponse, FMRecord } from '@/types/filemaker';
import type { UsuarioFields, UsuarioSession } from '@/types/domain/usuario';

const LAYOUT = process.env.FM_LAYOUT_USUARIOS ?? 'Tabla_Usuarios';

// ─── Mapper ──────────────────────────────────────────────────────────────────

function toUsuarioSession(record: FMRecord<UsuarioFields>): UsuarioSession & { rawPassword: string } {
  return {
    recordId: record.recordId,
    email: record.fieldData.email ?? '',
    idSistema: record.fieldData.idSistema ?? '',
    id: record.fieldData.id,
    isLoggedIn: true,
    rawPassword: record.fieldData.password ?? '',
  };
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const UsuariosService = {

  /**
   * Busca un usuario en FileMaker por email exacto.
   * Devuelve el registro incluyendo rawPassword para verificar en el servidor.
   * Nunca exponer rawPassword al cliente.
   */
  async findByCredentials(
    email: string,
    password: string
  ): Promise<ApiResponse<UsuarioSession>> {
    try {
      const res = await fmPost<FMListResponse<UsuarioFields>>(
        `${layoutPath(LAYOUT)}/_find`,
        { query: [{ email: `==${email}`, password: `==${password}` }] }
      );

      const record = res.response.data[0];
      if (!record) {
        return { ok: false, error: 'Credenciales incorrectas', code: '401' };
      }

      return { ok: true, data: toUsuarioSession(record) };
    } catch (err) {
      const fmErr = parseFMError(err);
      if (fmErr.isNotFound()) {
        return { ok: false, error: 'Credenciales incorrectas', code: '401' };
      }
      return { ok: false, error: fmErr.message, code: fmErr.code };
    }
  },
};
