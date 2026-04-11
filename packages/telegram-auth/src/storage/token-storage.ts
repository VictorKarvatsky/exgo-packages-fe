/**
 * Token Storage (Hybrid Approach)
 *
 * Supports both:
 * 1. HttpOnly cookies (same-origin/subdomain - most secure)
 * 2. sessionStorage tokens with Authorization header (cross-origin)
 *
 * SECURITY:
 * - sessionStorage is cleared when browser/tab is closed
 * - Tokens persist during navigation (better UX for cross-subdomain)
 * - Isolated per tab (one compromised tab doesn't affect others)
 * - For same-origin deployments, HttpOnly cookies provide additional security
 *
 * FLOW:
 * - Backend always sets HttpOnly cookies AND returns tokens in response body
 * - Frontend stores tokens in sessionStorage for Authorization header
 * - Both mechanisms work simultaneously - backend accepts either
 */

import type { User } from '../types';

const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const USER_DATA_KEY = 'auth_user_data';

/**
 * Check if we're in a browser environment.
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export class TokenStorage {
  /**
   * Store tokens in sessionStorage.
   * Persists during navigation, cleared when tab closes.
   */
  static setTokens(tokens: {
    accessToken: string;
    refreshToken: string;
  }): void {
    if (!isBrowser()) return;
    sessionStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    sessionStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  }

  /**
   * Get access token from sessionStorage.
   * Used for Authorization header in cross-origin requests.
   */
  static getAccessToken(): string | null {
    if (!isBrowser()) return null;
    return sessionStorage.getItem(ACCESS_TOKEN_KEY);
  }

  /**
   * Get refresh token from sessionStorage.
   * Used for token refresh in cross-origin requests.
   */
  static getRefreshToken(): string | null {
    if (!isBrowser()) return null;
    return sessionStorage.getItem(REFRESH_TOKEN_KEY);
  }

  /**
   * Clear all tokens and user data.
   */
  static clearTokens(): void {
    if (!isBrowser()) return;
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
  }

  /**
   * Check if tokens exist in sessionStorage.
   */
  static hasTokens(): boolean {
    if (!isBrowser()) return false;
    return sessionStorage.getItem(ACCESS_TOKEN_KEY) !== null;
  }

  /**
   * Store user display data (non-sensitive) for UI purposes.
   * Persisted to localStorage for UX (survives refresh).
   */
  static setUserData(user: User): void {
    if (!isBrowser()) return;
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
  }

  /**
   * Get cached user display data.
   */
  static getUserData(): User | null {
    if (!isBrowser()) return null;

    const userData = localStorage.getItem(USER_DATA_KEY);
    if (!userData) return null;

    try {
      return JSON.parse(userData) as User;
    } catch {
      return null;
    }
  }
}

export const tokenStorage = TokenStorage;
