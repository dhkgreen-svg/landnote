'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, TranslationDictionary } from './types';
import { ko } from './ko';
import { ja } from './ja';
import { en } from './en';

const dictionaries: Record<Language, TranslationDictionary> = {
  ko,
  ja,
  en,
};

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationDictionary;
  isJapanese: boolean;
  isEnglish: boolean;
  isKorean: boolean;
}

const LanguageContext = createContext<LanguageContextProps>({
  language: 'ko',
  setLanguage: () => {},
  t: ko,
  isJapanese: false,
  isEnglish: false,
  isKorean: true,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ko');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      // 1. URL search param check (?lang=ja or ?lang=en)
      const urlParams = new URLSearchParams(window.location.search);
      const queryLang = urlParams.get('lang');
      if (queryLang === 'ja' || queryLang === 'en' || queryLang === 'ko') {
        setLanguageState(queryLang);
        localStorage.setItem('parkon_language', queryLang);
        setMounted(true);
        return;
      }

      // 2. Local storage check
      const savedLang = localStorage.getItem('parkon_language') as Language;
      if (savedLang && (savedLang === 'ko' || savedLang === 'ja' || savedLang === 'en')) {
        setLanguageState(savedLang);
        setMounted(true);
        return;
      }

      // 3. Browser language auto-detect
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('ja')) {
        setLanguageState('ja');
      } else if (browserLang.startsWith('en')) {
        setLanguageState('en');
      } else {
        setLanguageState('ko');
      }
    } catch {
      setLanguageState('ko');
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('parkon_language', lang);
      document.documentElement.lang = lang;
    } catch {
      // ignore
    }
  };

  const t = dictionaries[language] || ko;

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        isJapanese: language === 'ja',
        isEnglish: language === 'en',
        isKorean: language === 'ko',
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LanguageContext);
}
