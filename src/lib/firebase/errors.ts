/**
 * Maps raw Firebase Auth error codes to friendly, user-safe messages.
 * Raw Firebase error strings are never shown to end users (spec §20).
 */

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "Email or password is incorrect.",
  "auth/invalid-email": "Email or password is incorrect.",
  "auth/user-not-found": "Email or password is incorrect.",
  "auth/wrong-password": "Email or password is incorrect.",
  "auth/user-disabled":
    "Your account has been disabled. Please contact the administrator.",
  "auth/too-many-requests":
    "Too many login attempts. Please try again later.",
  "auth/network-request-failed":
    "Network error. Please check your connection and try again.",
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/weak-password": "Please choose a stronger password.",
  "auth/missing-password": "Please enter your password.",
};

/** Sentinel codes we raise ourselves (not from Firebase) for status gating. */
export const APP_AUTH_ERRORS = {
  EMAIL_NOT_VERIFIED: "app/email-not-verified",
  ACCOUNT_INACTIVE: "app/account-inactive",
  ACCOUNT_SUSPENDED: "app/account-suspended",
  NO_PROFILE: "app/no-profile",
} as const;

const APP_ERROR_MESSAGES: Record<string, string> = {
  [APP_AUTH_ERRORS.EMAIL_NOT_VERIFIED]:
    "Please verify your email before continuing.",
  [APP_AUTH_ERRORS.ACCOUNT_INACTIVE]:
    "Your account is inactive. Please contact the administrator.",
  [APP_AUTH_ERRORS.ACCOUNT_SUSPENDED]:
    "Your account has been suspended. Please contact the administrator.",
  [APP_AUTH_ERRORS.NO_PROFILE]:
    "We couldn't find your account profile. Please contact the administrator.",
};

const FALLBACK = "Something went wrong. Please try again.";

/** Extract a Firebase-style error code from an unknown thrown value. */
export function getErrorCode(error: unknown): string | null {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code: unknown }).code;
    if (typeof code === "string") return code;
  }
  return null;
}

/** Convert any thrown auth error into a friendly, user-safe message. */
export function friendlyAuthError(error: unknown): string {
  const code = getErrorCode(error);
  if (!code) {
    if (typeof error === "string" && APP_ERROR_MESSAGES[error]) {
      return APP_ERROR_MESSAGES[error];
    }
    return FALLBACK;
  }
  return APP_ERROR_MESSAGES[code] ?? AUTH_ERROR_MESSAGES[code] ?? FALLBACK;
}
