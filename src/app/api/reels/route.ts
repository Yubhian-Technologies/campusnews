/**
 * /api/reels
 *   GET  ?view=mine|queue — the caller's reels, or their review queue.
 *   POST — create a DRAFT reel (video already uploaded to Storage). Non-admins
 *          are pinned to their own location/college; student authors are flagged
 *          twoStage so they go College Head → Location Head.
 */
import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api-guard";
import {
  createReel,
  listReelsByAuthor,
  listReelReviewQueueForUser,
} from "@/lib/firebase/reels";
import { createReelSchema } from "@/lib/validation/reel";
import { studentDomainError } from "@/lib/firebase/org";
import type { UserProfile } from "@/lib/types";

export async function GET(request: Request) {
  const guard = await requireApiPermission("content:read");
  if (guard instanceof NextResponse) return guard;

  const view = new URL(request.url).searchParams.get("view") ?? "mine";
  if (view === "queue") {
    return NextResponse.json({
      reels: await listReelReviewQueueForUser(guard.user.profile),
    });
  }
  return NextResponse.json({ reels: await listReelsByAuthor(guard.user.uid) });
}

function resolveScope(
  user: UserProfile,
  input: { locationId: string | null; collegeId: string | null },
):
  | { ok: true; locationId: string; collegeId: string | null }
  | { ok: false; error: string } {
  const isAdmin = user.roleIds.includes("society_admin");
  if (isAdmin) {
    if (!input.locationId)
      return { ok: false, error: "A location is required." };
    return { ok: true, locationId: input.locationId, collegeId: input.collegeId };
  }
  if (!user.locationId) {
    return { ok: false, error: "Your account has no location scope assigned." };
  }
  return {
    ok: true,
    locationId: user.locationId,
    collegeId: user.collegeId ?? input.collegeId,
  };
}

export async function POST(request: Request) {
  const guard = await requireApiPermission("content:create");
  if (guard instanceof NextResponse) return guard;

  const domErr = await studentDomainError(guard.user.profile);
  if (domErr) return NextResponse.json({ error: domErr }, { status: 403 });

  const parsed = createReelSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const input = parsed.data;
  const profile = guard.user.profile;

  const scope = resolveScope(profile, {
    locationId: input.locationId,
    collegeId: input.collegeId,
  });
  if (!scope.ok) return NextResponse.json({ error: scope.error }, { status: 400 });

  const roles = profile.roleIds;
  const twoStage =
    roles.includes("student") &&
    !roles.includes("reporter") &&
    !roles.includes("college_head") &&
    !roles.includes("location_news_head") &&
    !roles.includes("society_admin");

  const id = await createReel({
    title: input.title,
    videoUrl: input.videoUrl,
    thumbnail: input.thumbnail,
    twoStage,
    authorUid: guard.user.uid,
    authorName: profile.displayName,
    societyId: profile.societyId,
    locationId: scope.locationId,
    collegeId: scope.collegeId,
    departmentId: input.departmentId,
  });

  return NextResponse.json({ ok: true, id }, { status: 201 });
}
