import { useEffect, useState, useCallback } from 'react';
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
} from '@chakra-ui/react';
import { LoginButton } from '@telegram-auth/react';
import { useAuth } from '../hooks/use-auth';
import { twaClient } from '../telegram/twa-client';
import type {
  TelegramLoginWidgetData,
  TelegramDeepLinkUserData,
} from '../types';
import { toaster } from './ui/toaster';

export const LoginScreenPartial = () => {
  const { state, login } = useAuth();
  const [loginMethod, setLoginMethod] = useState<'twa' | 'widget' | null>(null);
  const [isProcessingDeepLink, setIsProcessingDeepLink] = useState(false);

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
      <Flex
        minH="100vh"
        align="center"
        justify="center"
        bg="gray.50"
        _dark={{ bg: 'gray.900' }}
      >
        <VStack gap={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>
            {isProcessingDeepLink
              ? 'Processing Telegram authorization...'
              : 'Authenticating...'}
          </Text>
        </VStack>
      </Flex>
    );
  }

  return (
    <Box
      id="auth"
      bg="white"
      rounded="3xl"
      width="100%"
      minWidth="bgWidthMin"
      maxWidth="bgWidthMax"
      boxShadow="0px 4px 8px 0px #18181B1A, 0px 0px 1px 0px #18181B4D"
    >
      <Stack gap="5" p="4">
        <VStack gap={4} textAlign="center">
          <Heading
            size={{ base: 'xl', md: '2xl' }}
            color="gray.700"
            _dark={{ color: 'gray.200' }}
          >
            Авторизация
          </Heading>
          <Text
            color="gray.500"
            _dark={{ color: 'gray.400' }}
            fontSize={{ base: 'md', md: 'lg' }}
          >
            Войдите через Telegram
          </Text>
        </VStack>

        {state.error && (
          <Alert.Root status="error" rounded="xl">
            <Alert.Indicator />
            <Alert.Title>{state.error}</Alert.Title>
          </Alert.Root>
        )}

        <VStack gap={6} align="center" maxW="400px" mx="auto" w="full">
          {loginMethod === 'twa' && (
            <VStack gap={4} w="full">
              <Text
                fontSize="sm"
                color="gray.600"
                _dark={{ color: 'gray.400' }}
                textAlign="center"
              >
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
              <Text
                fontSize="sm"
                color="gray.600"
                _dark={{ color: 'gray.400' }}
                textAlign="center"
              >
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
                _dark={{ color: 'gray.500' }}
                textAlign="center"
                display="flex"
                alignItems="center"
                justifyContent="center"
                gap={2}
              >
                <Text as="span">or</Text>
                <Button
                  variant="outline"
                  size="xs"
                  colorScheme="blue"
                  borderWidth="1px"
                  rounded="lg"
                  onClick={handleOpenTelegramApp}
                  disabled={state.isLoading || isProcessingDeepLink}
                >
                  open in Telegram app
                </Button>
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
    </Box>
  );
};
