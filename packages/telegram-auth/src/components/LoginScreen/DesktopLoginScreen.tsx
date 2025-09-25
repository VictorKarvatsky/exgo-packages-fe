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
  Stack,
  Icon,
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
import { ExgoIcon } from '../../icons/common';

export const DesktopLoginScreen: FC = () => {
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
      <Flex minH="100vh" align="center" justify="center" bg="app.bg">
        <VStack gap={4}>
          <Spinner size="xl" color="brand.500" />
          <Text color="white">
            {isProcessingDeepLink
              ? t('auth.processingTelegramAuth')
              : t('auth.authenticating')}
          </Text>
        </VStack>
      </Flex>
    );
  }

  return (
    <Flex minH="100vh" align="center" justify="center" bg="app.bg" p={4}>
      <VStack gap={4} align="center" w="full" maxW="500px">
        <LoginContainer>
          <Stack gap="5" px="1">
            <Heading size="xl" lineHeight="1.625rem">
              {t('auth.title')}
            </Heading>

            <Text textStyle="sm" color="gray.600">
              {t('auth.subtitle')}
            </Text>

            {state.error && (
              <Alert.Root status="error" rounded="xl">
                <Alert.Indicator />
                <Alert.Title>{state.error}</Alert.Title>
              </Alert.Root>
            )}

            <VStack gap={6} align="center" w="full">
              {loginMethod === 'twa' && (
                <VStack gap={4} w="full">
                  <Text fontSize="sm" color="gray.600" textAlign="center">
                    {t('auth.twaDetected')}
                  </Text>
                  <Button
                    colorScheme="telegram"
                    size="lg"
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
                <VStack gap={4} w="full">
                  <Text fontSize="sm" color="gray.600" textAlign="center">
                    {t('auth.clickToSignIn')}
                  </Text>

                  <Flex justify="center" align="center" w="full">
                    <LoginButton
                      botUsername={`${import.meta.env.VITE_TELEGRAM_BOT_NAME}`}
                      buttonSize="large"
                      onAuthCallback={handleTelegramWidgetAuth}
                    />
                  </Flex>

                  <Box
                    fontSize="xs"
                    color="gray.500"
                    textAlign="center"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    gap={2}
                  >
                    <Text as="span">{t('auth.or')}</Text>
                    <TelegramButton
                      onClick={handleOpenTelegramApp}
                      disabled={state.isLoading || isProcessingDeepLink}
                      size="xs"
                      minH="auto"
                      h="auto"
                      px="2"
                      py="1"
                      fontSize="xs"
                    >
                      {t('auth.openInApp')}
                    </TelegramButton>
                  </Box>
                </VStack>
              )}

              {!loginMethod && (
                <Alert.Root status="warning" rounded="xl">
                  <Alert.Indicator />
                  <Alert.Title>
                    {t('auth.unableToDetermineLoginMethod')}
                  </Alert.Title>
                </Alert.Root>
              )}
            </VStack>
          </Stack>
        </LoginContainer>

        <Box
          bg="footer.bg"
          color="footer.primaryText"
          width="100%"
          maxWidth="bgWidthMax"
          rounded="3xl"
          boxShadow="0px 4px 8px 0px #18181B1A, 0px 0px 1px 0px #18181B4D"
          mx="auto"
        >
          <Stack gap="5" p="4">
            <VStack gap="4" align="flex-start" px="1">
              <Icon as={ExgoIcon} color="button.primaryBg" />
              <Text
                textStyle="xs"
                color="gray.300"
                fontSize="sm"
                fontWeight="medium"
              >
                {t('auth.reliableExchangeService')}
              </Text>
            </VStack>
          </Stack>
        </Box>
      </VStack>
    </Flex>
  );
};
