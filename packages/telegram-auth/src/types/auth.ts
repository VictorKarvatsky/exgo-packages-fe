export type User = {
  id: number;
  telegramId: number;
  firstName: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
  languageCode?: string;
  isPremium?: boolean;
  roles: string[];
  permissions: string[];
  createdAt: string;
  updatedAt: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthResponse = {
  // user: User;
  // tokens: AuthTokens;
  accessToken: string;
  refreshToken: string;
};

export type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
};

export type AuthContextValue = {
  state: AuthState;
  login: (method: 'twa' | 'widget', data: unknown) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  getAccessToken: () => string | null;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
};

export type TelegramWebAppLoginRequest = {
  initDataRaw: string;
  /** Telegram bot id (numeric string). Required for multi-tenant mini app. */
  botId: string;
  /** Referral code (optional) */
  ref?: string;
  /** Traffic source (optional) */
  source?: string;
};

export type TelegramWidgetLoginRequest = {
  /** Telegram bot id (numeric string). Required for multi-tenant. */
  botId: string;
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
  /** Referral code (optional) */
  ref?: string;
  /** Traffic source (optional) */
  source?: string;
};

export type AuthError = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
};
