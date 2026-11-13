import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { si } from './si';

export type Lang = 'en' | 'si';
export const LANGUAGES: { id: Lang; label: string; short: string }[] = [
  { id: 'en', label: 'English', short: 'EN' },
  { id: 'si', label: 'සිංහල', short: 'සිං' },
];

type Vars = Record<string, string | number>;
interface LanguageValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** Translate an English UI string. The English text is the key; missing translations fall back to English. */
  t: (text: string, vars?: Vars) => string;
}

const STORAGE_KEY = 'milco.lang';
const LanguageContext = createContext<LanguageValue | null>(null);
const warned = new Set<string>();

function readStored(): Lang {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'si' ? 'si' : 'en';
  } catch {
    return 'en';
  }
}

const fill = (s: string, vars?: Vars) => (vars ? s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m)) : s);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(readStored);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* private mode: keep the choice for this visit only */
    }
  }, [lang]);

  const t = useCallback(
    (text: string, vars?: Vars) => {
      if (lang === 'en') return fill(text, vars);
      const hit = si[text];
      if (hit === undefined && import.meta.env.DEV && !warned.has(text)) {
        warned.add(text);
        console.warn(`[i18n] Missing Sinhala text for: "${text}"`);
      }
      return fill(hit ?? text, vars);
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used inside <LanguageProvider>');
  return ctx;
}
