"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  translations,
  type Language,
  type Translation,
} from "@/shared/lib/translations";

const STORAGE_KEY = "priemman-lang";

type LanguageContextValue = {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Translation;
};

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  setLang: () => {},
  t: translations.en,
});

function getStoredLanguage(): Language {
  // localStorage hanya pernah diisi "en"/"id" lewat setLang di bawah; nilai lain
  // (termasuk yang dimanipulasi manual di devtools) jatuh balik ke default aman "en".
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "id" ? "id" : "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // 1. Render pertama selalu memakai bahasa server agar HTML server dan client identik.
  const [lang, setCurrentLang] = useState<Language>("en");

  // 2. Preferensi browser baru dibaca setelah hydration selesai; perubahan dari tab
  // lain juga tetap disinkronkan melalui event storage.
  useEffect(() => {
    const syncStoredLanguage = () => setCurrentLang(getStoredLanguage());
    syncStoredLanguage();
    window.addEventListener("storage", syncStoredLanguage);
    return () => window.removeEventListener("storage", syncStoredLanguage);
  }, []);

  const setLang = useCallback((next: Language) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    // 3. Event storage tidak berjalan pada tab yang sama, sehingga state diperbarui langsung.
    setCurrentLang(next);
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function useT(): Translation {
  return useContext(LanguageContext).t;
}
