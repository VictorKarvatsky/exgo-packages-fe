import { AuthApiError } from './errors';
import { twaClient } from '../telegram/twa-client';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function hasStringMessage(x: unknown): x is { message: string } {
  if (!x || typeof x !== 'object' || !('message' in x)) return false;
  const msg = Reflect.get(x, 'message');
  return typeof msg === 'string';
}

function hasCode(x: unknown): x is { code: string | number } {
  if (!x || typeof x !== 'object' || !('code' in x)) return false;
  const v = Reflect.get(x, 'code');
  return typeof v === 'string' || typeof v === 'number';
}

async function safeJson(res: Response): Promise<unknown | undefined> {
  try {
    return await res.json();
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
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'client-type': clientType,
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body: unknown = await safeJson(response);

    const message = hasStringMessage(body) ? body.message : 'Network error';
    const code = hasCode(body) ? String(body.code) : undefined;

    throw new AuthApiError(message, response.status, code);
  }

  const data: unknown = await response.json();
  /** Caller supplies `T` consistent with this endpoint’s JSON contract. */
  return data as T;
}
