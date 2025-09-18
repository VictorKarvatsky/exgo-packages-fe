import type { LocaleObject } from '../types';

/**
 * Получает значение из вложенного объекта по ключу с точками
 * Например: getValue(obj, 'user.profile.name')
 */
export function getValue(obj: LocaleObject, path: string): string {
  const keys = path.split('.');
  let current: any = obj;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return path; // Возвращаем ключ, если не найден перевод
    }
  }

  return typeof current === 'string' ? current : path;
}

/**
 * Интерполяция параметров в строку
 * Например: interpolate('Hello {{name}}!', { name: 'John' }) -> 'Hello John!'
 */
export function interpolate(
  template: string,
  params?: Record<string, string | number>
): string {
  if (!params) return template;

  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return params[key]?.toString() || match;
  });
}

/**
 * Создает функцию перевода для конкретного языка и локалей
 */
export function createTranslateFunction(
  currentLanguage: string,
  locales: { [lang: string]: LocaleObject }
) {
  return (key: string, params?: Record<string, string | number>): string => {
    const locale = locales[currentLanguage];
    if (!locale) return key;

    const translation = getValue(locale, key);
    return interpolate(translation, params);
  };
}
