export { LanguageProvider, LanguageContext } from './contexts/LanguageContext';
export { LanguageProviderWithRouter } from './contexts/LanguageProviderWithRouter';

export { useLanguage } from './hooks/useLanguage';
export { useTranslate, useGlobalTranslate } from './hooks/useTranslate';

export type {
  Language,
  LanguageContextType,
  LocaleObject,
  TranslateFunction,
  LocaleModule,
} from './types';

export { authLocales, ru, en } from './locales';
export type { AuthLocaleKeys } from './locales';

export {
  getValue,
  interpolate,
  createTranslateFunction,
} from './utils/helpers';

export { getBrowserLanguage } from './utils/browser-language';
