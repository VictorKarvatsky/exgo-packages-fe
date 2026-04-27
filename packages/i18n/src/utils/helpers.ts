import type { LocaleObject } from '../types';

function isLocaleBranch(value: unknown): value is LocaleObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Получает значение из вложенного объекта по ключу с точками
 * Например: getValue(obj, 'user.profile.name')
 */
export function getValue(obj: LocaleObject, path: string): string {
  const keys = path.split('.');
  let current: string | LocaleObject = obj;

  for (const key of keys) {
    if (!isLocaleBranch(current)) {
      return path;
    }
    if (!Object.prototype.hasOwnProperty.call(current, key)) {
      return path;
    }
    const next: string | LocaleObject = current[key];
    current = next;
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
