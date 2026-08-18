import type { RoleId } from "./auth/roles";

/**
 * Shared domain types for CampusNews.
 *
 * Firebase Authentication is the source of truth for identity (uid, email,
 * emailVerified, displayName, photoURL). Everything here describes the
 * application-specific profile stored separately in Firestore at /users/{uid}.
 * Passwords / auth credentials are NEVER represented here.
 */

/** Lifecycle status of a user's application access. */
export type UserStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "SUSPENDED"
  | "PENDING_APPROVAL"
  | "PENDING_EMAIL_VERIFICATION";

/** Statuses that are allowed to use protected application functionality. */
export const ACTIVE_STATUSES: readonly UserStatus[] = ["ACTIVE"];

/**
 * Application profile document stored at /users/{uid}.
 * Timestamps are represented as epoch millis on the client boundary and as
 * Firestore Timestamps at rest; see mapping helpers in lib/firebase/admin.
 */
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber: string | null;
  profileImage: string | null;
  status: UserStatus;
  societyId: string;
  locationId: string | null;
  collegeId: string | null;
  departmentId: string | null;
  roleIds: RoleId[];
  /** Convenience flag mirrored from roleIds; do not use as source of truth. */
  isReporter: boolean;
  createdAt: number | null;
  updatedAt: number | null;
  lastLoginAt: number | null;
}

// Re-export role/permission types from the auth module for convenience.
export type { RoleId, Permission } from "./auth/roles";
