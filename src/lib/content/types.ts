/**
 * Article domain types for the CampusNews content layer.
 *
 * Editorial workflow: DRAFT → SUBMITTED → PUBLISHED | REJECTED → (resubmit) →
 * PUBLISHED → ARCHIVED. Transitions are enforced server-side; see
 * ALLOWED_TRANSITIONS and the /api/articles route handlers.
 */

export const ARTICLE_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "PENDING_LOCATION",
  "PUBLISHED",
  "REJECTED",
  "ARCHIVED",
] as const;

export type ArticleStatus = (typeof ARTICLE_STATUSES)[number];

export const ARTICLE_CATEGORIES = [
  "CAMPUS",
  "ACADEMICS",
  "SPORTS",
  "EVENTS",
  "CULTURE",
  "ANNOUNCEMENTS",
  "OTHER",
] as const;

export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<ArticleCategory, string> = {
  CAMPUS: "Campus",
  ACADEMICS: "Academics",
  SPORTS: "Sports",
  EVENTS: "Events",
  CULTURE: "Culture",
  ANNOUNCEMENTS: "Announcements",
  OTHER: "Other",
};

export const STATUS_LABELS: Record<ArticleStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "In review",
  PENDING_LOCATION: "Final approval",
  PUBLISHED: "Published",
  REJECTED: "Needs changes",
  ARCHIVED: "Archived",
};

/** Editorial actions a mutating request can request. */
export type ReviewAction = "submit" | "approve" | "reject" | "archive";

/**
 * The status an action moves an article to, and the statuses from which the
 * action is legal. Actor eligibility (author vs reviewer) is checked separately.
 */
export const ACTION_TRANSITIONS: Record<
  ReviewAction,
  { from: ArticleStatus[]; to: ArticleStatus }
> = {
  submit: { from: ["DRAFT", "REJECTED"], to: "SUBMITTED" },
  // approve `to` is nominal — for a two-stage (student) article at SUBMITTED it
  // actually moves to PENDING_LOCATION; the route computes the real target.
  approve: { from: ["SUBMITTED", "PENDING_LOCATION"], to: "PUBLISHED" },
  reject: { from: ["SUBMITTED", "PENDING_LOCATION"], to: "REJECTED" },
  archive: {
    from: ["PUBLISHED", "SUBMITTED", "PENDING_LOCATION", "REJECTED"],
    to: "ARCHIVED",
  },
};

export interface Article {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  /** Every image, in display order; `coverImage` always mirrors images[0]. */
  images: string[];
  coverImage: string | null;
  category: ArticleCategory;
  status: ArticleStatus;
  authorUid: string;
  authorName: string;
  /** True when the author is a student → two-stage approval (college → location). */
  twoStage: boolean;
  societyId: string;
  locationId: string;
  collegeId: string | null;
  departmentId: string | null;
  reviewedByUid: string | null;
  reviewedByName: string | null;
  reviewNote: string | null;
  createdAt: number | null;
  updatedAt: number | null;
  submittedAt: number | null;
  publishedAt: number | null;
}
