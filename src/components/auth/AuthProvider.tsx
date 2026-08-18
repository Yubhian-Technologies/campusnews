"use client";

/**
 * Centralized authentication provider + useAuth() hook (spec §7).
 *
 * Wraps the Firebase client SDK and the server session-cookie exchange so no
 * component re-implements auth logic. Login flow:
 *   1. signInWithEmailAndPassword (Firebase client)
 *   2. POST the ID token to /api/auth/session — the server enforces the status
 *      gate and mints an httpOnly session cookie
 *   3. On rejection (SUSPENDED/INACTIVE/no profile) sign back out and surface a
 *      friendly message — an authenticated user is NOT necessarily authorized.
 *
 * register() is self-service sign-up: createUserWithEmailAndPassword, then
 * POST /api/auth/register to create the /users/{uid} profile. A college-domain
 * email becomes a Student Contributor gated PENDING_EMAIL_VERIFICATION (sent a
 * verification link, signed back out — session creation itself enforces the
 * gate, promoting to ACTIVE on their first post-verification sign-in). Any
 * other email becomes an ACTIVE, role-less reader signed straight in.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  type User as FirebaseUser,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  onIdTokenChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile as updateFirebaseProfile,
} from "firebase/auth";
import { getClientAuth } from "@/lib/firebase/client";
import { APP_AUTH_ERRORS, friendlyAuthError } from "@/lib/firebase/errors";
import {
  type Permission,
  type RoleId,
  homeRouteForRoles,
  permissionsForRoles,
} from "@/lib/auth/roles";
import {
  clearLocalStoragePrefix,
  writeLocalStorage,
} from "@/lib/useLocalStorage";
import {
  FAVOURITE_COLLEGE_KEY,
  FAVOURITE_LOCATION_KEY,
  LIKED_ARTICLE_PREFIX,
  LIKED_REEL_PREFIX,
} from "@/lib/prefs";
import type { UserProfile } from "@/lib/types";

/** A friendly-message-bearing error thrown by signIn so callers can display it. */
export class AuthError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export interface SignInResult {
  profile: UserProfile;
  home: string;
}

