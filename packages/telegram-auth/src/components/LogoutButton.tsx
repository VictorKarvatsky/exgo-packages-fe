import { useState } from 'react';
import { Button, HStack, Text, Box, ButtonProps } from '@chakra-ui/react';
import { useAuth } from '../hooks/use-auth';
import { toaster } from './ui/toaster';

type LogoutButtonProps = Partial<ButtonProps> & {
  showUser?: boolean;
  showAvatar?: boolean;
  buttonText?: string;
};

export const LogoutButton = ({
  showUser = true,
  showAvatar = true,
  buttonText = 'Logout',
  ...buttonProps
}: LogoutButtonProps) => {
  const { state, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();

      toaster.create({
        title: 'Logged out',
        description: 'You have been successfully logged out',
        type: 'success',
        duration: 3000,
      });
    } catch {
      toaster.create({
        title: 'Logout failed',
        description: 'Please try again',
        type: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!state.isAuthenticated || !state.user) {
    return null;
  }

  return (
    <HStack gap={3}>
      {showUser && (
        <HStack gap={2}>
          {showAvatar && (
            <Box
              w={8}
              h={8}
              bg="blue.500"
              color="white"
              display="flex"
              alignItems="center"
              justifyContent="center"
              borderRadius="full"
              fontSize="sm"
              fontWeight="bold"
            >
              {state.user.firstName.charAt(0)}
            </Box>
          )}

          <Text fontSize="sm" fontWeight="medium">
            {state.user.firstName}
          </Text>
        </HStack>
      )}

      <Button
        variant="ghost"
        size="sm"
        colorScheme="red"
        {...buttonProps}
        onClick={handleLogout}
        loading={isLoggingOut}
        loadingText="Logging out..."
      >
        {buttonText}
      </Button>
    </HStack>
  );
};
