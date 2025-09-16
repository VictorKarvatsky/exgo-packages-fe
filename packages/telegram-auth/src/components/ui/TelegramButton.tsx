import { FC, ReactNode } from 'react';
import { Button, HStack, Box, ButtonProps } from '@chakra-ui/react';
import { TelegramIcon } from '../../icons/common';

type TelegramButtonProps = Omit<ButtonProps, 'children'> & {
  children: ReactNode;
  onClick?: () => void;
};

export const TelegramButton: FC<TelegramButtonProps> = ({
  children,
  onClick,
  ...buttonProps
}) => {
  return (
    <Button
      size="md"
      bg="button.primaryBg"
      color="button.primaryText"
      rounded="2xl"
      width="100%"
      py="4"
      fontSize="md"
      fontWeight="600"
      _hover={{
        transform: 'translateY(-1px)',
      }}
      _active={{
        transform: 'translateY(0)',
      }}
      transition="all 0.2s"
      onClick={onClick}
      {...buttonProps}
    >
      <HStack gap="3" align="center">
        <span>{children}</span>

        <Box
          as="span"
          display="inline-flex"
          alignItems="center"
          justifyContent="center"
          w="28px"
          h="28px"
          rounded="full"
          bg="button.primaryText"
          color="white"
        >
          <TelegramIcon boxSize="16px" transform="translate(-1px, -0.5px)" />
        </Box>
      </HStack>
    </Button>
  );
};
