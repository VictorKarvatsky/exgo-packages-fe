import { ru } from './ru';
import { en } from './en';
import type { LocaleModule } from '../types';

export const authLocales: LocaleModule = {
  ru,
  en,
};

export { ru, en };

export type AuthLocaleKeys = keyof typeof ru.auth;
