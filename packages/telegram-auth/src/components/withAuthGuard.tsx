import { useEffect, type ComponentType } from 'react';
import { Box, Spinner, Flex } from '@chakra-ui/react';
import { useAuth } from '../hooks/use-auth';
import { LoginScreen } from './LoginScreen';

export function withAuthGuard<TProps extends Record<string, unknown>>(
  WrappedComponent: ComponentType<TProps>,
  requiredPermissions?: string[],
  requiredRoles?: string[]
) {
  return function AuthGuardedComponent(props: TProps) {
    const { state, hasPermission, hasRole } = useAuth();

    useEffect(() => {
      if (state.isAuthenticated && state.user) {
        // Check permissions
        if (requiredPermissions?.length) {
          const hasAllPermissions = requiredPermissions.every((permission) =>
            hasPermission(permission)
          );
          if (!hasAllPermissions) {
            console.warn(
              'User lacks required permissions:',
              requiredPermissions
            );
          }
        }

        // Check roles
        if (requiredRoles?.length) {
          const hasAllRoles = requiredRoles.every((role) => hasRole(role));
          if (!hasAllRoles) {
            console.warn('User lacks required roles:', requiredRoles);
          }
        }
      }
    }, [state.isAuthenticated, state.user, hasPermission, hasRole]);

    // Loading state
    if (state.isLoading) {
      return (
        <Flex minH="100vh" align="center" justify="center">
          <Spinner size="xl" color="blue.500" />
        </Flex>
      );
    }

    // Not authenticated
    if (!state.isAuthenticated) {
      return <LoginScreen />;
    }

    // Check permissions
    if (requiredPermissions?.length) {
      const hasAllPermissions = requiredPermissions.every((permission) =>
        hasPermission(permission)
      );

      if (!hasAllPermissions) {
        return (
          <Flex minH="100vh" align="center" justify="center" p={4}>
            <Box textAlign="center">
              <h1>Access Denied</h1>
              <p>
                {`You don't have the required permissions to access this page.`}
              </p>
            </Box>
          </Flex>
        );
      }
    }

    // Check roles
    if (requiredRoles?.length) {
      const hasAllRoles = requiredRoles.every((role) => hasRole(role));

      if (!hasAllRoles) {
        return (
          <Flex minH="100vh" align="center" justify="center" p={4}>
            <Box textAlign="center">
              <h1>Access Denied</h1>
              <p>{`You don't have the required role to access this page.`}</p>
            </Box>
          </Flex>
        );
      }
    }

    // Authenticated and authorized
    /* eslint-disable react/jsx-props-no-spreading */
    return <WrappedComponent {...props} />;
  };
}
