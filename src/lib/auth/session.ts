/**
 * Server-side session helpers.
 *
 * These verify the httpOnly Firebase session cookie with the Admin SDK and load
 * the Firestore profile — the authoritative "who are you AND are you allowed"
 * check used by server components, protected layouts, and route handlers.
 */
import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME } from "@/lib/config";
import { adminAuth } from "@/lib/firebase/admin";
import { getUserProfile } from "@/lib/firebase/users";
import { authorize, type ResourceScope } from "./authorize";
import { homeRouteForRoles, type Permission, type RoleId } from "./roles";
import type { UserProfile } from "@/lib/types";

export interface SessionUser {
  uid: string;
  emailVerified: boolean;
  profile: UserProfile;
}

/**
 * Resolve the current user from the session cookie, or null if unauthenticated,
 * the cookie is invalid/revoked, or the profile is missing. Does not redirect.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const cookie = store.get(SESSION_COOKIE_NAME)?.value;
  if (!cookie) return null;

  let decoded;
  try {
    // checkRevoked=true so disabled/revoked sessions are rejected server-side.
    decoded = await adminAuth().verifySessionCookie(cookie, true);
  } catch {
    return null;
  }

  const profile = await getUserProfile(decoded.uid);
  if (!profile) return null;

  return {
    uid: decoded.uid,
    emailVerified: Boolean(decoded.email_verified),
    profile,
  };
}

/**
 * Require an authenticated + ACTIVE user. Redirects to /login (preserving the
 * intended path) when unauthenticated, or to /login?reason=inactive when the
 * account is not ACTIVE. Returns the SessionUser otherwise.
 */
export async function requireUser(nextPath?: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    const suffix = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
    redirect(`/login${suffix}`);
  }
  if (user.profile.status !== "ACTIVE") {
    redirect(`/login?reason=inactive`);
  }
  return user;
}

/**
 * Require the user to hold at least one of the allowed roles. Redirects
 * unauthenticated users to /login and authenticated-but-unauthorized users to
 * their own role home (never a hard 403 dead-end).
 */
export async function requireRole(
  allowed: RoleId[],
  nextPath?: string,
): Promise<SessionUser> {
  const user = await requireUser(nextPath);
  const has = user.profile.roleIds.some((r) => allowed.includes(r));
  if (!has) {
    redirect(homeRouteForRoles(user.profile.roleIds));
  }
  return user;
}

/**
 * Require a specific permission (+ optional resource scope). Mirrors the
 * Firestore rules. Redirects unauthorized users to their role home.
 */
export async function requirePermission(
  permission: Permission,
  resource: ResourceScope = {},
  nextPath?: string,
): Promise<SessionUser> {
  const user = await requireUser(nextPath);
  const result = authorize(user.profile, permission, resource);
  if (!result.allowed) {
    redirect(homeRouteForRoles(user.profile.roleIds));
  }
  return user;
}
