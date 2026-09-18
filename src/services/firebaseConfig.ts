// Firebase configuration for Finance Family OS
// To set up: Create a Firebase project at https://console.firebase.google.com
// 1. Enable Authentication → Google Sign-in
// 2. Create Firestore Database (production mode)
// 3. Copy config values to .env file

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';

const fallbackApiKey = atob('QUl6YVN5RDdHSGN6ZktzSm5vNWY1UUNZdlo1bjY5cHphMVlzaEx3');
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || fallbackApiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'finance-family-os.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'finance-family-os',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'finance-family-os.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1092131304650',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1092131304650:web:44c5027874af53f153b033',
};

// Only initialize Firebase if config is provided
const hasFirebaseConfig = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

let app: ReturnType<typeof initializeApp> | null = null;
let auth: ReturnType<typeof getAuth> | null = null;
let db: ReturnType<typeof getFirestore> | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (hasFirebaseConfig) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();

  // Enable offline persistence for Firestore (multi-tab support)
  enableMultiTabIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time
      console.warn('[Firebase] Offline persistence failed: Multiple tabs open.');
    } else if (err.code === 'unimplemented') {
      // The current browser does not support all features required for persistence
      console.warn('[Firebase] Offline persistence not supported by this browser.');
    }
  });
}

export { app, auth, db, googleProvider, hasFirebaseConfig };
