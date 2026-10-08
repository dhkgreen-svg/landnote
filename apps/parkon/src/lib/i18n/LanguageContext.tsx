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
      // 1. URL search param check (?lang=ja or ?lang=en or ?lang=ko)
      const urlParams = new URLSearchParams(window.location.search);
      const queryLang = urlParams.get('lang');
      if (queryLang === 'ja' || queryLang === 'en' || queryLang === 'ko') {
        setLanguageState(queryLang);
        localStorage.setItem('parky_lang', queryLang);
        localStorage.setItem('parkon_language', queryLang);
        setMounted(true);
        return;
      }

      // 2. Local storage check (parky_lang prioritized, parkon_language fallback)
      const savedLang = (localStorage.getItem('parky_lang') || localStorage.getItem('parkon_language')) as Language;
      if (savedLang && (savedLang === 'ko' || savedLang === 'ja' || savedLang === 'en')) {
        setLanguageState(savedLang);
        setMounted(true);
        return;
      }

      // 3. Browser language auto-detect (ko -> ko, ja -> ja, all others -> en)
      const browserLang = (navigator.language || '').toLowerCase();
      if (browserLang.startsWith('ko')) {
        setLanguageState('ko');
      } else if (browserLang.startsWith('ja')) {
        setLanguageState('ja');
      } else {
        // 글로벌 사용자 (미국, 유럽, 동남아 등) 기본 언어: 영어(EN)
        setLanguageState('en');
      }
    } catch {
      setLanguageState('ko');
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      if (language === 'ja') {
        document.title = 'パークゴルフ オールインワン (ParkGolf All-in-One) | 日本全国公認コース・リアルタイム天気・スマートスコア';
      } else if (language === 'en') {
        document.title = 'ParkGolf All-in-One - Korea & Japan Official Portal';
      } else {
        document.title = '파크골프 올인원 (ParkGolf All-in-One) | 전국 400여 개 파크골프장 실시간 날씨·코스·스마트스코어';
      }
    }
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('parky_lang', lang);
      localStorage.setItem('parkon_language', lang);
      document.documentElement.lang = lang;
      window.dispatchEvent(new CustomEvent('parky_lang_changed', { detail: { language: lang } }));
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
