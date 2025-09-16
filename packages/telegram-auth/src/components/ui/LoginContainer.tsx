import { FC, PropsWithChildren } from 'react';
import { Box, VStack } from '@chakra-ui/react';

export const LoginContainer: FC<PropsWithChildren> = ({ children }) => {
  return (
    <Box
      bg="white"
      rounded="3xl"
      width="100%"
      minWidth="280px"
      maxWidth="600px"
      boxShadow="0px 4px 8px 0px #18181B1A, 0px 0px 1px 0px #18181B4D"
      p={{ base: 4, md: 6 }}
      mx="auto"
      my={0}
    >
      {children}
    </Box>
  );
};
