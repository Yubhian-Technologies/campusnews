/**
 * Firebase client SDK initialization (browser).
 *
 * Uses only the public NEXT_PUBLIC_* config. In-memory persistence is set so
 * tokens are never written to localStorage (spec §14) — server-side session
 * cookies are the durable session mechanism instead.
 */
import { type FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import {
  type Auth,
  browserSessionPersistence,
  connectAuthEmulator,
  getAuth,
  setPersistence,
} from "firebase/auth";
import { type FirebaseStorage, getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseApp: FirebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

let cachedAuth: Auth | null = null;

/** Lazily create the Auth instance; wires the emulator + session persistence once. */
export function getClientAuth(): Auth {
  if (cachedAuth) return cachedAuth;
  const auth = getAuth(firebaseApp);

  // Session-scoped persistence: cleared when the tab closes, never in localStorage.
  void setPersistence(auth, browserSessionPersistence);

  const emulatorHost = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST;
  if (emulatorHost && !("__emulatorConnected" in auth)) {
    connectAuthEmulator(auth, `http://${emulatorHost}`, {
      disableWarnings: true,
    });
    Object.defineProperty(auth, "__emulatorConnected", { value: true });
  }

  cachedAuth = auth;
  return auth;
}

let cachedStorage: FirebaseStorage | null = null;

/** Client Firebase Storage (for reel/video uploads). */
export function getClientStorage(): FirebaseStorage {
  if (!cachedStorage) cachedStorage = getStorage(firebaseApp);
  return cachedStorage;
}
