/**
 * Authentication Provider
 *
 * Manages authentication state using HttpOnly cookies.
 * Tokens are stored server-side in secure cookies, not accessible to JavaScript.
 *
 * FLOW:
 * 1. On mount: Try TWA auto-auth, or attempt refresh via cookie
 * 2. Login: Call auth mutation, backend sets HttpOnly cookies
 * 3. Requests: Browser automatically sends cookies with credentials: 'include'
 * 4. Logout: Call logout mutation, backend clears cookies
 */

import {
  createContext,
  useEffect,
  useReducer,
  useMemo,
  useCallback,
  useRef,
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
  isLoading: true,
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
      return { ...initialState, isLoading: false };
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

  /** 
   * Refresh tokens. Returns null if no active session (e.g., no cookie).
   * This is expected for unauthenticated users - not an error.
   */
  refreshTokens: (
    refreshToken: string
  ) => Promise<{ accessToken: string; refreshToken: string } | null>;

  logout?: () => Promise<void>;
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
  const isInitialized = useRef(false);

  const resolveBotId = useCallback((): string | null => {
    if (propBotId) return propBotId;
    if (getBotId) {
      const fromGetter = getBotId();
      if (fromGetter) return fromGetter;
    }
    const fromEnv = resolveTelegramBotId();
    if (fromEnv) return fromEnv;
    return null;
  }, [propBotId, getBotId]);

  const login = useCallback(
    async (method: 'twa' | 'widget', data: unknown): Promise<void> => {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      try {
        if (method === 'twa') {
          const twaData = data as
            | { initDataRaw?: string; ref?: string; source?: string }
            | undefined;
          const initData = twaData?.initDataRaw || twaClient.getInitData();
          if (!initData) {
            throw new Error('No TWA initData available');
          }

          let tokens: { accessToken: string; refreshToken: string };
          if (customAuthApi) {
            tokens = await customAuthApi.authenticateWithMiniApp({
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
            tokens = await authApi.loginViaTelegramWebApp({
              botId,
              initDataRaw: initData,
              ref: twaData?.ref,
              source: twaData?.source,
            });
          }

          // Store tokens in memory for Authorization header (cross-origin support)
          tokenStorage.setTokens(tokens);

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

          let tokens: { accessToken: string; refreshToken: string };
          if (customAuthApi) {
            tokens = await customAuthApi.authenticateWithWidget({
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
            tokens = await authApi.loginViaTelegramWidget({
              botId,
              ...widgetData,
            });
          }

          // Store tokens in memory for Authorization header (cross-origin support)
          tokenStorage.setTokens(tokens);

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

        dispatch({ type: 'SET_AUTHENTICATED', payload: true });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Login failed';
        dispatch({ type: 'SET_ERROR', payload: message });
        throw error;
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    [resolveBotId, customAuthApi]
  );

  const doRefreshTokens = useCallback(async () => {
    // Pass refresh token from memory (for cross-origin) or empty string (backend reads from cookie)
    const currentRefreshToken = tokenStorage.getRefreshToken() || '';
    
    let result;
    if (customAuthApi) {
      result = await customAuthApi.refreshTokens(currentRefreshToken);
    } else {
      result = await authApi.refreshTokens(currentRefreshToken);
    }

    // Store new tokens in memory if refresh succeeded
    if (result) {
      tokenStorage.setTokens(result);
    }

    return result;
  }, [customAuthApi]);

  useEffect(() => {
    // Prevent re-initialization on dependency changes
    if (isInitialized.current) {
      return;
    }
    isInitialized.current = true;

    const initAuth = async () => {
      const hasAuthApi = customAuthApi || resolveBotId();
      if (!hasAuthApi) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      if (twaClient.isAvailable()) {
        const initData = twaClient.getInitData();
        if (initData) {
          try {
            await login('twa', { initDataRaw: initData });
            return;
          } catch {
            dispatch({
              type: 'SET_ERROR',
              payload: 'Telegram Web App authentication failed',
            });
            return;
          }
        }
      }

      try {
        const result = await doRefreshTokens();
        // null means no active session - user is not authenticated (expected state)
        if (result) {
          const userData = tokenStorage.getUserData();
          dispatch({ type: 'SET_USER', payload: userData });
          dispatch({ type: 'SET_AUTHENTICATED', payload: true });
        }
      } catch {
        tokenStorage.clearTokens();
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initAuth();
  }, [login, doRefreshTokens, customAuthApi, resolveBotId]);

  const logout = useCallback(async (): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      if (customAuthApi?.logout) {
        await customAuthApi.logout();
      } else {
        await authApi.logout();
      }
    } catch {
      // ignore
    } finally {
      tokenStorage.clearTokens();
      dispatch({ type: 'RESET' });
      if (twaClient.isAvailable()) {
        twaClient.close();
      }
    }
  }, [customAuthApi]);

  const refresh = useCallback(async (): Promise<void> => {
    try {
      await doRefreshTokens();
    } catch (error) {
      tokenStorage.clearTokens();
      dispatch({ type: 'RESET' });
      throw error;
    }
  }, [doRefreshTokens]);

  const getAccessToken = useCallback((): string | null => {
    return null;
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
