/**
 * Augments `Window` for Telegram Mini App host.
 * Loaded via `@exgo/telegram-auth` entry so web and guide share one definition.
 */
export {};

declare global {
  interface Window {
    Telegram?: {
      WebApp: import('../types/telegram').TelegramWebApp;
    };
  }
}
