/** Shared, non-secret runtime configuration. Safe to import anywhere. */

export const SESSION_COOKIE_NAME =
  process.env.SESSION_COOKIE_NAME ?? "campusnews_session";

/** Session cookie lifetime: 5 days (max allowed by Firebase session cookies is 14). */
export const SESSION_COOKIE_MAX_AGE_MS = 60 * 60 * 24 * 5 * 1000;

/** The single society this V1 deployment serves. */
export const DEFAULT_SOCIETY_ID = process.env.NEXT_PUBLIC_SOCIETY_ID ?? "sves";
