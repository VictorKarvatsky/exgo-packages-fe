import { authApi } from '../api';
import { tokenStorage } from '../storage/token-storage';
import {
  isClientAccessTokenExpired,
  isClientRefreshTokenExpired,
  parseClientSessionToken,
} from './client-session-token';

let refreshInFlight: Promise<void> | null = null;

/**
 * Ensures a non-expired access token is in storage before authenticated
 * HTTP/GraphQL calls. Uses the same `exp` semantics as the OS
 * `verifyClientToken` (ms since epoch).
 *
 * - Valid access → no-op.
 * - Expired/missing access, valid refresh → single-flight `refreshTokens`.
 * - Expired refresh → clears storage.
 */
export async function ensureAccessTokenFresh(): Promise<void> {
  const access = tokenStorage.getAccessToken();
  const refresh = tokenStorage.getRefreshToken();

  if (access && !isClientAccessTokenExpired(access)) {
    return;
  }

  if (!refresh) {
    if (access) {
      tokenStorage.clearTokens();
    }
    return;
  }

  if (isClientRefreshTokenExpired(refresh)) {
    tokenStorage.clearTokens();
    return;
  }

  const refreshPayload = parseClientSessionToken(refresh);
  if (refreshPayload === null || refreshPayload.type !== 'refresh') {
    tokenStorage.clearTokens();
    return;
  }

  if (refreshInFlight) {
    await refreshInFlight;
    return;
  }

  refreshInFlight = (async () => {
    try {
      const tokens = await authApi.refreshTokens();
      tokenStorage.setTokens(tokens);
    } catch {
      tokenStorage.clearTokens();
    } finally {
      refreshInFlight = null;
    }
  })();

  await refreshInFlight;
}
