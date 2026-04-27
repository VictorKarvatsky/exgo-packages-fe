/**
 * Legacy hook: client JWTs are not kept in browser storage (HttpOnly cookies only).
 * Refresh is handled by GraphQL `refreshToken` / server cookies — nothing to do here.
 */
export async function ensureAccessTokenFresh(): Promise<void> {
  return;
}
