import React, { createContext, useContext, useState } from 'react';
import en from './locales/en.json';
import pt from './locales/pt.json';

const translations = { en, pt };

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'en');

  const t = (key) => {
    const keys = key.split('.');
    return keys.reduce((obj, k) => (obj && obj[k] ? obj[k] : key), translations[language]);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
