import { AuthApiError } from './errors';
import { twaClient } from '../telegram/twa-client';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

type ApiErrorBody =
  | {
      message?: unknown;
      code?: unknown;
    }
  | null
  | undefined;

function hasStringMessage(x: unknown): x is { message: string } {
  return (
    !!x &&
    typeof x === 'object' &&
    'message' in x &&
    typeof (x as Record<string, unknown>).message === 'string'
  );
}

function hasCode(x: unknown): x is { code: string | number } {
  if (!x || typeof x !== 'object' || !('code' in x)) return false;
  const v = (x as Record<string, unknown>).code;
  return typeof v === 'string' || typeof v === 'number';
}

async function safeJson<T = unknown>(res: Response): Promise<T | undefined> {
  try {
    return (await res.json()) as T;
  } catch {
    return undefined;
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  // Determine client-type based on whether user is in Telegram Web App
  const clientType = twaClient.isAvailable() ? 'WEB-APP' : 'WEB';

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'client-type': clientType,
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await safeJson<ApiErrorBody>(response);

    const message = hasStringMessage(body) ? body.message : 'Network error';
    const code = hasCode(body) ? String(body.code) : undefined;

    throw new AuthApiError(message, response.status, code);
  }

  const data = await response.json();
  return data as T;
}
