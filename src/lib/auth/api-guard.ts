/**
 * Guards for API route handlers. Returns either the authorized SessionUser or a
 * ready-to-return NextResponse error — so handlers stay flat:
 *
 *   const guard = await requireApiPermission("users:create");
 *   if (guard instanceof NextResponse) return guard;
 *   const { user } = guard;
 */
import "server-only";

import { NextResponse } from "next/server";
import { getCurrentUser, type SessionUser } from "./session";
import { authorize, type ResourceScope } from "./authorize";
import type { Permission } from "./roles";

export interface ApiGuardOk {
  user: SessionUser;
}

export async function requireApiUser(): Promise<ApiGuardOk | NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
  }
  if (user.profile.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "Account is not active." },
      { status: 403 },
    );
  }
  return { user };
}

export async function requireApiPermission(
  permission: Permission,
  resource: ResourceScope = {},
): Promise<ApiGuardOk | NextResponse> {
  const guard = await requireApiUser();
  if (guard instanceof NextResponse) return guard;

  const result = authorize(guard.user.profile, permission, resource);
  if (!result.allowed) {
    return NextResponse.json(
      { error: "Forbidden.", reason: result.reason },
      { status: 403 },
    );
  }
  return guard;
}
