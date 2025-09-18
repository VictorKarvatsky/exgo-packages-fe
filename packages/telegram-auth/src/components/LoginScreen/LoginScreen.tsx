import { FC } from 'react';
import { useBreakpointValue } from '@chakra-ui/react';
import { LanguageProvider } from '@exgo/i18n';
import { DesktopLoginScreen } from './DesktopLoginScreen';
import { MobileLoginScreen } from './MobileLoginScreen';

export const LoginScreen: FC = () => {
  const isMobile = useBreakpointValue({ base: true, md: false });
  
  return (
    <LanguageProvider initialLanguage="ru">
      {isMobile ? <MobileLoginScreen /> : <DesktopLoginScreen />}
    </LanguageProvider>
  );
};
