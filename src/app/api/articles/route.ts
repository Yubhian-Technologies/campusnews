/**
 * /api/articles
 *   GET  ?view=mine  — the caller's authored articles (default).
 *        ?view=queue — SUBMITTED articles within the caller's review scope.
 *   POST — create a DRAFT. Requires content:create.
 *
 * The author's scope (locationId/collegeId) is taken from the submitted payload
 * but constrained: non-admins can only author within their own location, and a
 * College Head only within their own college.
 */
import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api-guard";
import {
  createArticle,
  listArticlesByAuthor,
  listReviewQueueForUser,
} from "@/lib/firebase/articles";
import { studentDomainError } from "@/lib/firebase/org";
import { createArticleSchema } from "@/lib/validation/article";
import type { UserProfile } from "@/lib/types";

export async function GET(request: Request) {
  const guard = await requireApiPermission("content:read");
  if (guard instanceof NextResponse) return guard;

  const view = new URL(request.url).searchParams.get("view") ?? "mine";
  if (view === "queue") {
    const articles = await listReviewQueueForUser(guard.user.profile);
    return NextResponse.json({ articles });
  }
  const articles = await listArticlesByAuthor(guard.user.uid);
  return NextResponse.json({ articles });
}

/** Constrain author-supplied scope to what the role is allowed to write. */
function resolveScope(
  user: UserProfile,
  input: { locationId: string; collegeId: string | null },
): { ok: true; locationId: string; collegeId: string | null } | { ok: false; error: string } {
  const isAdmin = user.roleIds.includes("society_admin");
  if (isAdmin) return { ok: true, locationId: input.locationId, collegeId: input.collegeId };

  if (!user.locationId) {
    return { ok: false, error: "Your account has no location scope assigned." };
  }
  if (input.locationId !== user.locationId) {
    return { ok: false, error: "You can only publish within your own location." };
  }

  // College Head / Reporter tied to a college must stay within it.
  if (user.collegeId) {
    if (input.collegeId && input.collegeId !== user.collegeId) {
      return { ok: false, error: "You can only publish within your own college." };
    }
    return { ok: true, locationId: user.locationId, collegeId: user.collegeId };
  }

  return { ok: true, locationId: user.locationId, collegeId: input.collegeId };
}

export async function POST(request: Request) {
  const guard = await requireApiPermission("content:create");
  if (guard instanceof NextResponse) return guard;

  // Students must contribute from their college email domain.
  const domErr = await studentDomainError(guard.user.profile);
  if (domErr) return NextResponse.json({ error: domErr }, { status: 403 });

  const parsed = createArticleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const input = parsed.data;

  const scope = resolveScope(guard.user.profile, {
    locationId: input.locationId,
    collegeId: input.collegeId,
  });
  if (!scope.ok) {
    return NextResponse.json({ error: scope.error }, { status: 403 });
  }

  // Student authors go through the two-stage approval chain (college → location).
  const roles = guard.user.profile.roleIds;
  const twoStage =
    roles.includes("student") &&
    !roles.includes("reporter") &&
    !roles.includes("college_head") &&
    !roles.includes("location_news_head") &&
    !roles.includes("society_admin");

  const id = await createArticle({
    title: input.title,
    summary: input.summary,
    body: input.body,
    category: input.category,
    coverImage: input.coverImage,
    authorUid: guard.user.uid,
    authorName: guard.user.profile.displayName,
    twoStage,
    societyId: guard.user.profile.societyId,
    locationId: scope.locationId,
    collegeId: scope.collegeId,
    departmentId: input.departmentId,
  });

  return NextResponse.json({ ok: true, id }, { status: 201 });
}
