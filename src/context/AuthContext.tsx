import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
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
  /** Sign in with Google popup or redirect */
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

    // Process redirect result if returning from Google redirect on mobile/PWA
    getRedirectResult(auth)
      .then((res) => {
        if (res?.user) {
          setUser(res.user);
        }
      })
      .catch((err) => {
        console.warn('[Auth] getRedirectResult note:', err?.message);
      });

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
    } catch (error: any) {
      console.warn('[Auth] Google popup failed, trying redirect fallback:', error);
      // Fallback to redirect if popup was blocked or unsupported (especially in mobile PWA)
      if (
        error?.code === 'auth/popup-blocked' ||
        error?.code === 'auth/popup-closed-by-user' ||
        error?.code === 'auth/cancelled-popup-request' ||
        typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      ) {
        await signInWithRedirect(auth, googleProvider);
        return;
      }
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
