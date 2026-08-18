/**
 * /api/reels/[id]
 *   POST { action } — submit / approve / reject / archive (two-stage aware).
 *   DELETE — author may delete own DRAFT; scoped reviewers may delete in-scope.
 * Reuses the article two-stage authorization (reels share the workflow).
 */
import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-guard";
import {
  applyReelAction,
  deleteReel,
  getReelRecord,
} from "@/lib/firebase/reels";
import {
  authorAutoPublishes,
  canApproveStage1,
  canApproveStage2,
  canReviewArticle,
} from "@/lib/content/authorize";
import { ACTION_TRANSITIONS } from "@/lib/content/types";
import { reviewActionSchema } from "@/lib/validation/reel";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const guard = await requireApiUser();
  if (guard instanceof NextResponse) return guard;
  const user = guard.user.profile;

  const reel = await getReelRecord(id);
  if (!reel || reel.societyId !== user.societyId) {
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

  if (!ACTION_TRANSITIONS[action].from.includes(reel.status)) {
    return NextResponse.json(
      { error: `Cannot ${action} a reel that is ${reel.status}.` },
      { status: 409 },
    );
  }

  if (action === "submit") {
    if (reel.authorUid !== user.uid) {
      return NextResponse.json(
        { error: "Only the author can submit this reel." },
        { status: 403 },
      );
    }
    if (authorAutoPublishes(user)) {
      await applyReelAction(id, {
        status: "PUBLISHED",
        note: null,
        setSubmittedAt: true,
        setPublishedAt: true,
      });
    } else {
      await applyReelAction(id, { status: "SUBMITTED", note: null, setSubmittedAt: true });
    }
  } else if (action === "approve") {
    if (reel.status === "SUBMITTED") {
      if (!canApproveStage1(user, reel)) {
        return NextResponse.json({ error: "You are not a reviewer." }, { status: 403 });
      }
      // Single-stage: approval publishes directly (no Location Admin step).
      await applyReelAction(id, {
        status: "PUBLISHED",
        reviewerUid: user.uid,
        reviewerName: user.displayName,
        note: null,
        setPublishedAt: true,
      });
    } else {
      // PENDING_LOCATION is legacy (no longer produced) — kept as a fallback.
      if (!canApproveStage2(user, reel)) {
        return NextResponse.json(
          { error: "Only the Location Head can give final approval." },
          { status: 403 },
        );
      }
      await applyReelAction(id, {
        status: "PUBLISHED",
        reviewerUid: user.uid,
        reviewerName: user.displayName,
        note: null,
        setPublishedAt: true,
      });
    }
  } else if (action === "reject") {
    const allowed =
      reel.status === "SUBMITTED"
        ? canApproveStage1(user, reel)
        : canApproveStage2(user, reel);
    if (!allowed) {
      return NextResponse.json({ error: "You are not a reviewer." }, { status: 403 });
    }
    await applyReelAction(id, {
      status: "REJECTED",
      reviewerUid: user.uid,
      reviewerName: user.displayName,
      note: note ?? null,
    });
  } else {
    if (!canReviewArticle(user, reel)) {
      return NextResponse.json({ error: "You are not a reviewer." }, { status: 403 });
    }
    await applyReelAction(id, {
      status: "ARCHIVED",
      reviewerUid: user.uid,
      reviewerName: user.displayName,
      note: null,
    });
  }

  return NextResponse.json({ ok: true, reel: await getReelRecord(id) });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const guard = await requireApiUser();
  if (guard instanceof NextResponse) return guard;
  const user = guard.user.profile;

  const reel = await getReelRecord(id);
  if (!reel || reel.societyId !== user.societyId) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const isAuthorDraft = reel.authorUid === user.uid && reel.status === "DRAFT";
  if (!isAuthorDraft && !canReviewArticle(user, reel)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  await deleteReel(id);
  return NextResponse.json({ ok: true });
}
