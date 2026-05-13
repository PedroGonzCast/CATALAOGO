import { getFileMakerToken, invalidateToken } from './auth';
import { buildAuthHeaders, buildFMUrl, buildQueryParams } from './helpers';
import { FileMakerError } from './errors';

// ─── Tipos internos ───────────────────────────────────────────────────────────

interface FMRawResponse {
  messages?: Array<{ code: string; message: string }>;
  response?: unknown;
}

type QueryParams = Record<string, string | number | boolean | undefined | null>;

// ─── Core HTTP Client ─────────────────────────────────────────────────────────

/**
 * Cliente HTTP base para FileMaker Data API.
 * Obtiene el token automáticamente, maneja errores de FM,
 * e invalida el token si FM responde con sesión expirada.
 */
async function fmFetch<T>(
  path: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  body?: unknown,
  params?: QueryParams
): Promise<T> {
  const token = await getFileMakerToken();

  const queryString = params ? buildQueryParams(params) : '';
  const url = `${buildFMUrl(path)}${queryString}`;

  const response = await fetch(url, {
    method,
    headers: buildAuthHeaders(token),
    cache: 'no-store',
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const json = (await response.json()) as FMRawResponse;

  const fmCode = json?.messages?.[0]?.code;
  const fmMessage = json?.messages?.[0]?.message ?? 'Error de FileMaker';

  // Token expirado o inválido — lo limpiamos para forzar renovación en la próxima petición
  if (fmCode === '952' || fmCode === '953') {
    invalidateToken();
    throw new FileMakerError(fmMessage, fmCode);
  }

  // Cualquier otro código de error FM (recuerda: FM siempre devuelve HTTP 200)
  if (fmCode && fmCode !== '0') {
    throw new FileMakerError(fmMessage, fmCode);
  }

  if (!response.ok) {
    throw new FileMakerError(
      `HTTP ${response.status}: ${response.statusText}`,
      String(response.status)
    );
  }

  return json as T;
}

// ─── Métodos HTTP tipados ─────────────────────────────────────────────────────

/**
 * GET — Obtiene datos de FileMaker.
 * Los parámetros de paginación FM usan prefijo underscore: _limit, _offset.
 *
 * @example
 * const res = await fmGet('/layouts/Tabla_Productos/records', { _limit: 20, _offset: 0 })
 */
export function fmGet<T>(path: string, params?: QueryParams): Promise<T> {
  return fmFetch<T>(path, 'GET', undefined, params);
}

/**
 * POST — Crea un nuevo registro o ejecuta _find.
 *
 * @example
 * const res = await fmPost('/layouts/Tabla_Productos/records', { fieldData: { nombre: 'X' } })
 */
export function fmPost<T>(path: string, body: unknown): Promise<T> {
  return fmFetch<T>(path, 'POST', body);
}

/**
 * PATCH — Actualiza campos de un registro existente.
 * FileMaker solo actualiza los campos que se envían (partial update).
 *
 * @example
 * await fmPatch('/layouts/Tabla_Productos/records/1', { fieldData: { nombre: 'Y' } })
 */
export function fmPatch<T>(path: string, body: unknown): Promise<T> {
  return fmFetch<T>(path, 'PATCH', body);
}

/**
 * DELETE — Elimina un registro de FileMaker por recordId.
 *
 * @example
 * await fmDelete('/layouts/Tabla_Productos/records/1')
 */
export function fmDelete<T = FMRawResponse>(path: string): Promise<T> {
  return fmFetch<T>(path, 'DELETE');
}
