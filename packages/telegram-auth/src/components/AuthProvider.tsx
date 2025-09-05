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

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = useCallback(
    async (method: 'twa' | 'widget', data: unknown): Promise<void> => {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      try {
        let response;

        if (method === 'twa') {
          const initData = twaClient.getInitData();
          if (!initData) {
            throw new Error('No TWA initData available');
          }
          response = await authApi.loginViaTelegramWebApp({
            initDataRaw: initData,
          });

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
          const widgetData = data as Parameters<
            typeof authApi.loginViaTelegramWidget
          >[0];
          response = await authApi.loginViaTelegramWidget(widgetData);

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
    []
  );

  // Основная инициализация аутентификации
  useEffect(() => {
    const initAuth = async () => {
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
        const tokens = await authApi.refreshTokens();
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
  }, [login]);

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
      const tokens = await authApi.refreshTokens();
      tokenStorage.setTokens(tokens);
    } catch (error) {
      tokenStorage.clearTokens();
      dispatch({ type: 'RESET' });
      throw error;
    }
  }, []);

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
