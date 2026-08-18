/**
 * /api/articles/[id]
 *   GET    — fetch one (author or in-scope reviewer only).
 *   PATCH  — edit content. Requires content:update + canEditArticle.
 *   POST   — { action: submit|approve|reject|archive } workflow transition.
 *   DELETE — author may delete own DRAFT; reviewers may delete in-scope.
 *
 * Every transition re-verifies BOTH the actor's eligibility (author vs scoped
 * reviewer) and that the current status permits the action (ACTION_TRANSITIONS).
 */
import { NextResponse } from "next/server";
import { requireApiPermission, requireApiUser } from "@/lib/auth/api-guard";
import {
  applyArticleAction,
  deleteArticle,
  getArticle,
  updateArticle,
} from "@/lib/firebase/articles";
import {
  authorAutoPublishes,
  canApproveStage1,
  canApproveStage2,
  canEditArticle,
  canReviewArticle,
} from "@/lib/content/authorize";
import { ACTION_TRANSITIONS } from "@/lib/content/types";
import {
  reviewActionSchema,
  updateArticleSchema,
} from "@/lib/validation/article";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const guard = await requireApiUser();
  if (guard instanceof NextResponse) return guard;

  const article = await getArticle(id);
  if (!article || article.societyId !== guard.user.profile.societyId) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  const isAuthor = article.authorUid === guard.user.uid;
  if (!isAuthor && !canReviewArticle(guard.user.profile, article)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  return NextResponse.json({ article });
}

export async function PATCH(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const guard = await requireApiPermission("content:update");
  if (guard instanceof NextResponse) return guard;

  const article = await getArticle(id);
  if (!article || article.societyId !== guard.user.profile.societyId) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  if (!canEditArticle(guard.user.profile, article)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const parsed = updateArticleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Non-admins cannot move an article outside their own location/college.
  const p = parsed.data;
  const isAdmin = guard.user.profile.roleIds.includes("society_admin");
  if (!isAdmin) {
    if (p.locationId && p.locationId !== guard.user.profile.locationId) {
      return NextResponse.json(
        { error: "You cannot move content to another location." },
        { status: 403 },
      );
    }
    if (
      guard.user.profile.collegeId &&
      p.collegeId &&
      p.collegeId !== guard.user.profile.collegeId
    ) {
      return NextResponse.json(
        { error: "You cannot move content to another college." },
        { status: 403 },
      );
    }
  }

  await updateArticle(id, p);
  const updated = await getArticle(id);
  return NextResponse.json({ ok: true, article: updated });
}

export async function POST(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const guard = await requireApiUser();
  if (guard instanceof NextResponse) return guard;
  const user = guard.user.profile;

  const article = await getArticle(id);
  if (!article || article.societyId !== user.societyId) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const parsed = reviewActionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { action, note } = parsed.data;

  // Status must permit this action.
  const transition = ACTION_TRANSITIONS[action];
  if (!transition.from.includes(article.status)) {
    return NextResponse.json(
      { error: `Cannot ${action} an article that is ${article.status}.` },
      { status: 409 },
    );
  }

  // Actor eligibility: author submits; reviewers approve/reject/archive.
  if (action === "submit") {
    if (article.authorUid !== user.uid) {
      return NextResponse.json(
        { error: "Only the author can submit this article." },
        { status: 403 },
      );
    }
    if (!user.roleIds.some((r) => ["reporter", "student", "college_head", "location_news_head", "society_admin"].includes(r))) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }
    // Super Admin / Location Admin / College Admin publish their own posts
    // directly — no review step. Only Reporter/Student go to SUBMITTED.
    if (authorAutoPublishes(user)) {
      await applyArticleAction(id, {
        status: "PUBLISHED",
        note: null,
        setSubmittedAt: true,
        setPublishedAt: true,
      });
    } else {
      await applyArticleAction(id, {
        status: transition.to,
        note: null,
        setSubmittedAt: true,
      });
    }
  } else if (action === "approve") {
    if (article.status === "SUBMITTED") {
      if (!canApproveStage1(user, article)) {
        return NextResponse.json(
          { error: "You are not a reviewer for this article." },
          { status: 403 },
        );
      }
      // Single-stage: approval publishes directly (no Location Admin step).
      await applyArticleAction(id, {
        status: "PUBLISHED",
        reviewerUid: user.uid,
        reviewerName: user.displayName,
        note: null,
        setPublishedAt: true,
      });
    } else {
      // PENDING_LOCATION is legacy (no longer produced) — kept as a fallback so
      // any pre-existing record can still be resolved by a Location Admin.
      if (!canApproveStage2(user, article)) {
        return NextResponse.json(
          { error: "Only the Location Head can give final approval." },
          { status: 403 },
        );
      }
      await applyArticleAction(id, {
        status: "PUBLISHED",
        reviewerUid: user.uid,
        reviewerName: user.displayName,
        note: null,
        setPublishedAt: true,
      });
    }
  } else if (action === "reject") {
    const allowed =
      article.status === "SUBMITTED"
        ? canApproveStage1(user, article)
        : canApproveStage2(user, article);
    if (!allowed) {
      return NextResponse.json(
        { error: "You are not a reviewer for this article." },
        { status: 403 },
      );
    }
    await applyArticleAction(id, {
      status: "REJECTED",
      reviewerUid: user.uid,
      reviewerName: user.displayName,
      note: note ?? null,
    });
  } else {
    // archive
    if (!canReviewArticle(user, article)) {
      return NextResponse.json(
        { error: "You are not a reviewer for this article." },
        { status: 403 },
      );
    }
    await applyArticleAction(id, {
      status: "ARCHIVED",
      reviewerUid: user.uid,
      reviewerName: user.displayName,
      note: null,
    });
  }

  const updated = await getArticle(id);
  return NextResponse.json({ ok: true, article: updated });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const guard = await requireApiUser();
  if (guard instanceof NextResponse) return guard;
  const user = guard.user.profile;

  const article = await getArticle(id);
  if (!article || article.societyId !== user.societyId) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const isAuthorDraft = article.authorUid === user.uid && article.status === "DRAFT";
  const isScopedDeleter =
    user.roleIds.includes("society_admin") || canReviewArticle(user, article);
  if (!isAuthorDraft && !isScopedDeleter) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  await deleteArticle(id);
  return NextResponse.json({ ok: true });
}
