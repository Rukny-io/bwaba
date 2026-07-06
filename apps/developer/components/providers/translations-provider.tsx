'use client';

import { createContext, useContext, ReactNode } from 'react';

// We import the type of the dictionary to get intellisense
type Dictionary = typeof import('@/dictionaries/en.json');

const TranslationsContext = createContext<Dictionary | null>(null);

export function TranslationsProvider({
  children,
  dictionary,
}: {
  children: ReactNode;
  dictionary: Dictionary;
}) {
  return (
    <TranslationsContext.Provider value={dictionary}>
      {children}
    </TranslationsContext.Provider>
  );
}

export function useTranslations() {
  const context = useContext(TranslationsContext);
  if (!context) {
    throw new Error('useTranslations must be used within a TranslationsProvider');
  }
  return context;
}
