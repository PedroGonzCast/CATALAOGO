import { fmPost } from '@/lib/filemaker/client';
import { parseFMError } from '@/lib/filemaker/errors';
import { recordsPath } from '@/lib/filemaker/helpers';
import type { ApiResponse } from '@/types/api';
import type { FMCreateResponse } from '@/types/filemaker';

const LAYOUT = process.env.FM_LAYOUT_USUARIOS ?? 'Tabla_Usuarios';

interface CreateUsuarioFMPayload {
  email:     string;
  idSistema: string;
}

export const UsuariosFMService = {

  /**
   * Crea el usuario en FileMaker (Tabla_Usuarios) con todos sus campos.
   * Fundamental para el filtrado multi-tenant: todas las consultas FM
   * se filtran por idSistema, asignado aquí desde el momento del registro.
   *
   * Campos escritos:
   *  - id        → UUID de Supabase (enlace entre sistemas)
   *  - email     → correo del usuario
   *  - idSistema → tenant al que pertenece (de confSistema.id)
   *  - empresa   → nombre de la empresa
   */
  async create(
    payload: CreateUsuarioFMPayload
  ): Promise<ApiResponse<{ recordId: string }>> {
    try {
      const res = await fmPost<FMCreateResponse>(
        recordsPath(LAYOUT),
        {
          fieldData: {
            email:     payload.email,
            idSistema: payload.idSistema,
          },
        }
      );

      return { ok: true, data: { recordId: res.response.recordId } };
    } catch (err) {
      const fmErr = parseFMError(err);
      return { ok: false, error: fmErr.message, code: fmErr.code };
    }
  },
};
