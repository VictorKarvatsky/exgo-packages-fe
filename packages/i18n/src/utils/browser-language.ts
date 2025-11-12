import type { Language } from '../types';

/**
 * Определяет язык браузера пользователя
 * @returns 'ru' если язык браузера русский, 'en' если английский или любой другой
 */
export function getBrowserLanguage(): Language {
  // Получаем язык браузера
  const browserLang =
    navigator.language || navigator?.['userLanguage' as keyof Navigator];
  // Извлекаем основной код языка (например, 'ru' из 'ru-RU')
  const langCode = String(browserLang).split('-')[0].toLowerCase();

  // Если язык русский, возвращаем 'ru', иначе 'en'
  return langCode === 'ru' ? 'ru' : 'en';
}
