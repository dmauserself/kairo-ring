'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { DEFAULT_LANG, dictionaries, type Dict, type Lang } from './content';

type Ctx = { lang: Lang; t: Dict; setLang: (lang: Lang) => void };

const LangContext = createContext<Ctx | null>(null);
const STORAGE_KEY = 'kairo-lang';

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'ru' || saved === 'en') setLangState(saved);
    } catch {
      /* storage unavailable — stay on the default language */
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

/** The product price in the current language's currency: "$349" / "29 990 ₽". */
export function formatPrice(t: Dict) {
  return new Intl.NumberFormat(t.locale, {
    style: 'currency',
    currency: t.price.currency,
    maximumFractionDigits: 0,
  }).format(t.price.amount);
}
