export type Language = 'en' | 'ru';

export type LanguageContextType = {
  language: Language;
  setLanguage: (newLang: Language) => void;
};

export type LocaleObject = {
  [key: string]: string | LocaleObject;
};

export type TranslateFunction = (
  key: string,
  params?: Record<string, string | number>
) => string;

export type LocaleModule = {
  [K in Language]: LocaleObject;
};
