import { buildLoginHeaders, sessionsPath } from './helpers';
import { FileMakerError } from './errors';

// ─── Token Cache ──────────────────────────────────────────────────────────────
// FileMaker tokens expiran a los 15 min de inactividad.
// Renovamos a los 13 min para evitar peticiones con token expirado.

const TOKEN_TTL_MS = 13 * 60 * 1000;

let cachedToken: string | null = null;
let tokenExpiresAt: number | null = null;

// ─── Raw Auth Response ────────────────────────────────────────────────────────

interface FMSessionResponse {
  response?: { token?: string };
  messages?: Array<{ code: string; message: string }>;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Devuelve el token activo de la sesión FileMaker.
 * Si no hay token o expiró, realiza un nuevo login automáticamente.
 * El token se cachea en memoria para reutilizarse durante su tiempo de vida.
 */
export async function getFileMakerToken(): Promise<string> {
  const now = Date.now();

  if (cachedToken && tokenExpiresAt && now < tokenExpiresAt) {
    return cachedToken;
  }

  return _requestNewToken();
}

/**
 * Cierra la sesión activa en FileMaker y limpia el cache del token.
 * FileMaker requiere un DELETE al endpoint de sesiones para invalidar el token.
 */
export async function releaseFileMakerToken(): Promise<void> {
  if (!cachedToken) return;

  const tokenToRelease = cachedToken;
  _clearTokenCache();

  try {
    await fetch(`${sessionsPath()}/${tokenToRelease}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });
  } catch {
    // Si falla el DELETE, el token expirará solo en FM pasados 15 min.
    // No propagamos el error para no interrumpir el flujo del cliente.
  }
}

/**
 * Invalida el token del cache localmente sin llamar a FileMaker.
 * Útil cuando FM devuelve un error 952/953 (invalid token).
 */
export function invalidateToken(): void {
  _clearTokenCache();
}

/**
 * Verifica si hay una sesión activa en cache (sin llamar a FileMaker).
 */
export function hasActiveSession(): boolean {
  return cachedToken !== null && tokenExpiresAt !== null && Date.now() < tokenExpiresAt;
}

// ─── Internal ─────────────────────────────────────────────────────────────────

async function _requestNewToken(): Promise<string> {
  const username = process.env.FM_USERNAME;
  const password = process.env.FM_PASSWORD;

  // Usar Error plano para que parseFMError conserve el mensaje original.
  // FileMakerError con código '960' sobrescribiría el mensaje con 'Parameter Missing (*)'.
  if (!username) throw new Error('FM_USERNAME no está definido en .env.local — reinicia el servidor dev');
  if (!password) throw new Error('FM_PASSWORD no está definido en .env.local — reinicia el servidor dev');

  const response = await fetch(sessionsPath(), {
    method: 'POST',
    headers: buildLoginHeaders(username, password),
    body: JSON.stringify({}),
    cache: 'no-store',
  });

  // FileMaker puede devolver error en el HTTP status o en el body
  const json = (await response.json()) as FMSessionResponse;
  const fmCode = json?.messages?.[0]?.code;
  const fmMessage = json?.messages?.[0]?.message;

  if (!response.ok || (fmCode && fmCode !== '0')) {
    throw new FileMakerError(
      fmMessage ?? `Login fallido con status ${response.status}`,
      fmCode ?? '212'
    );
  }

  const token = json?.response?.token;
  if (!token) {
    throw new FileMakerError('FileMaker no devolvió token en la respuesta', '951');
  }

  cachedToken = token;
  tokenExpiresAt = Date.now() + TOKEN_TTL_MS;

  return token;
}

function _clearTokenCache(): void {
  cachedToken = null;
  tokenExpiresAt = null;
}
