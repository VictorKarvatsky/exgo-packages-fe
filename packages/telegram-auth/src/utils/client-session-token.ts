/**
 * Browser-side helpers for GoExchange OS client session tokens
 * (`encodeClientToken` / `verifyClientToken` on the API).
 *
 * Format: `base64url(JSON payload).hexHmac` — same split as server.
 * HMAC is NOT verified in the browser (no `JWT_SECRET`); the API still
 * enforces integrity and expiry. Here we only read `exp` for UX: attach a
 * fresh access token and trigger refresh before requests when expired.
 */

export type ClientSessionTokenPayload = {
  accountId: string;
  tenantId: number;
  telegramId: number;
  type: 'access' | 'refresh';
  /** Unix ms expiry (same as `Date.now()` comparison on the server). */
  exp: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Decode payload from a client session token without verifying the HMAC.
 * Returns `null` if the string is not in the expected shape.
 */
export function parseClientSessionToken(
  token: string
): ClientSessionTokenPayload | null {
  const dot = token.indexOf('.');
  if (dot <= 0) {
    return null;
  }
  const dataBase64 = token.slice(0, dot);
  try {
    const json = atob(dataBase64);
    const raw: unknown = JSON.parse(json);
    if (!isRecord(raw)) {
      return null;
    }
    const accountId = raw['accountId'];
    const tenantId = raw['tenantId'];
    const telegramId = raw['telegramId'];
    const type = raw['type'];
    const exp = raw['exp'];
    if (
      typeof accountId !== 'string' ||
      typeof tenantId !== 'number' ||
      typeof telegramId !== 'number' ||
      (type !== 'access' && type !== 'refresh') ||
      typeof exp !== 'number'
    ) {
      return null;
    }
    return {
      accountId,
      tenantId,
      telegramId,
      type,
      exp,
    };
  } catch {
    return null;
  }
}

export function isClientAccessTokenExpired(token: string): boolean {
  const p = parseClientSessionToken(token);
  if (p === null || p.type !== 'access') {
    return true;
  }
  return p.exp <= Date.now();
}

export function isClientRefreshTokenExpired(token: string): boolean {
  const p = parseClientSessionToken(token);
  if (p === null || p.type !== 'refresh') {
    return true;
  }
  return p.exp <= Date.now();
}
