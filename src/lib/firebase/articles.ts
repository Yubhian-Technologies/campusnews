/**
 * Server-side Firestore access for /articles/{id} (Admin SDK). Maps Timestamps
 * to epoch millis so callers deal in plain serializable objects, mirroring
 * lib/firebase/users.ts.
 */
import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "./admin";
import { makeSlug } from "@/lib/content/slug";
import type {
  Article,
  ArticleCategory,
  ArticleStatus,
} from "@/lib/content/types";
import type { UserProfile } from "@/lib/types";

const ARTICLES = "articles";

function ts(value: unknown): number | null {
  return value instanceof Timestamp ? value.toMillis() : null;
}

function mapArticle(
  id: string,
  data: FirebaseFirestore.DocumentData,
): Article {
  // Legacy articles (pre-gallery) only ever had `coverImage`; fall back to it
  // as a single-item gallery so old published articles still render.
  const images: string[] = Array.isArray(data.images)
    ? data.images
    : data.coverImage
      ? [data.coverImage]
      : [];
  return {
    id,
    slug: data.slug ?? "",
    title: data.title ?? "",
    summary: data.summary ?? "",
    body: data.body ?? "",
    images,
    coverImage: images[0] ?? null,
    category: (data.category ?? "OTHER") as ArticleCategory,
    status: (data.status ?? "DRAFT") as ArticleStatus,
    authorUid: data.authorUid ?? "",
    authorName: data.authorName ?? "",
    twoStage: Boolean(data.twoStage),
    societyId: data.societyId ?? "",
    locationId: data.locationId ?? "",
    collegeId: data.collegeId ?? null,
    departmentId: data.departmentId ?? null,
    reviewedByUid: data.reviewedByUid ?? null,
    reviewedByName: data.reviewedByName ?? null,
    reviewNote: data.reviewNote ?? null,
    createdAt: ts(data.createdAt),
    updatedAt: ts(data.updatedAt),
    submittedAt: ts(data.submittedAt),
    publishedAt: ts(data.publishedAt),
  };
}

export interface CreateArticleData {
  title: string;
  summary: string;
  body: string;
  category: ArticleCategory;
  /** In display order; coverImage is always derived as images[0]. */
  images: string[];
  authorUid: string;
  authorName: string;
  /** Author is a student → two-stage approval (college head → location head). */
  twoStage: boolean;
  societyId: string;
  locationId: string;
  collegeId: string | null;
  departmentId: string | null;
}

/** Create a DRAFT article; returns the new id. */
export async function createArticle(data: CreateArticleData): Promise<string> {
  const ref = adminDb().collection(ARTICLES).doc();
  await ref.set({
    ...data,
    coverImage: data.images[0] ?? null,
    slug: makeSlug(data.title),
    status: "DRAFT" satisfies ArticleStatus,
    reviewedByUid: null,
    reviewedByName: null,
    reviewNote: null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    submittedAt: null,
    publishedAt: null,
  });
  return ref.id;
}

export async function getArticle(id: string): Promise<Article | null> {
  const snap = await adminDb().collection(ARTICLES).doc(id).get();
  return snap.exists ? mapArticle(snap.id, snap.data()!) : null;
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const snap = await adminDb()
    .collection(ARTICLES)
    .where("slug", "==", slug)
    .limit(1)
    .get();
  return snap.empty ? null : mapArticle(snap.docs[0].id, snap.docs[0].data());
}

export interface UpdateArticleData {
  title?: string;
  summary?: string;
  body?: string;
  category?: ArticleCategory;
  /** In display order; coverImage is always derived as images[0]. */
  images?: string[];
  locationId?: string;
  collegeId?: string | null;
  departmentId?: string | null;
}

export async function updateArticle(
  id: string,
  patch: UpdateArticleData,
): Promise<void> {
  await adminDb()
    .collection(ARTICLES)
    .doc(id)
    .update({
      ...patch,
      ...(patch.images && { coverImage: patch.images[0] ?? null }),
      updatedAt: FieldValue.serverTimestamp(),
    });
}

export interface ApplyActionData {
  status: ArticleStatus;
  reviewerUid?: string;
  reviewerName?: string;
  note?: string | null;
  setSubmittedAt?: boolean;
  setPublishedAt?: boolean;
}

