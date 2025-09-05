import type { AuthTokens, User } from '../types';

const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const USER_DATA_KEY = 'auth_user_data';

export class TokenStorage {
  static setTokens(tokens: AuthTokens): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  }

  static getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  static clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
  }

  static hasTokens(): boolean {
    return Boolean(this.getAccessToken() && this.getRefreshToken());
  }

  static setUserData(user: User): void {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
  }

  static getUserData(): User | null {
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
