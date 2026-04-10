import {
  createContext,
  useEffect,
  useReducer,
  useMemo,
  useCallback,
  type ReactNode,
} from 'react';
import type { AuthState, AuthContextValue, User } from '../types';
import { authApi } from '../api';
import { tokenStorage } from '../storage';
import { twaClient } from '../telegram';
import { resolveTelegramBotId } from '../utils/resolve-telegram-bot-id';

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_AUTHENTICATED'; payload: boolean }
  | { type: 'RESET' };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_AUTHENTICATED':
      return { ...state, isAuthenticated: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export const AuthContext = createContext<AuthContextValue | null>(null);

/** Auth API functions that can be injected (e.g., GraphQL-based) */
export interface AuthApiFunctions {
  authenticateWithWidget: (input: {
    id: number;
    firstName?: string;
    lastName?: string;
    username?: string;
    photoUrl?: string;
    authDate: number;
    hash: string;
    ref?: string;
    source?: string;
  }) => Promise<{ accessToken: string; refreshToken: string }>;

  authenticateWithMiniApp: (input: {
    initDataRaw: string;
    ref?: string;
    source?: string;
  }) => Promise<{ accessToken: string; refreshToken: string }>;

  refreshTokens: (
    refreshToken: string
  ) => Promise<{ accessToken: string; refreshToken: string }>;
}

type AuthProviderProps = {
  children: ReactNode;
  /** Bot ID for authentication. If not provided, will try to resolve from env or query params. */
  botId?: string;
  /** Function to get botId dynamically (e.g., from clientConfig) */
  getBotId?: () => string | null;
  /** Custom auth API functions (e.g., GraphQL-based). If not provided, uses REST API. */
  authApi?: AuthApiFunctions;
};

export const AuthProvider = ({
  children,
  botId: propBotId,
  getBotId,
  authApi: customAuthApi,
}: AuthProviderProps) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Resolve botId from props, getter function, or env
  // Returns null if not available (auth will be disabled)
  const resolveBotId = useCallback((): string | null => {
    // 1. From props
    if (propBotId) return propBotId;
    // 2. From getter function (e.g., clientConfig)
    if (getBotId) {
      const fromGetter = getBotId();
      if (fromGetter) return fromGetter;
    }
    // 3. From env or query params
    const fromEnv = resolveTelegramBotId();
    if (fromEnv) return fromEnv;

    return null;
  }, [propBotId, getBotId]);

  const login = useCallback(
    async (method: 'twa' | 'widget', data: unknown): Promise<void> => {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      try {
        let response;

        if (method === 'twa') {
          const twaData = data as
            | { initDataRaw?: string; ref?: string; source?: string }
            | undefined;
          const initData = twaData?.initDataRaw || twaClient.getInitData();
          if (!initData) {
            throw new Error('No TWA initData available');
          }

          // Use custom GraphQL API if provided, otherwise fall back to REST
          if (customAuthApi) {
            response = await customAuthApi.authenticateWithMiniApp({
              initDataRaw: initData,
              ref: twaData?.ref,
              source: twaData?.source,
            });
          } else {
            const botId = resolveBotId();
            if (!botId) {
              throw new Error(
                'Authentication not available: bot configuration missing'
              );
            }
            response = await authApi.loginViaTelegramWebApp({
              botId,
              initDataRaw: initData,
              ref: twaData?.ref,
              source: twaData?.source,
            });
          }

          // Для TWA создаем пользователя из initDataUnsafe
          const initDataUnsafe = twaClient.getInitDataUnsafe();
          if (initDataUnsafe?.user) {
            const user: User = {
              id: initDataUnsafe.user.id,
              firstName: initDataUnsafe.user.first_name,
              username: initDataUnsafe.user.username ?? '',
              photoUrl: initDataUnsafe.user.photo_url ?? '',
              telegramId: initDataUnsafe.user.id,
              roles: [],
              permissions: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            tokenStorage.setUserData(user);
            dispatch({ type: 'SET_USER', payload: user });
          }
        } else {
          const widgetData = data as {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            photo_url?: string;
            auth_date: number;
            hash: string;
            ref?: string;
            source?: string;
          };

          // Use custom GraphQL API if provided, otherwise fall back to REST
          if (customAuthApi) {
            response = await customAuthApi.authenticateWithWidget({
              id: widgetData.id,
              firstName: widgetData.first_name,
              lastName: widgetData.last_name,
              username: widgetData.username,
              photoUrl: widgetData.photo_url,
              authDate: widgetData.auth_date,
              hash: widgetData.hash,
              ref: widgetData.ref,
              source: widgetData.source,
            });
          } else {
            const botId = resolveBotId();
            if (!botId) {
              throw new Error(
                'Authentication not available: bot configuration missing'
              );
            }
            response = await authApi.loginViaTelegramWidget({
              botId,
              ...widgetData,
            });
          }

          const user: User = {
            id: widgetData.id,
            firstName: widgetData.first_name,
            username: widgetData.username ?? '',
            photoUrl: widgetData.photo_url ?? '',
            telegramId: widgetData.id,
            roles: [],
            permissions: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          tokenStorage.setUserData(user);
          dispatch({ type: 'SET_USER', payload: user });
        }

        tokenStorage.setTokens({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
        });
        dispatch({ type: 'SET_AUTHENTICATED', payload: true });

        // console.log('Authentication successful via', method);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Login failed';
        // console.warn('Authentication failed:', error);
        dispatch({ type: 'SET_ERROR', payload: message });
        throw error;
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    [resolveBotId, customAuthApi]
  );

  // Helper to refresh tokens using custom or default API
  const doRefreshTokens = useCallback(async () => {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    if (customAuthApi) {
      return customAuthApi.refreshTokens(refreshToken);
    }
    return authApi.refreshTokens();
  }, [customAuthApi]);

  // Основная инициализация аутентификации
  useEffect(() => {
    const initAuth = async () => {
      // Check if auth API is available (either custom or botId for REST)
      const hasAuthApi = customAuthApi || resolveBotId();
      if (!hasAuthApi) {
        // No auth configuration - skip auto-auth but don't show error
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      // Проверяем TWA в первую очередь для бесшовной авторизации
      if (twaClient.isAvailable()) {
        // console.log('TWA detected, attempting auto-authentication');
        const initData = twaClient.getInitData();

        if (initData) {
          try {
            dispatch({ type: 'SET_LOADING', payload: true });
            // console.log('Auto-login with TWA initData');
            await login('twa', initData);
            return; // Выходим, если TWA авторизация прошла успешно
          } catch {
            // console.error('TWA auto-login failed:', error);
            dispatch({
              type: 'SET_ERROR',
              payload: 'Telegram Web App authentication failed',
            });
            return;
          }
        }
      }

      // Если не TWA или TWA не сработал, проверяем существующие токены
      if (!tokenStorage.hasTokens()) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const tokens = await doRefreshTokens();
        tokenStorage.setTokens(tokens);
        const userData = tokenStorage.getUserData();
        dispatch({ type: 'SET_USER', payload: userData });
        dispatch({ type: 'SET_AUTHENTICATED', payload: true });
      } catch {
        tokenStorage.clearTokens();
        dispatch({
          type: 'SET_ERROR',
          payload: 'Session expired. Please login again.',
        });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initAuth();
  }, [login, doRefreshTokens, customAuthApi, resolveBotId]);

  const logout = useCallback(async (): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await authApi.logout();
    } catch {
      // ignore
    } finally {
      tokenStorage.clearTokens();
      dispatch({ type: 'RESET' });
      if (twaClient.isAvailable()) {
        twaClient.close();
      }
    }
  }, []);

  const refresh = useCallback(async (): Promise<void> => {
    try {
      const tokens = await doRefreshTokens();
      tokenStorage.setTokens(tokens);
    } catch (error) {
      tokenStorage.clearTokens();
      dispatch({ type: 'RESET' });
      throw error;
    }
  }, [doRefreshTokens]);

  const getAccessToken = useCallback((): string | null => {
    return tokenStorage.getAccessToken();
  }, []);

  const hasPermission = useCallback(
    (permission: string): boolean => {
      return state.user?.permissions.includes(permission) ?? false;
    },
    [state.user?.permissions]
  );

  const hasRole = useCallback(
    (role: string): boolean => {
      return state.user?.roles.includes(role) ?? false;
    },
    [state.user?.roles]
  );

  const contextValue: AuthContextValue = useMemo(
    () => ({
      state,
      login,
      logout,
      refresh,
      getAccessToken,
      hasPermission,
      hasRole,
    }),
    [state, login, logout, refresh, getAccessToken, hasPermission, hasRole]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
