/**
 * /api/admin/users
 *   GET  — list users in the admin's society (filterable). Requires users:read.
 *   POST — create an internal user. Requires users:create (Society Admin).
 *
 * User creation is a sensitive server-only operation (spec §11): it creates the
 * Firebase Auth account AND the /users/{uid} profile, then generates a
 * password-setup link. Passwords are never stored in Firestore.
 */
import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { requireApiPermission } from "@/lib/auth/api-guard";
import { adminAuth } from "@/lib/firebase/admin";
import {
  createUserProfile,
  listUsers,
  type ListUsersFilter,
} from "@/lib/firebase/users";
import { getErrorCode } from "@/lib/firebase/errors";
import { createUserSchema } from "@/lib/validation/user";
import type { RoleId, UserStatus } from "@/lib/types";

export async function GET(request: Request) {
  const guard = await requireApiPermission("users:read");
  if (guard instanceof NextResponse) return guard;

  const { searchParams } = new URL(request.url);
  const filter: ListUsersFilter = {};
  const status = searchParams.get("status");
  const roleId = searchParams.get("roleId");
  const locationId = searchParams.get("locationId");
  const collegeId = searchParams.get("collegeId");
  if (status) filter.status = status as UserStatus;
  if (roleId) filter.roleId = roleId as RoleId;
  if (locationId) filter.locationId = locationId;
  if (collegeId) filter.collegeId = collegeId;

  const users = await listUsers(guard.user.profile.societyId, filter);
  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const guard = await requireApiPermission("users:create");
  if (guard instanceof NextResponse) return guard;

  const body = await request.json().catch(() => null);
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const input = parsed.data;
  const societyId = guard.user.profile.societyId;

  // Create the Firebase Auth account with a random throwaway password; the user
  // sets their own via the password-setup link below.
  let uid: string;
  try {
    const authUser = await adminAuth().createUser({
      email: input.email,
      displayName: input.displayName,
      emailVerified: false,
      password: randomBytes(24).toString("base64url"),
    });
    uid = authUser.uid;
  } catch (error) {
    if (getErrorCode(error) === "auth/email-already-exists") {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }
    throw error;
  }

  try {
    await createUserProfile({
      uid,
      email: input.email,
      displayName: input.displayName,
      phoneNumber: input.phoneNumber ?? null,
      status: "PENDING_EMAIL_VERIFICATION",
      societyId,
      locationId: input.locationId ?? null,
      collegeId: input.collegeId ?? null,
      departmentId: input.departmentId ?? null,
      roleIds: input.roleIds as RoleId[],
    });
  } catch (error) {
    // Roll back the orphaned auth user so create stays all-or-nothing.
    await adminAuth().deleteUser(uid).catch(() => {});
    throw error;
  }

  // Password-setup link the admin can forward. In production, email this via
  // your mailer instead of returning it. Non-fatal if link generation fails.
  let setupLink: string | null = null;
  try {
    setupLink = await adminAuth().generatePasswordResetLink(input.email);
  } catch {
    setupLink = null;
  }

  return NextResponse.json(
    { ok: true, uid, setupLink },
    { status: 201 },
  );
}
