import React, { createContext, useContext } from 'react';
import { useAppState } from '../hooks/useAppState';
import type { AppStateHook } from '../hooks/useAppState';

const AppContext = createContext<AppStateHook | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const appState = useAppState();
  return <AppContext.Provider value={appState}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
