/**
 * Article-scope authorization.
 *
 * The generic authorize() in lib/auth/authorize.ts treats college scope
 * strictly, but editorial oversight is hierarchical:
 *   - Super Admin    → all content in the society (see exception below)
 *   - Location Admin → all content in their location (any/no college); can
 *                      moderate/delete anything there, but does not approve
 *                      Student submissions
 *   - College Admin   → content in their location AND their college; approves
 *                      Student submissions from their college
 *   - Reporter / Student → only their own authored content
 *
 * Super Admin / Location Admin / College Admin publish their own posts directly
 * (no review). Only Student (and Reporter) submissions go through review —
 * Student specifically requires College Admin approval, single-stage, straight
 * to published (no separate Location Admin step). This is a hard requirement:
 * Super Admin does NOT get a stage-1 approval shortcut for Student content —
 * a student's college admin is the sole reviewer for their submissions (see
 * canApproveStage1). Super Admin retains full moderation (edit/reject/archive/
 * delete) via canReviewArticle, and full review authority over non-Student
 * (single-stage) content.
 *
 * These helpers express that hierarchy for review/edit decisions and for
 * building a reviewer's review-queue query.
 */
import type { UserProfile } from "@/lib/types";
import type { Article } from "./types";

function sameSociety(user: UserProfile, article: Pick<Article, "societyId">) {
  return user.societyId === article.societyId;
}

/** Whether the user may review (approve/reject/archive) the given article. */
export function canReviewArticle(
  user: UserProfile,
  article: Pick<Article, "societyId" | "locationId" | "collegeId">,
): boolean {
  if (user.status !== "ACTIVE" || !sameSociety(user, article)) return false;

  if (user.roleIds.includes("society_admin")) return true;

  if (user.roleIds.includes("location_news_head")) {
    return article.locationId === user.locationId;
  }

  if (user.roleIds.includes("college_head")) {
    return (
      article.locationId === user.locationId &&
      article.collegeId != null &&
      article.collegeId === user.collegeId
    );
  }

  return false;
}

/**
 * Whether the user may edit the article's content. Authors may edit their own
 * work while it's still a DRAFT or was REJECTED; reviewers may edit in-scope
 * content at any stage.
 */
export function canEditArticle(user: UserProfile, article: Article): boolean {
  if (user.status !== "ACTIVE" || !sameSociety(user, article)) return false;

  const isAuthor = article.authorUid === user.uid;
  if (isAuthor && (article.status === "DRAFT" || article.status === "REJECTED")) {
    return true;
  }
  return canReviewArticle(user, article);
}

/**
 * Whether the user may edit a reel's content (title/video/thumbnail). Mirrors
 * canEditArticle exactly — reels share the same review scope via
 * canReviewArticle, which is structurally compatible with ReelRecord's
 * societyId/locationId/collegeId fields.
 */
export function canEditReel(
  user: UserProfile,
  reel: Pick<
    Article,
    "societyId" | "locationId" | "collegeId"
  > & { authorUid: string; status: Article["status"] },
): boolean {
  if (user.status !== "ACTIVE" || !sameSociety(user, reel)) return false;

  const isAuthor = reel.authorUid === user.uid;
  if (isAuthor && (reel.status === "DRAFT" || reel.status === "REJECTED")) {
    return true;
  }
  return canReviewArticle(user, reel);
}

export interface ArticleQueryScope {
  /** society_admin sees the whole society; others are location-restricted. */
  societyId: string;
  locationId?: string;
  /** college_head is further restricted to their college. */
  collegeId?: string;
  /** True when the user has no review authority at all. */
  none?: boolean;
}

/** The Firestore scope for a reviewer's review queue. */
export function reviewQueueScope(user: UserProfile): ArticleQueryScope {
  if (user.roleIds.includes("society_admin")) {
    return { societyId: user.societyId };
  }
  if (user.roleIds.includes("location_news_head") && user.locationId) {
    return { societyId: user.societyId, locationId: user.locationId };
  }
  if (
    user.roleIds.includes("college_head") &&
    user.locationId &&
    user.collegeId
  ) {
    return {
      societyId: user.societyId,
      locationId: user.locationId,
      collegeId: user.collegeId,
    };
  }
  return { societyId: user.societyId, none: true };
}

/** Whether the user holds any review authority (for showing the Review tab). */
export function canReview(user: UserProfile): boolean {
  return (
    user.roleIds.includes("society_admin") ||
    user.roleIds.includes("location_news_head") ||
    user.roleIds.includes("college_head")
  );
}

/**
 * Stage-1 reviewer: approves (or rejects) a SUBMITTED article. For single-stage
 * content, Super Admin or any in-scope reviewer qualifies. For a two-stage
 * (student) article, ONLY the College Head of that student's own college
 * qualifies — deliberately no Super Admin shortcut here, even though Super
 * Admin can review everything else. A student's submission is meant to be
 * gatekept solely by their college admin, not bypassable by a higher role.
 */
export function canApproveStage1(
  user: UserProfile,
  article: Pick<Article, "societyId" | "locationId" | "collegeId" | "twoStage">,
): boolean {
  if (user.status !== "ACTIVE" || !sameSociety(user, article)) return false;
  if (!article.twoStage) {
    if (user.roleIds.includes("society_admin")) return true;
    return canReviewArticle(user, article as Article);
  }
  // two-stage stage 1 = College Head of the article's college, exclusively.
  return (
    user.roleIds.includes("college_head") &&
    article.locationId === user.locationId &&
    article.collegeId != null &&
    article.collegeId === user.collegeId
  );
}

/**
 * Stage-2 (final) reviewer: publishes a PENDING_LOCATION article — the Location
 * News Head for that location, or Admin. Kept as a fallback for any legacy
 * two-stage records; new approvals no longer produce PENDING_LOCATION (see
 * authorAutoPublishes / the single-stage approval flow).
 */
export function canApproveStage2(
  user: UserProfile,
  article: Pick<Article, "societyId" | "locationId">,
): boolean {
  if (user.status !== "ACTIVE" || !sameSociety(user, article)) return false;
  if (user.roleIds.includes("society_admin")) return true;
  return (
    user.roleIds.includes("location_news_head") &&
    article.locationId === user.locationId
  );
}

/**
 * Society Admin, Location Admin, and College Admin publish their own content
 * directly — no review step. Only Reporter and Student submissions go through
 * review (Student specifically requires College Admin approval; see
 * canApproveStage1, which already scopes two-stage content to the college head).
 */
export function authorAutoPublishes(user: Pick<UserProfile, "roleIds">): boolean {
  return user.roleIds.some((r) =>
    ["society_admin", "location_news_head", "college_head"].includes(r),
  );
}
