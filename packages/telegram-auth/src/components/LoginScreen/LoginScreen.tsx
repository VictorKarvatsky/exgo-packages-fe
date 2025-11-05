import { FC, useState, useEffect } from "react";
import { useBreakpointValue } from "@chakra-ui/react";
import { LanguageProvider, Language } from "@exgo/i18n";
import { DesktopLoginScreen } from "./DesktopLoginScreen";
import { MobileLoginScreen } from "./MobileLoginScreen";
import { LANGUAGE_KEY, languageDefault } from "./constants";

export const LoginScreen: FC = () => {
  const isMobile = useBreakpointValue({ base: true, md: false });
  const [language, setLanguage] = useState<Language>(() => {
    return (
      (localStorage.getItem(LANGUAGE_KEY) as Language | null) ?? languageDefault
    );
  });
  
  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem(LANGUAGE_KEY, language);
  }, [language]);
  
  return (
    <LanguageProvider language={language} setLanguage={setLanguage}>
      {isMobile ? <MobileLoginScreen /> : <DesktopLoginScreen />}
    </LanguageProvider>
  );
};
