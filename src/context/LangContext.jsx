import { createContext, useContext, useState } from 'react';
import { en } from '../i18n/en';
import { hi } from '../i18n/hi';

const LANGS = { en, hi };
const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');

  function toggleLang() {
    const next = lang === 'en' ? 'hi' : 'en';
    setLang(next);
    localStorage.setItem('lang', next);
  }

  const t = (key) => LANGS[lang][key] || LANGS.en[key] || key;

  return (
    <LangContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
