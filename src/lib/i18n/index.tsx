"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { en, type Dict } from "./en";
import { zh } from "./zh";

export type Locale = "en" | "zh";
const DICTS: Record<Locale, Dict> = { en, zh };
const KEY = "ts-locale";

type Ctx = { locale: Locale; t: Dict; setLocale: (l: Locale) => void; fmt: (s: string, vars?: Record<string, string | number>) => string };
const I18nContext = createContext<Ctx | null>(null);

export const fmt = (s: string, vars: Record<string, string | number> = {}) =>
  s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : `{${k}}`));

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem(KEY); } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restore saved locale after hydration
    if (saved === "zh" || saved === "en") setLocaleState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try { localStorage.setItem(KEY, l); } catch {}
  }, []);

  const value = useMemo(() => ({ locale, t: DICTS[locale], setLocale, fmt }), [locale, setLocale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
