/**
 * Prefer VITE_TELEGRAM_BOT_ID; else `?botId=` query (e.g. deep link to mini app).
 */
export function resolveTelegramBotId(): string | undefined {
  const fromEnv = import.meta.env.VITE_TELEGRAM_BOT_ID;
  if (typeof fromEnv === 'string' && fromEnv.trim() !== '') {
    return fromEnv.trim();
  }
  if (typeof window !== 'undefined') {
    const fromQuery = new URLSearchParams(window.location.search).get('botId');
    if (fromQuery !== null && fromQuery.trim() !== '') {
      return fromQuery.trim();
    }
  }
  return undefined;
}