export interface RegisterResult {
  /** True when the email matched a college domain: account is a pending
   *  Student Contributor, not signed in yet — they must verify first. */
  isStudent: boolean;
}

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  profile: UserProfile | null;
  currentUser: UserProfile | null; // alias of profile (spec naming)
  roles: RoleId[];
  permissions: Permission[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  register: (
    displayName: string,
    email: string,
    password: string,
  ) => Promise<RegisterResult>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchProfile(): Promise<UserProfile | null> {
  const res = await fetch("/api/me", { cache: "no-store" });
  if (!res.ok) return null;
  const data = (await res.json()) as { user: UserProfile };
  return data.user;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Track Firebase client auth state so UI reacts to sign-in/out. The server
  // session cookie is the durable source; here we hydrate the profile once the
  // session exists.
  useEffect(() => {
    const auth = getClientAuth();
    let authResolved = false;
    let cookieProfile: UserProfile | null = null;
    let profileResolved = false;

    // The client SDK's own sign-in lives in sessionStorage (per-tab, spec
    // §14), so a new tab / bookmarked link / lost sessionStorage can leave a
    // valid cookie session with no client-side `currentUser` — which breaks
    // anything that talks to Firebase directly from the browser (e.g. Storage
    // uploads, gated on `request.auth`). Once we know both whether the client
    // SDK settled on a user and whether the cookie says we're signed in,
    // bridge the gap via a short-lived custom token instead of asking the
    // user to log in again.
    function maybeBridgeClientAuth() {
      if (!authResolved || !profileResolved) return;
      if (!cookieProfile || getClientAuth().currentUser) return;
      fetch("/api/auth/token", { method: "POST" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { customToken?: string } | null) => {
          if (data?.customToken) return signInWithCustomToken(auth, data.customToken);
        })
        .catch(() => {
          // Non-fatal: anything requiring a live client session will surface
          // its own "please sign in again" error.
        });
    }

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      authResolved = true;
      maybeBridgeClientAuth();
    });
    // Hydrate profile from the existing server session (if any) on mount.
    fetchProfile()
      .then((p) => {
        setProfile(p);
        cookieProfile = p;
      })
      .finally(() => {
        profileResolved = true;
        setLoading(false);
        maybeBridgeClientAuth();
      });
    const unsubToken = onIdTokenChanged(auth, () => {});
    return () => {
      unsubAuth();
      unsubToken();
    };
  }, []);

  const refreshProfile = useCallback(async () => {
    setProfile(await fetchProfile());
  }, []);

  const signIn = useCallback(
    async (email: string, password: string): Promise<SignInResult> => {
      const auth = getClientAuth();
      let cred;
      try {
        cred = await signInWithEmailAndPassword(auth, email, password);
      } catch (error) {
        throw new AuthError(
          friendlyAuthError(error),
          (error as { code?: string }).code ?? "auth/unknown",
        );
      }

      const idToken = await cred.user.getIdToken();

      // Exchange for a session cookie; server enforces the status gate.
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { code?: string };
        const code = data.code ?? APP_AUTH_ERRORS.NO_PROFILE;
        // Still pending verification: resend the link while we still have a
        // live client session for this user, then sign out — a free "resend"
        // on every login attempt made before they've clicked it.
        if (code === APP_AUTH_ERRORS.EMAIL_NOT_VERIFIED) {
          await sendEmailVerification(cred.user).catch(() => {});
        }
        // Do not keep a client session for a user who cannot use the app.
        await fbSignOut(auth).catch(() => {});
        throw new AuthError(friendlyAuthError(code), code);
      }

      const p = await fetchProfile();
      if (!p) {
        await fbSignOut(auth).catch(() => {});
        throw new AuthError(
          friendlyAuthError(APP_AUTH_ERRORS.NO_PROFILE),
          APP_AUTH_ERRORS.NO_PROFILE,
        );
      }
      setProfile(p);
      return { profile: p, home: homeRouteForRoles(p.roleIds) };
    },
    [],
  );

  const register = useCallback(
    async (
      displayName: string,
      email: string,
      password: string,
    ): Promise<RegisterResult> => {
      const auth = getClientAuth();
      let cred;
      try {
        cred = await createUserWithEmailAndPassword(auth, email, password);
      } catch (error) {
        throw new AuthError(
          friendlyAuthError(error),
          (error as { code?: string }).code ?? "auth/unknown",
        );
      }
      await updateFirebaseProfile(cred.user, { displayName }).catch(() => {});

      const idToken = await cred.user.getIdToken();

      let res: Response;
      try {
        res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken, displayName }),
        });
      } catch {
        await fbSignOut(auth).catch(() => {});
        throw new AuthError("Something went wrong. Please try again.", "app/unknown");
      }

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        await fbSignOut(auth).catch(() => {});
        throw new AuthError(
          data.error ?? "Something went wrong. Please try again.",
          "app/register-failed",
        );
      }

      const { isStudent } = (await res.json()) as { isStudent: boolean };

      if (isStudent) {
        // Gated on email verification: send the link and sign back out — they
        // complete sign-in themselves once they've clicked it.
        await sendEmailVerification(cred.user).catch(() => {});
        await fbSignOut(auth).catch(() => {});
        return { isStudent: true };
      }

      // Unaffiliated reader: no verification gate, sign them straight in.
      const sessionRes = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!sessionRes.ok) {
        await fbSignOut(auth).catch(() => {});
        throw new AuthError("Something went wrong. Please try again.", "app/unknown");
      }
      setProfile(await fetchProfile());
      return { isStudent: false };
    },
    [],
  );

  const signOut = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    await fbSignOut(getClientAuth()).catch(() => {});
    setProfile(null);
    // Reset device-local personalization on sign-out so a shared/reused
    // device starts clean instead of carrying this account's favourite
    // location/college and liked articles/reels forward to whoever's next.
    writeLocalStorage(FAVOURITE_LOCATION_KEY, null);
    writeLocalStorage(FAVOURITE_COLLEGE_KEY, null);
    clearLocalStoragePrefix(LIKED_ARTICLE_PREFIX);
    clearLocalStoragePrefix(LIKED_REEL_PREFIX);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      await sendPasswordResetEmail(getClientAuth(), email);
    } catch (error) {
      throw new AuthError(
        friendlyAuthError(error),
        (error as { code?: string }).code ?? "auth/unknown",
      );
    }
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const roles = profile?.roleIds ?? [];
    return {
      firebaseUser,
      profile,
      currentUser: profile,
      roles,
      permissions: permissionsForRoles(roles),
      loading,
      signIn,
      register,
      signOut,
      resetPassword,
      refreshProfile,
    };
  }, [
    firebaseUser,
    profile,
    loading,
    signIn,
    register,
    signOut,
    resetPassword,
    refreshProfile,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>.");
  return ctx;
}
