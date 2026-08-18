/**
 * Authorization core.
 *
 * Authentication answers "who are you?"; this module answers "what may you do?".
 * Never assume authenticated == authorized. Every protected action funnels
 * through `can()`, which layers the checks in order:
 *
 *   1. authenticated (a profile exists)
 *   2. status === ACTIVE
 *   3. role grants the required permission
 *   4. society scope matches
 *   5. location scope matches (when the resource is location-scoped)
 *   6. college scope matches (when the resource is college-scoped)
 *   7. ownership (when the resource is owned and permission requires it)
 *
 * These are the same checks the Firestore security rules enforce server-side;
 * frontend usage of `can()` is UX only.
 */

import type { UserProfile } from "@/lib/types";
import { type Permission, permissionsForRoles } from "./roles";

/** Organization scope of a resource being acted upon. */
export interface ResourceScope {
  societyId?: string;
  locationId?: string | null;
  collegeId?: string | null;
  /** uid of the resource owner, for ownership checks. */
  ownerUid?: string;
}

export interface AuthzOptions {
  /** Require the actor to own the resource (ownerUid === actor.uid). */
  requireOwnership?: boolean;
}

export type AuthzReason =
  | "OK"
  | "UNAUTHENTICATED"
  | "INACTIVE_STATUS"
  | "MISSING_PERMISSION"
  | "SOCIETY_SCOPE"
  | "LOCATION_SCOPE"
  | "COLLEGE_SCOPE"
  | "NOT_OWNER";

export interface AuthzResult {
  allowed: boolean;
  reason: AuthzReason;
}

/**
 * Society Admin bypasses location/college scope: they administer the whole
 * society. Ownership and permission checks still apply.
 */
function isSocietyAdmin(user: UserProfile): boolean {
  return user.roleIds.includes("society_admin");
}

export function authorize(
  user: UserProfile | null | undefined,
  permission: Permission,
  resource: ResourceScope = {},
  options: AuthzOptions = {},
): AuthzResult {
  if (!user) return { allowed: false, reason: "UNAUTHENTICATED" };

  if (user.status !== "ACTIVE") {
    return { allowed: false, reason: "INACTIVE_STATUS" };
  }

  const perms = permissionsForRoles(user.roleIds);
  if (!perms.includes(permission)) {
    return { allowed: false, reason: "MISSING_PERMISSION" };
  }

  // Society scope always applies — a user can only ever act within their society.
  if (resource.societyId != null && resource.societyId !== user.societyId) {
    return { allowed: false, reason: "SOCIETY_SCOPE" };
  }

  const admin = isSocietyAdmin(user);

  if (!admin) {
    if (
      resource.locationId != null &&
      resource.locationId !== user.locationId
    ) {
      return { allowed: false, reason: "LOCATION_SCOPE" };
    }
    if (resource.collegeId != null && resource.collegeId !== user.collegeId) {
      return { allowed: false, reason: "COLLEGE_SCOPE" };
    }
  }

  if (options.requireOwnership && resource.ownerUid !== user.uid) {
    return { allowed: false, reason: "NOT_OWNER" };
  }

  return { allowed: true, reason: "OK" };
}

/** Boolean convenience wrapper around {@link authorize}. */
export function can(
  user: UserProfile | null | undefined,
  permission: Permission,
  resource: ResourceScope = {},
  options: AuthzOptions = {},
): boolean {
  return authorize(user, permission, resource, options).allowed;
}
