import type { TelegramWebApp, TelegramWebAppInitData } from '../types';

export class TelegramWebAppClient {
  private webApp: TelegramWebApp | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      this.webApp = window.Telegram.WebApp;
      this.webApp.ready();
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

    if (type === 'impact' && style) {
      this.webApp.HapticFeedback.impactOccurred(
        style as 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'
      );
    } else if (type === 'notification' && style) {
      this.webApp.HapticFeedback.notificationOccurred(
        style as 'error' | 'success' | 'warning'
      );
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
      themeParams: this.webApp.themeParams,
      viewportHeight: this.webApp.viewportHeight,
      viewportStableHeight: this.webApp.viewportStableHeight,
      isMock: process.env.NODE_ENV === 'development',
    };
  }
}

export const twaClient = new TelegramWebAppClient();
