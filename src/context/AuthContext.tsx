import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { auth, googleProvider, hasFirebaseConfig } from '../services/firebaseConfig';

interface AuthContextValue {
  /** Currently signed-in Firebase user, or null */
  user: User | null;
  /** True while checking initial auth state */
  loading: boolean;
  /** True if Firebase is configured and available */
  isFirebaseEnabled: boolean;
  /** Sign in with Google popup */
  signInWithGoogle: () => Promise<void>;
  /** Sign out */
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(hasFirebaseConfig); // Only loading if Firebase is configured

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!auth || !googleProvider) return;
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: unknown) {
      console.error('[Auth] Google sign-in failed:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    if (!auth) return;
    try {
      await signOut(auth);
    } catch (error: unknown) {
      console.error('[Auth] Sign-out failed:', error);
      throw error;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isFirebaseEnabled: hasFirebaseConfig,
        signInWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
