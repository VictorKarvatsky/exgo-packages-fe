import { FC } from 'react';
import { FaTelegramPlane } from 'react-icons/fa';
import { Icon, IconProps } from '@chakra-ui/react';

export const TelegramIcon: FC<IconProps> = (props) => (
  <Icon
    as={FaTelegramPlane}
    display="inline-block"
    verticalAlign="middle"
    {...props}
  />
);