/** Apply a workflow transition, stamping the relevant timestamps/reviewer. */
export async function applyArticleAction(
  id: string,
  data: ApplyActionData,
): Promise<void> {
  const patch: FirebaseFirestore.DocumentData = {
    status: data.status,
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (data.reviewerUid !== undefined) patch.reviewedByUid = data.reviewerUid;
  if (data.reviewerName !== undefined) patch.reviewedByName = data.reviewerName;
  if (data.note !== undefined) patch.reviewNote = data.note;
  if (data.setSubmittedAt) patch.submittedAt = FieldValue.serverTimestamp();
  if (data.setPublishedAt) patch.publishedAt = FieldValue.serverTimestamp();
  await adminDb().collection(ARTICLES).doc(id).update(patch);
}

export async function deleteArticle(id: string): Promise<void> {
  await adminDb().collection(ARTICLES).doc(id).delete();
}

function sortByUpdated(a: Article, b: Article) {
  return (b.updatedAt ?? 0) - (a.updatedAt ?? 0);
}

/** Articles authored by a given user (their "My Articles" list). */
export async function listArticlesByAuthor(
  authorUid: string,
): Promise<Article[]> {
  const snap = await adminDb()
    .collection(ARTICLES)
    .where("authorUid", "==", authorUid)
    .get();
  return snap.docs.map((d) => mapArticle(d.id, d.data())).sort(sortByUpdated);
}

/**
 * The review queue tailored to a reviewer's role & the two-stage flow:
 *   - College Head → SUBMITTED articles in their college (stage 1).
 *   - Location News Head → single-stage SUBMITTED + all PENDING_LOCATION in
 *     their location (stage 2 for student content, plus reporter content).
 *   - Society Admin → everything awaiting review EXCEPT Student (two-stage)
 *     submissions, which only their own college admin may act on — no
 *     Super Admin shortcut (see canApproveStage1). Legacy PENDING_LOCATION
 *     records are still shown (that stage-2 fallback does allow Admin).
 */
export async function listReviewQueueForUser(
  user: UserProfile,
): Promise<Article[]> {
  const col = adminDb().collection(ARTICLES);
  const society = col.where("societyId", "==", user.societyId);
  let docs: FirebaseFirestore.QueryDocumentSnapshot[] = [];

  if (user.roleIds.includes("society_admin")) {
    const [pendingLocation, submittedSingleStage] = await Promise.all([
      society.where("status", "==", "PENDING_LOCATION").get(),
      society.where("status", "==", "SUBMITTED").where("twoStage", "==", false).get(),
    ]);
    docs = [...pendingLocation.docs, ...submittedSingleStage.docs];
  } else if (user.roleIds.includes("location_news_head") && user.locationId) {
    const loc = society.where("locationId", "==", user.locationId);
    const [pending, submittedSingle] = await Promise.all([
      loc.where("status", "==", "PENDING_LOCATION").get(),
      loc
        .where("status", "==", "SUBMITTED")
        .where("twoStage", "==", false)
        .get(),
    ]);
    docs = [...pending.docs, ...submittedSingle.docs];
  } else if (
    user.roleIds.includes("college_head") &&
    user.locationId &&
    user.collegeId
  ) {
    docs = (
      await society
        .where("collegeId", "==", user.collegeId)
        .where("status", "==", "SUBMITTED")
        .get()
    ).docs;
  }

  return docs
    .map((d) => mapArticle(d.id, d.data()))
    .sort((a, b) => (a.submittedAt ?? 0) - (b.submittedAt ?? 0));
}

/** Published articles for the public site, newest first. */
export async function listPublishedArticles(
  societyId: string,
  options: {
    category?: ArticleCategory;
    locationId?: string;
    collegeId?: string;
    max?: number;
  } = {},
): Promise<Article[]> {
  let query: FirebaseFirestore.Query = adminDb()
    .collection(ARTICLES)
    .where("societyId", "==", societyId)
    .where("status", "==", "PUBLISHED");
  if (options.category) query = query.where("category", "==", options.category);
  if (options.locationId)
    query = query.where("locationId", "==", options.locationId);
  if (options.collegeId)
    query = query.where("collegeId", "==", options.collegeId);

  const snap = await query.get();
  const items = snap.docs
    .map((d) => mapArticle(d.id, d.data()))
    .sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
  return options.max ? items.slice(0, options.max) : items;
}
