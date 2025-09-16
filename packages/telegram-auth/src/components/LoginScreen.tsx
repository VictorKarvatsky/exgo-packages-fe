import { useEffect, useState, useCallback, FC } from 'react';
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
  useBreakpointValue,
  Icon,
  HStack,
} from '@chakra-ui/react';
import { LoginButton } from '@telegram-auth/react';
import { useAuth } from '../hooks/use-auth';
import { twaClient } from '../telegram/twa-client';
import type {
  TelegramLoginWidgetData,
  TelegramDeepLinkUserData,
} from '../types';
import { toaster } from './ui/toaster';
import { LoginContainer } from './ui/LoginContainer';
import { TelegramButton } from './ui/TelegramButton';
import { ExgoIcon, TelegramIcon } from '../icons/common';

type LoginScreenProps = {
  texts?: {
    title?: string;
    subtitle?: string;
    instruction?: string;
    botDomainError?: string;
    openInApp?: string;
    or?: string;
  };
};

const defaultTexts = {
  title: 'Authorization',
  subtitle: 'Sign in via Telegram',
  instruction: 'Click the button below to sign in with Telegram',
  botDomainError: 'Bot domain invalid',
  openInApp: 'open in Telegram app',
  or: 'or',
};

const pillButtonStyles = {
  bg: 'brand.100',
  color: 'black',
  size: 'sm' as const,
  px: 6,
  borderRadius: '22px',
  border: '1px solid',
  borderColor: 'brand.200',
  _hover: { transform: 'scale(1.05)' },
  _active: { transform: 'scale(0.98)' },
  transition: 'all 0.2s ease',
};

export const LoginScreen: FC<LoginScreenProps> = ({ texts = {} }) => {
  const { state, login } = useAuth();
  const t = { ...defaultTexts, ...texts };
  const [loginMethod, setLoginMethod] = useState<'twa' | 'widget' | null>(null);
  const [isProcessingDeepLink, setIsProcessingDeepLink] = useState(false);
  const isMobile = useBreakpointValue({ base: true, md: false });

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
            title: 'Success',
            description: 'Deep link authorization successful',
            type: 'success',
            duration: 3000,
          });
        } catch {
          toaster.create({
            title: 'Deep Link Auth Failed',
            description: 'Please try logging in again',
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
  }, [handleTelegramDeepLinkAuth]);

  const handleTelegramWidgetAuth = useCallback(
    async (data: TelegramLoginWidgetData) => {
      try {
        await login('widget', data);
        toaster.create({
          title: 'Success',
          description: 'Logged in successfully',
          type: 'success',
          duration: 3000,
        });
      } catch {
        toaster.create({
          title: 'Login failed',
          description: 'Please try again',
          type: 'error',
          duration: 5000,
          closable: true,
        });
      }
    },
    [login]
  );

  useEffect(() => {
    if (twaClient.isAvailable()) {
      setLoginMethod('twa');
    } else {
      setLoginMethod('widget');
    }
  }, []);

  const handleTelegramWebAppAuth = async () => {
    if (!twaClient.isAvailable()) {
      toaster.create({
        title: 'Unavailable',
        description: 'Telegram Web App is not available',
        type: 'error',
        duration: 3000,
      });
      return;
    }

    const initData = twaClient.getInitData();
    if (!initData) {
      toaster.create({
        title: 'No data',
        description: 'No Telegram data available',
        type: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      await login('twa', initData);
      toaster.create({
        title: 'Success',
        description: 'Logged in successfully',
        type: 'success',
        duration: 3000,
      });
    } catch {
      toaster.create({
        title: 'Login failed',
        description: 'Please try again',
        type: 'error',
        duration: 5000,
        closable: true,
      });
    }
  };

  const handleOpenTelegramApp = () => {
    const authKey = crypto.randomUUID();

    sessionStorage.setItem('telegram_auth_key', authKey);

    const deepLink = `https://t.me/tsssss_test_bot?start=auth_${authKey}`;
    window.open(deepLink, '_blank');

    toaster.create({
      title: 'Telegram Opened',
      description: 'Complete authorization in Telegram and return to this page',
      type: 'info',
      duration: 5000,
    });
  };

  if (state.isLoading || isProcessingDeepLink) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg="app.bg">
        <VStack gap={4}>
          <Spinner size="xl" color="brand.500" />
          <Text color="white">
            {isProcessingDeepLink
              ? 'Processing Telegram authorization...'
              : 'Authenticating...'}
          </Text>
        </VStack>
      </Flex>
    );
  }

  return (
    <Flex minH="100vh" align="center" justify="center" bg="app.bg" p={4}>
      <VStack gap={4} align="center" w="full" maxW="500px">
        <LoginContainer>
          <Stack gap={isMobile ? '4' : '5'} px="1">
            <Heading size="xl" lineHeight="1.625rem">
              {t.title}
            </Heading>

            <Text textStyle="sm" color="gray.600">
              Войдите через Telegram
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
                    You are using Telegram Web App
                  </Text>
                  <Button
                    colorScheme="telegram"
                    size="lg"
                    w="full"
                    rounded="xl"
                    onClick={handleTelegramWebAppAuth}
                    loading={state.isLoading}
                    loadingText="Signing in..."
                  >
                    Sign in with Telegram
                  </Button>
                </VStack>
              )}

              {loginMethod === 'widget' && (
                <VStack gap={4} w="full">
                  <Text fontSize="sm" color="gray.600" textAlign="center">
                    Click the button below to sign in with Telegram
                  </Text>

                  <Flex justify="center" align="center" w="full">
                    <LoginButton
                      botUsername="tsssss_test_bot"
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
                    <Text as="span">or</Text>
                    <TelegramButton
                      onClick={handleOpenTelegramApp}
                      disabled={state.isLoading || isProcessingDeepLink}
                      size="sm"
                      py="2"
                    >
                      open in Telegram app
                    </TelegramButton>
                  </Box>
                </VStack>
              )}

              {!loginMethod && (
                <Alert.Root status="warning" rounded="xl">
                  <Alert.Indicator />
                  <Alert.Title>
                    Unable to determine login method. Please check your
                    configuration.
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
          minWidth={isMobile ? '100%' : 'bgWidthMin'}
          maxWidth={isMobile ? '100%' : 'bgWidthMax'}
          rounded="3xl"
          boxShadow={
            isMobile
              ? 'none'
              : '0px 4px 8px 0px #18181B1A, 0px 0px 1px 0px #18181B4D'
          }
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
                {' '}
                Надёжный сервис обмена валют и цифровых активов на Пхукете
              </Text>
            </VStack>
          </Stack>
        </Box>
      </VStack>
    </Flex>
  );
};
