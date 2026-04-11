import type { AuthTokens, User } from '../types';

const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const USER_DATA_KEY = 'auth_user_data';

const TOKEN_EXPIRY_DAYS = 30;

function isLocalDev(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.endsWith('.ngrok.app') ||
    host.endsWith('.ngrok.io')
  );
}

function getRootDomain(): string {
  if (typeof window === 'undefined') return '';
  const host = window.location.hostname;
  if (isLocalDev()) return '';
  const parts = host.split('.');
  if (parts.length >= 2) {
    return `.${parts.slice(-2).join('.')}`;
  }
  return '';
}

function setCookie(name: string, value: string, days: number): void {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  const domain = getRootDomain();
  const domainAttr = domain ? `; domain=${domain}` : '';
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  const sameSite = secure ? '; SameSite=None' : '; SameSite=Lax';
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/${domainAttr}${secure}${sameSite}`;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

function deleteCookie(name: string): void {
  const domain = getRootDomain();
  const domainAttr = domain ? `; domain=${domain}` : '';
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domainAttr}`;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

export class TokenStorage {
  private static useLocalStorage(): boolean {
    return isLocalDev();
  }

  static setTokens(tokens: AuthTokens): void {
    if (this.useLocalStorage()) {
      localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    } else {
      setCookie(ACCESS_TOKEN_KEY, tokens.accessToken, TOKEN_EXPIRY_DAYS);
      setCookie(REFRESH_TOKEN_KEY, tokens.refreshToken, TOKEN_EXPIRY_DAYS);
    }
  }

  static getAccessToken(): string | null {
    if (this.useLocalStorage()) {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    }
    return getCookie(ACCESS_TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    if (this.useLocalStorage()) {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    }
    return getCookie(REFRESH_TOKEN_KEY);
  }

  static clearTokens(): void {
    if (this.useLocalStorage()) {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_DATA_KEY);
    } else {
      deleteCookie(ACCESS_TOKEN_KEY);
      deleteCookie(REFRESH_TOKEN_KEY);
      deleteCookie(USER_DATA_KEY);
    }
  }

  static hasTokens(): boolean {
    return Boolean(this.getAccessToken() && this.getRefreshToken());
  }

  static setUserData(user: User): void {
    if (this.useLocalStorage()) {
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
    } else {
      setCookie(USER_DATA_KEY, JSON.stringify(user), TOKEN_EXPIRY_DAYS);
    }
  }

  static getUserData(): User | null {
    const userData = this.useLocalStorage()
      ? localStorage.getItem(USER_DATA_KEY)
      : getCookie(USER_DATA_KEY);

    if (!userData) return null;

    try {
      return JSON.parse(userData) as User;
    } catch {
      return null;
    }
  }
}

export const tokenStorage = TokenStorage;
