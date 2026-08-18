/**
 * /api/admin/users/[uid]
 *   PATCH — edit profile / status / roles / scope. Requires users:update.
 *           Status changes additionally require users:manage_status.
 *   POST  — { action: "reset_password" } generate a password reset link.
 *           Requires users:reset_password.
 *
 * All operations are Society-Admin gated, re-verified server-side, and scoped
 * to the admin's own society (spec §9, §11).
 */
import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api-guard";
import { adminAuth } from "@/lib/firebase/admin";
import {
  getUserProfile,
  updateUserProfile,
} from "@/lib/firebase/users";
import { updateUserSchema } from "@/lib/validation/user";
import type { RoleId } from "@/lib/types";

type RouteContext = { params: Promise<{ uid: string }> };

/** Ensure the target user exists and belongs to the admin's society. */
async function loadTargetInSociety(uid: string, societyId: string) {
  const target = await getUserProfile(uid);
  if (!target || target.societyId !== societyId) return null;
  return target;
}

export async function PATCH(request: Request, ctx: RouteContext) {
  const { uid } = await ctx.params;

  const guard = await requireApiPermission("users:update");
  if (guard instanceof NextResponse) return guard;

  const target = await loadTargetInSociety(uid, guard.user.profile.societyId);
  if (!target) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const patch = parsed.data;

  // Changing account status is a distinct, more sensitive permission.
  if (patch.status && patch.status !== target.status) {
    const statusGuard = await requireApiPermission("users:manage_status");
    if (statusGuard instanceof NextResponse) return statusGuard;

    // Mirror the enable/disable into Firebase Auth so a disabled user cannot
    // even authenticate.
    const disabled =
      patch.status === "SUSPENDED" || patch.status === "INACTIVE";
    await adminAuth().updateUser(uid, { disabled });
  }

  await updateUserProfile(uid, {
    displayName: patch.displayName,
    phoneNumber: patch.phoneNumber,
    status: patch.status,
    roleIds: patch.roleIds as RoleId[] | undefined,
    locationId: patch.locationId,
    collegeId: patch.collegeId,
    departmentId: patch.departmentId,
  });

  // Keep the Auth displayName in sync when it changed.
  if (patch.displayName && patch.displayName !== target.displayName) {
    await adminAuth()
      .updateUser(uid, { displayName: patch.displayName })
      .catch(() => {});
  }

  const updated = await getUserProfile(uid);
  return NextResponse.json({ ok: true, user: updated });
}

export async function POST(request: Request, ctx: RouteContext) {
  const { uid } = await ctx.params;

  const body = (await request.json().catch(() => ({}))) as { action?: string };
  if (body.action !== "reset_password") {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  const guard = await requireApiPermission("users:reset_password");
  if (guard instanceof NextResponse) return guard;

  const target = await loadTargetInSociety(uid, guard.user.profile.societyId);
  if (!target) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const resetLink = await adminAuth().generatePasswordResetLink(target.email);
  return NextResponse.json({ ok: true, resetLink });
}
