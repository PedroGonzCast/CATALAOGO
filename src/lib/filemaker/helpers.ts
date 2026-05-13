// ─── URL Builder ─────────────────────────────────────────────────────────────

/**
 * Construye la URL base de FileMaker Data API.
 * Usa vLatest para siempre apuntar a la versión más reciente de la API.
 */
export function buildFMBaseUrl(): string {
  const host = process.env.FM_HOST;
  const database = process.env.FM_DATABASE;

  if (!host) throw new Error('FM_HOST no está definido en las variables de entorno');
  if (!database) throw new Error('FM_DATABASE no está definido en las variables de entorno');

  return `${host}/fmi/data/vLatest/databases/${encodeURIComponent(database)}`;
}

/**
 * Construye la URL completa para un path específico dentro de la API.
 * Ejemplo: buildFMUrl('/layouts/Tabla_Productos/records')
 */
export function buildFMUrl(path: string): string {
  return `${buildFMBaseUrl()}${path}`;
}

/**
 * Construye el path de un layout con el nombre escapado.
 * Ejemplo: layoutPath('Tabla_Productos') → '/layouts/Tabla_Productos'
 */
export function layoutPath(layout: string): string {
  return `/layouts/${encodeURIComponent(layout)}`;
}

/**
 * Construye el path de registros de un layout.
 * Ejemplo: recordsPath('Tabla_Productos') → '/layouts/Tabla_Productos/records'
 */
export function recordsPath(layout: string): string {
  return `${layoutPath(layout)}/records`;
}

/**
 * Construye el path de un registro específico por ID.
 */
export function recordPath(layout: string, recordId: string): string {
  return `${layoutPath(layout)}/records/${recordId}`;
}

/**
 * Construye el path del endpoint de sesiones (auth).
 */
export function sessionsPath(): string {
  return `${buildFMBaseUrl()}/sessions`;
}

// ─── Header Factory ───────────────────────────────────────────────────────────

/**
 * Genera el header de autorización Basic para autenticación inicial.
 * Encripta las credenciales en Base64 tal como requiere FileMaker Data API.
 */
export function buildBasicAuthHeader(username: string, password: string): string {
  const credentials = Buffer.from(`${username}:${password}`).toString('base64');
  return `Basic ${credentials}`;
}

/**
 * Genera el header de autorización Bearer con el token de sesión activo.
 */
export function buildBearerAuthHeader(token: string): string {
  return `Bearer ${token}`;
}

/**
 * Headers completos para peticiones autenticadas con token.
 * Se usa en todos los métodos CRUD después del login.
 */
export function buildAuthHeaders(token: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: buildBearerAuthHeader(token),
  };
}

/**
 * Headers para la petición de login (autenticación básica).
 */
export function buildLoginHeaders(username: string, password: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: buildBasicAuthHeader(username, password),
  };
}

// ─── Query Params ─────────────────────────────────────────────────────────────

/**
 * Convierte un objeto de parámetros a URLSearchParams.
 * Filtra valores undefined/null automáticamente.
 */
export function buildQueryParams(
  params: Record<string, string | number | boolean | undefined | null>
): string {
  const entries = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => [k, String(v)]);

  if (entries.length === 0) return '';

  return `?${new URLSearchParams(entries).toString()}`;
}
