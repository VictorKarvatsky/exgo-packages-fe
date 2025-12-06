import { FC, PropsWithChildren, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LanguageProvider } from "./LanguageContext";
import type { Language } from "../types";
import { getBrowserLanguage } from "../utils/browser-language";

/**
 * LanguageProvider с поддержкой URL search параметров
 *
 * Логика работы:
 * 1. Если в URL есть ?lang=en или ?lang=ru - используется этот язык
 * 2. Если параметра нет - определяется язык браузера (ru или en)
 * 3. При смене языка добавляется/обновляется параметр ?lang в URL
 */
export const LanguageProviderWithRouter: FC<PropsWithChildren> = ({
  children,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Определяем начальный язык
  const getInitialLanguage = (): Language => {
    const langParam = searchParams.get("lang");

    // Если в URL есть параметр lang и он валидный
    if (langParam === "en" || langParam === "ru") {
      return langParam;
    }

    // Иначе определяем по языку браузера
    return getBrowserLanguage();
  };

  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  // Синхронизация языка с URL при первой загрузке
  useEffect(() => {
    const langParam = searchParams.get("lang");

    // Если параметра нет в URL, добавляем его (сохраняя остальные параметры)
    if (!langParam) {
      const initialLang = getBrowserLanguage();
      setLanguageState(initialLang);
      const newParams = new URLSearchParams(searchParams);
      newParams.set("lang", initialLang);
      setSearchParams(newParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Выполняется только при монтировании

  // Функция для изменения языка
  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("lang", newLang);
    setSearchParams(newParams);
  };

  // Обновляем язык при изменении URL (например, при навигации назад/вперед)
  useEffect(() => {
    const langParam = searchParams.get("lang");
    if (langParam === "en" || langParam === "ru") {
      if (langParam !== language) {
        setLanguageState(langParam);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Обновляем атрибут lang в HTML
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageProvider language={language} setLanguage={setLanguage}>
      {children}
    </LanguageProvider>
  );
};
