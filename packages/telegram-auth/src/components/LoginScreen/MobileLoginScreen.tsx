import { useEffect, useState, FC } from 'react';
import {
  Box,
  Button,
  VStack,
  Heading,
  Text,
  Alert,
  Spinner,
  Flex,
} from '@chakra-ui/react';
import { LoginButton } from '@telegram-auth/react';
import { useTranslate, authLocales } from '@exgo/i18n';
import { useAuth } from '../../hooks/use-auth';
import { twaClient } from '../../telegram/twa-client';
import { useAuthHandlers } from '../../utils/authHandlers';
import type { TelegramDeepLinkUserData } from '../../types';
import { toaster } from '../ui/toaster';
import { LoginContainer } from '../ui/LoginContainer';
import { TelegramButton } from '../ui/TelegramButton';

export const MobileLoginScreen: FC = () => {
  const { state } = useAuth();
  const t = useTranslate(authLocales);
  const [loginMethod, setLoginMethod] = useState<'twa' | 'widget' | null>(null);
  const [isProcessingDeepLink, setIsProcessingDeepLink] = useState(false);

  const {
    handleTelegramDeepLinkAuth,
    handleTelegramWidgetAuth,
    handleTelegramWebAppAuth,
    handleOpenTelegramApp,
  } = useAuthHandlers(t);

  useEffect(() => {
    const checkTelegramCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const authKey = urlParams.get('auth_key');
      const userData = urlParams.get('user_data');

      if (authKey && userData) {
        setIsProcessingDeepLink(true);
        try {
          const parsedUserData: TelegramDeepLinkUserData = JSON.parse(
            decodeURIComponent(userData)
          );

          await handleTelegramDeepLinkAuth(authKey, parsedUserData);

          window.history.replaceState({}, '', window.location.pathname);

          toaster.create({
            title: t('auth.success'),
            description: t('auth.deepLinkAuthSuccessful'),
            type: 'success',
            duration: 3000,
          });
        } catch {
          toaster.create({
            title: t('auth.deepLinkAuthFailed'),
            description: t('auth.pleaseTryAgain'),
            type: 'error',
            duration: 5000,
            closable: true,
          });
        } finally {
          setIsProcessingDeepLink(false);
        }
      }
    };

    checkTelegramCallback();
  }, [handleTelegramDeepLinkAuth, t]);

  useEffect(() => {
    if (twaClient.isAvailable()) {
      setLoginMethod('twa');
    } else {
      setLoginMethod('widget');
    }
  }, []);

  if (state.isLoading || isProcessingDeepLink) {
    return (
      <Flex minH="auto" align="center" justify="center" bg="app.bg">
        <VStack gap={4}>
          <Spinner size="xl" color="brand.500" />
          <Text color="white" textAlign="center" px={4}>
            {isProcessingDeepLink
              ? t('auth.processingTelegramAuth')
              : t('auth.authenticating')}
          </Text>
        </VStack>
      </Flex>
    );
  }

  return (
    <Flex
      minH="auto"
      align="center"
      justify="center"
      bg="app.bg"
      p={2} // Минимальные отступы
    >
      <Box w="full" maxW="380px">
        {' '}
        {/* Уменьшили максимальную ширину */}
        <LoginContainer>
          <VStack gap="3" px="4" py="5">
            {' '}
            {/* Компактные отступы */}
            <VStack gap="2" textAlign="center">
              <Heading size="lg" lineHeight="1.3">
                {t('auth.title')}
              </Heading>

              <Text fontSize="sm" color="gray.600">
                {t('auth.subtitle')}
              </Text>
            </VStack>
            {state.error && (
              <Alert.Root status="error" rounded="xl" size="sm">
                <Alert.Indicator />
                <Alert.Title fontSize="sm">{state.error}</Alert.Title>
              </Alert.Root>
            )}
            <VStack gap="3" w="full">
              {loginMethod === 'twa' && (
                <VStack gap="3" w="full">
                  <Text fontSize="xs" color="gray.600" textAlign="center">
                    {t('auth.twaDetected')}
                  </Text>
                  <Button
                    colorScheme="telegram"
                    size="md"
                    w="full"
                    rounded="xl"
                    onClick={handleTelegramWebAppAuth}
                    loading={state.isLoading}
                    loadingText={t('auth.signingIn')}
                  >
                    {t('auth.signInWithTelegram')}
                  </Button>
                </VStack>
              )}

              {loginMethod === 'widget' && (
                <VStack gap="3" w="full">
                  <Text fontSize="xs" color="gray.600" textAlign="center">
                    {t('auth.clickToSignIn')}
                  </Text>

                  <Flex justify="center" align="center" w="full">
                    <LoginButton
                      botUsername={`${import.meta.env.VITE_TELEGRAM_BOT_NAME}`}
                      buttonSize="medium"
                      onAuthCallback={handleTelegramWidgetAuth}
                    />
                  </Flex>

                  {/* Компактная строка с кнопкой */}
                  <Flex
                    fontSize="xs"
                    color="gray.500"
                    align="center"
                    justify="center"
                    gap="1"
                    wrap="wrap" // Переносим если не помещается
                  >
                    <Text>{t('auth.or')}</Text>
                    <TelegramButton
                      onClick={handleOpenTelegramApp}
                      disabled={state.isLoading || isProcessingDeepLink}
                      size="xs"
                      h="20px" // Фиксированная маленькая высота
                      px="2" // Боковые отступы
                      fontSize="xs" // Мелкий шрифт
                      //   borderRadius="md"  // Обычный радиус
                    >
                      {t('auth.openInApp')}
                    </TelegramButton>
                  </Flex>
                </VStack>
              )}

              {!loginMethod && (
                <Alert.Root status="warning" rounded="xl" size="sm">
                  <Alert.Indicator />
                  <Alert.Title fontSize="sm">
                    {t('auth.unableToDetermineLoginMethod')}
                  </Alert.Title>
                </Alert.Root>
              )}
            </VStack>
          </VStack>
        </LoginContainer>
      </Box>
    </Flex>
  );
};
