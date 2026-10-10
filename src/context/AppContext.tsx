import React, { createContext, useContext } from 'react';
import { useAppState } from '../hooks/useAppState';
import type { AppStateHook } from '../hooks/useAppState';
import { useAuth } from './AuthContext';

const AppContext = createContext<AppStateHook | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const appState = useAppState(user?.uid);
  return <AppContext.Provider value={appState}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
