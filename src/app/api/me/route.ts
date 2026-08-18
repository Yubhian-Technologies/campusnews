/**
 * /api/me
 *   GET   — the current user's profile (or 401).
 *   PATCH — self-service update of displayName / phoneNumber only. Role, status,
 *           and scope are NOT editable here (spec §15) — only admins change those.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/auth/api-guard";
import { updateUserProfile, getUserProfile } from "@/lib/firebase/users";
import { adminAuth } from "@/lib/firebase/admin";

export async function GET() {
  const guard = await requireApiUser();
  if (guard instanceof NextResponse) return guard;
  return NextResponse.json({ user: guard.user.profile });
}

const selfUpdateSchema = z.object({
  displayName: z.string().trim().min(2).optional(),
  phoneNumber: z
    .string()
    .trim()
    .nullish()
    .transform((v) => (v ? v : null)),
});

export async function PATCH(request: Request) {
  const guard = await requireApiUser();
  if (guard instanceof NextResponse) return guard;

  const parsed = selfUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed." }, { status: 400 });
  }

  await updateUserProfile(guard.user.uid, parsed.data);
  if (parsed.data.displayName) {
    await adminAuth()
      .updateUser(guard.user.uid, { displayName: parsed.data.displayName })
      .catch(() => {});
  }

  const user = await getUserProfile(guard.user.uid);
  return NextResponse.json({ ok: true, user });
}
