import type { TelegramWebApp, TelegramWebAppInitData } from '../types';

const IMPACT_STYLES = ['light', 'medium', 'heavy', 'rigid', 'soft'] as const;
const NOTIFICATION_STYLES = ['error', 'success', 'warning'] as const;

function isImpactHapticStyle(s: string): s is (typeof IMPACT_STYLES)[number] {
  return (IMPACT_STYLES as readonly string[]).includes(s);
}

function isNotificationHapticStyle(
  s: string
): s is (typeof NOTIFICATION_STYLES)[number] {
  return (NOTIFICATION_STYLES as readonly string[]).includes(s);
}

function isTelegramWebAppShape(x: unknown): x is TelegramWebApp {
  if (typeof x !== 'object' || x === null) return false;
  return (
    'initData' in x &&
    typeof Reflect.get(x, 'initData') === 'string' &&
    'ready' in x &&
    typeof Reflect.get(x, 'ready') === 'function'
  );
}

export class TelegramWebAppClient {
  private webApp: TelegramWebApp | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const raw = window.Telegram.WebApp;
      if (!isTelegramWebAppShape(raw)) {
        return;
      }
      const webApp = raw;
      this.webApp = webApp;
      webApp.ready();

      // Request fullscreen mode only on mobile platforms (Bot API 8.0+)
      // Skip for desktop (tdesktop, macos, web) - can cause rendering issues
      const platform = webApp.platform?.toLowerCase() || '';
      const isDesktop =
        platform === 'tdesktop' ||
        platform === 'macos' ||
        platform === 'web' ||
        platform === 'unknown';

      if (webApp.initData && webApp.requestFullscreen && !isDesktop) {
        webApp.requestFullscreen();
      }
    }
  }

  isAvailable(): boolean {
    return this.webApp !== null && !!this.webApp.initData;
  }

  // альтернатива isAvailable
  // isRunningInTelegram(): boolean {
  //   return (
  //     typeof window !== 'undefined' &&
  //     !!window.Telegram?.WebApp &&
  //     !!window.Telegram.WebApp.initData &&
  //     window.Telegram.WebApp.initData.length > 0
  //   );
  // }

  getInitData(): string | null {
    // Отдаем ВСЕ данные как есть от Telegram
    const initData = this.webApp?.initData;
    // console.log('Raw initData from Telegram:', initData);

    return initData || null;
  }

  getInitDataUnsafe(): TelegramWebAppInitData | null {
    return this.webApp?.initDataUnsafe || null;
  }

  getPlatform(): string | null {
    return this.webApp?.platform || null;
  }

  getVersion(): string | null {
    return this.webApp?.version || null;
  }

  getColorScheme(): 'light' | 'dark' | null {
    return this.webApp?.colorScheme || null;
  }

  expand(): void {
    this.webApp?.expand();
  }

  close(): void {
    this.webApp?.close();
  }

  requestFullscreen(): void {
    this.webApp?.requestFullscreen();
  }

  exitFullscreen(): void {
    this.webApp?.exitFullscreen();
  }

  isFullscreen(): boolean {
    return this.webApp?.isFullscreen ?? false;
  }

  showAlert(message: string): Promise<void> | void {
    return this.webApp?.showAlert(message);
  }

  showConfirm(message: string): Promise<boolean> | void {
    return this.webApp?.showConfirm(message);
  }

  hapticFeedback(
    type: 'impact' | 'notification' | 'selection',
    style?:
      | 'light'
      | 'medium'
      | 'heavy'
      | 'rigid'
      | 'soft'
      | 'error'
      | 'success'
      | 'warning'
  ): void {
    if (!this.webApp?.HapticFeedback) return;

    if (type === 'impact' && style && isImpactHapticStyle(style)) {
      this.webApp.HapticFeedback.impactOccurred(style);
    } else if (
      type === 'notification' &&
      style &&
      isNotificationHapticStyle(style)
    ) {
      this.webApp.HapticFeedback.notificationOccurred(style);
    } else if (type === 'selection') {
      this.webApp.HapticFeedback.selectionChanged();
    }
  }

  getDebugInfo() {
    if (!this.webApp) return null;

    return {
      platform: this.getPlatform(),
      version: this.getVersion(),
      colorScheme: this.getColorScheme(),
      initData: this.getInitData(),
      initDataUnsafe: this.getInitDataUnsafe(),
      isExpanded: this.webApp.isExpanded,
      isFullscreen: this.webApp.isFullscreen,
      themeParams: this.webApp.themeParams,
      viewportHeight: this.webApp.viewportHeight,
      viewportStableHeight: this.webApp.viewportStableHeight,
    };
  }
}

export const twaClient = new TelegramWebAppClient();
