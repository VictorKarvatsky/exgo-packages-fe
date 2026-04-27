import {
  createContext,
  FC,
  PropsWithChildren,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import type { Language, LanguageContextType } from '../types';

const defaultContext: LanguageContextType = {
  language: 'en',
  setLanguage: () => {
    throw new Error('setLanguage must be used within LanguageProvider');
  },
};

export const LanguageContext =
  createContext<LanguageContextType>(defaultContext);

type LanguageProviderProps = PropsWithChildren<{
  initialLanguage?: Language;
  language?: Language;
  setLanguage?: (newLang: Language) => void;
}>;

export const LanguageProvider: FC<LanguageProviderProps> = ({
  children,
  initialLanguage = 'en',
  language: externalLanguage,
  setLanguage: externalSetLanguage,
}) => {
  // Внутреннее состояние для standalone использования
  const [internalLanguage, setInternalLanguage] =
    useState<Language>(initialLanguage);

  // Используем внешнее состояние если передано, иначе внутреннее
  const currentLanguage = externalLanguage ?? internalLanguage;
  const currentSetLanguage = externalSetLanguage ?? setInternalLanguage;

  const contextValue = useMemo(
    () => ({
      language: currentLanguage,
      setLanguage: currentSetLanguage,
    }),
    [currentLanguage, currentSetLanguage]
  );

  /**
   * Совпадает с подписью интерфейса — иначе Chrome/Safari считают страницу «на другом языке»
   * и навязчиво предлагают перевод (например RU UI при lang=en).
   */
  useLayoutEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = currentLanguage;
    }
  }, [currentLanguage]);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};
