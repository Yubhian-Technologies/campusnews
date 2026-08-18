/**
 * Roles, permissions, and landing routes for CampusNews (V1).
 *
 * V1 derives permissions from roles via a static map. This keeps authorization
 * modular: a Firestore-backed permission system can later replace this map
 * without changing any call sites that consume `permissionsForRoles()`.
 */

export const ROLE_IDS = [
  "society_admin",
  "location_news_head",
  "college_head",
  "reporter",
  "student",
] as const;

export type RoleId = (typeof ROLE_IDS)[number];

export function isRoleId(value: unknown): value is RoleId {
  return typeof value === "string" && (ROLE_IDS as readonly string[]).includes(value);
}

/** Human-readable role labels for UI. */
export const ROLE_LABELS: Record<RoleId, string> = {
  society_admin: "Super Admin",
  location_news_head: "Location Admin",
  college_head: "College Admin",
  reporter: "Reporter",
  student: "Student Contributor",
};

/**
 * Landing route each role is redirected to after login. Student Contributors
 * are readers first — their home is the public reader app, not a staff-style
 * dashboard; they still reach their drafts/submissions via the "+" contribute
 * flow, and /student/dashboard itself remains reachable directly.
 */
export const ROLE_HOME: Record<RoleId, string> = {
  society_admin: "/admin",
  location_news_head: "/news-head/dashboard",
  college_head: "/college-head/dashboard",
  reporter: "/reporter/dashboard",
  student: "/news",
};

/**
 * Granular permissions. Kept as string literals so the set can grow without
 * schema migrations. Group by resource:action.
 */
export const PERMISSIONS = [
  "users:read",
  "users:create",
  "users:update",
  "users:manage_status",
  "users:reset_password",
  "content:read",
  "content:create",
  "content:update",
  "content:submit",
  "content:review",
  "content:publish",
  "content:delete",
  "org:manage_locations",
  "org:manage_colleges",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/** Static role → permissions map (V1 authorization source). */
export const ROLE_PERMISSIONS: Record<RoleId, Permission[]> = {
  society_admin: [
    "users:read",
    "users:create",
    "users:update",
    "users:manage_status",
    "users:reset_password",
    "content:read",
    "content:create",
    "content:update",
    "content:submit",
    "content:review",
    "content:publish",
    "content:delete",
    "org:manage_locations",
    "org:manage_colleges",
  ],
  location_news_head: [
    "users:read",
    "content:read",
    "content:create",
    "content:update",
    "content:submit",
    "content:review",
    "content:publish",
    "content:delete",
    "org:manage_colleges",
  ],
  college_head: [
    "users:read",
    "content:read",
    "content:create",
    "content:update",
    "content:submit",
    "content:review",
    "content:publish",
    "content:delete",
  ],
  reporter: [
    "content:read",
    "content:create",
    "content:update",
    "content:submit",
  ],
  student: ["content:read", "content:create", "content:submit"],
};

/** Flattened union of permissions granted by the given roles. */
export function permissionsForRoles(roleIds: RoleId[]): Permission[] {
  const set = new Set<Permission>();
  for (const roleId of roleIds) {
    for (const perm of ROLE_PERMISSIONS[roleId] ?? []) set.add(perm);
  }
  return [...set];
}

/**
 * Resolve the best landing route for a user's roles. Order of ROLE_IDS is the
 * privilege order, so we pick the highest-privilege role's home.
 */
export function homeRouteForRoles(roleIds: RoleId[]): string {
  for (const roleId of ROLE_IDS) {
    if (roleIds.includes(roleId)) return ROLE_HOME[roleId];
  }
  return "/";
}
