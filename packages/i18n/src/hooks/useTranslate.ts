import { useMemo } from 'react';
import { useLanguage } from './useLanguage';
import { createTranslateFunction } from '../utils/helpers';
import type { LocaleModule, TranslateFunction } from '../types';

/**
 * Хук для перевода с поддержкой модулей локализации
 * @param localeModule - объект с переводами для разных языков
 * @returns функция перевода
 */
export function useTranslate(localeModule: LocaleModule): TranslateFunction {
  const { language } = useLanguage();

  return useMemo(() => {
    return createTranslateFunction(language, localeModule);
  }, [language, localeModule]);
}

/**
 * Хук для перевода с использованием глобальных локалей
 * Для будущего использования когда будут глобальные переводы
 * @param namespace - пространство имен для переводов (например: 'common', 'auth')
 */
export function useGlobalTranslate(namespace?: string): TranslateFunction {
  const { language } = useLanguage();

  return useMemo(() => {
    // Заглушка - в будущем здесь будет загрузка глобальных локалей
    const globalLocales = {
      [language]: {},
    };

    return createTranslateFunction(language, globalLocales);
  }, [language, namespace]);
}
