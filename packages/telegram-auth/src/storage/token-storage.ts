/**
 * Token storage — HttpOnly cookies only (dev and prod identical)
 *
 * OS client GraphQL sets `access_token` / `refresh_token` as HttpOnly cookies.
 * The browser sends them with `credentials: 'include'`. JWTs are never written to
 * sessionStorage or localStorage (XSS cannot read HttpOnly cookies).
 *
 * `exgo_auth_session` is a non-secret tab hint for router guards after login;
 * new tabs rely on cookie + GraphQL `refreshToken` with an empty body.
 */

import type { User } from '../types';

function isStringArray(x: unknown): x is string[] {
  return Array.isArray(x) && x.every((item) => typeof item === 'string');
}

function isUser(x: unknown): x is User {
  if (typeof x !== 'object' || x === null) return false;
  const o = x;
  return (
    typeof Reflect.get(o, 'id') === 'number' &&
    typeof Reflect.get(o, 'telegramId') === 'number' &&
    typeof Reflect.get(o, 'firstName') === 'string' &&
    isStringArray(Reflect.get(o, 'roles')) &&
    isStringArray(Reflect.get(o, 'permissions')) &&
    typeof Reflect.get(o, 'createdAt') === 'string' &&
    typeof Reflect.get(o, 'updatedAt') === 'string'
  );
}

const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const USER_DATA_KEY = 'auth_user_data';
const AUTH_SESSION_HINT_KEY = 'exgo_auth_session';

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function stripLegacyJwtFromStorage(): void {
  if (!isBrowser()) return;
  try {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // ignore
  }
}

stripLegacyJwtFromStorage();

export class TokenStorage {
  /** Records session for this tab; cookies hold JWTs. `tokens` is ignored for storage (kept for call-site compatibility). */
  static setTokens(_tokens: {
    accessToken: string;
    refreshToken: string;
  }): void {
    if (!isBrowser()) return;
    stripLegacyJwtFromStorage();
    try {
      sessionStorage.setItem(AUTH_SESSION_HINT_KEY, '1');
    } catch {
      // ignore
    }
  }

  static getAccessToken(): string | null {
    return null;
  }

  static getRefreshToken(): string | null {
    return null;
  }

  static clearTokens(): void {
    if (!isBrowser()) return;
    stripLegacyJwtFromStorage();
    sessionStorage.removeItem(AUTH_SESSION_HINT_KEY);
    localStorage.removeItem(USER_DATA_KEY);
  }

  static hasTokens(): boolean {
    if (!isBrowser()) return false;
    return sessionStorage.getItem(AUTH_SESSION_HINT_KEY) === '1';
  }

  static setUserData(user: User): void {
    if (!isBrowser()) return;
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
  }

  static getUserData(): User | null {
    if (!isBrowser()) return null;

    const userData = localStorage.getItem(USER_DATA_KEY);
    if (!userData) return null;

    try {
      const parsed: unknown = JSON.parse(userData);
      return isUser(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
}

export const tokenStorage = TokenStorage;
