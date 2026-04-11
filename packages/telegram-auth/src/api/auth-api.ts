import type {
  AuthResponse,
  TelegramWebAppLoginRequest,
  TelegramWidgetLoginRequest,
  User,
  AuthTokens,
} from '../types';
import { tokenStorage } from '../storage';
import { apiRequest } from './http';
import { AuthApiError } from './errors';

export class AuthApi {
  static async loginViaTelegramWebApp(
    request: TelegramWebAppLoginRequest
  ): Promise<AuthResponse> {
    return apiRequest<AuthResponse>('/api/auth/telegram/webapp', {
      method: 'POST',
      headers: {
        Authorization: `tma ${request?.initDataRaw}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        botId: request.botId,
        initDataRaw: request.initDataRaw,
        ref: request.ref,
        source: request.source,
      }),
    });
  }

  static async loginViaTelegramWidget(
    request: TelegramWidgetLoginRequest
  ): Promise<AuthResponse> {
    return apiRequest<AuthResponse>('/api/auth/telegram/login', {
      method: 'POST',
      body: JSON.stringify({
        botId: request.botId,
        id: request.id,
        first_name: request.first_name,
        last_name: request.last_name,
        username: request.username,
        photo_url: request.photo_url,
        auth_date: request.auth_date,
        hash: request.hash,
        ref: request.ref,
        source: request.source,
      }),
    });
  }

  static async refreshTokens(
    refreshTokenParam?: string
  ): Promise<AuthTokens | null> {
    const refreshToken = refreshTokenParam || tokenStorage.getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    return apiRequest<AuthTokens>('/api/auth/telegram/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  static async getProfile(): Promise<User> {
    const accessToken = tokenStorage.getAccessToken();
    if (!accessToken) {
      throw new AuthApiError('No access token available', 401);
    }

    return apiRequest<User>('/auth/profile', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  static async logout(): Promise<void> {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) return;

    await apiRequest<void>('/api/auth/telegram/logout', {
      method: 'POST',
      body: null,
    }).catch(() => {});
  }
}

export const authApi = AuthApi;
