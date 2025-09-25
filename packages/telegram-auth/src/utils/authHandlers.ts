import { useCallback } from 'react';
import { useAuth } from '../hooks/use-auth';
import { twaClient } from '../telegram/twa-client';
import { toaster } from '../components/ui/toaster';
import type {
  TelegramLoginWidgetData,
  TelegramDeepLinkUserData,
} from '../types';

export const useAuthHandlers = (t: (key: string) => string) => {
  const { login } = useAuth();

  const handleTelegramDeepLinkAuth = useCallback(
    async (
      authKey: string,
      userData: TelegramDeepLinkUserData
    ): Promise<void> => {
      const baseData: TelegramLoginWidgetData = {
        id: userData.id,
        first_name: userData.first_name,
        last_name: userData.last_name || '',
        username: userData.username || '',
        photo_url: userData.photo_url || '',
        auth_date: userData.auth_date || Math.floor(Date.now() / 1000),
        hash: userData.hash || '',
      };

      await login('widget', { ...baseData, auth_key: authKey });
    },
    [login]
  );

  const handleTelegramWidgetAuth = useCallback(
    async (data: TelegramLoginWidgetData) => {
      try {
        await login('widget', data);
        toaster.create({
          title: t('auth.success'),
          description: t('auth.loggedInSuccessfully'),
          type: 'success',
          duration: 3000,
        });
      } catch {
        toaster.create({
          title: t('auth.loginFailed'),
          description: t('auth.pleaseTryAgain'),
          type: 'error',
          duration: 5000,
          closable: true,
        });
      }
    },
    [login, t]
  );

  const handleTelegramWebAppAuth = useCallback(async () => {
    if (!twaClient.isAvailable()) {
      toaster.create({
        title: t('auth.unavailable'),
        description: t('auth.twaNotAvailable'),
        type: 'error',
        duration: 3000,
      });
      return;
    }

    const initData = twaClient.getInitData();
    if (!initData) {
      toaster.create({
        title: t('auth.noData'),
        description: t('auth.noTelegramData'),
        type: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      await login('twa', initData);
      toaster.create({
        title: t('auth.success'),
        description: t('auth.loggedInSuccessfully'),
        type: 'success',
        duration: 3000,
      });
    } catch {
      toaster.create({
        title: t('auth.loginFailed'),
        description: t('auth.pleaseTryAgain'),
        type: 'error',
        duration: 5000,
        closable: true,
      });
    }
  }, [login, t]);

  const handleOpenTelegramApp = useCallback(() => {
    const authKey = crypto.randomUUID();
    sessionStorage.setItem('telegram_auth_key', authKey);
    // const deepLink = `https://t.me/tsssss_test_bot?start=auth_${authKey}`;
    // const deepLink = `https://t.me/${import.meta.env.VITE_TELEGRAM_BOT_NAME}?start`;
    const deepLink = `https://t.me/tsssss_test_bot?/startapp`;
    window.open(deepLink, '_blank');

    toaster.create({
      title: t('auth.telegramOpened'),
      description: t('auth.completeAuthInTelegram'),
      type: 'info',
      duration: 5000,
    });
  }, [t]);

  return {
    handleTelegramDeepLinkAuth,
    handleTelegramWidgetAuth,
    handleTelegramWebAppAuth,
    handleOpenTelegramApp,
  };
};
