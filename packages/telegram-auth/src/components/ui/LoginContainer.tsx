import { FC, PropsWithChildren } from 'react';
import { Box, VStack } from '@chakra-ui/react';

export const LoginContainer: FC<PropsWithChildren> = ({ children }) => {
  return (
    <Box
      bg="white"
      rounded="3xl"
      width="100%"
      minWidth="280px"
      maxWidth="400px"
      borderRadius={{ base: '3xl', md: '4xl' }}
      boxShadow="0px 4px 8px 0px #18181B1A, 0px 0px 1px 0px #18181B4D"
      p={{ base: 4, md: 6 }}
      position="relative"
      overflow="hidden"
      mx="auto"
      my={{ base: 4, md: 8 }}
    >
      <VStack align="stretch" gap={{ base: 6, md: 8 }}>
        {children}
      </VStack>
    </Box>
  );
};
