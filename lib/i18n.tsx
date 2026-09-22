'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { dictionaries, type Dict, type Lang } from './content';

type Ctx = { lang: Lang; t: Dict; setLang: (lang: Lang) => void };

const LangContext = createContext<Ctx | null>(null);
const STORAGE_KEY = 'kairo-lang';

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ru');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'ru' || saved === 'en') setLangState(saved);
    } catch {
      /* storage unavailable — stay on Russian */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  return <LangContext.Provider value={{ lang, t: dictionaries[lang], setLang }}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used inside LangProvider');
  return ctx;
}

export function formatPrice(value: number, locale: string) {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value).replace(/,/g, ' ');
}
