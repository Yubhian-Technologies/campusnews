/**
 * Server-side Firestore access for /reels/{id} (Admin SDK). Reels reuse the
 * article workflow (statuses + two-stage), so the same approval authorization
 * from lib/content/authorize applies. Also maps published records to the public
 * `Reel` shape consumed by the existing reel UI.
 */
import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "./admin";
import type { ReelRecord } from "@/lib/content/reelTypes";
import type { ArticleStatus } from "@/lib/content/types";
import { type Reel, DEMO_REELS } from "@/lib/content/reels";
import type { UserProfile } from "@/lib/types";

const REELS = "reels";

function ts(v: unknown): number | null {
  return v instanceof Timestamp ? v.toMillis() : null;
}

function mapReel(id: string, data: FirebaseFirestore.DocumentData): ReelRecord {
  return {
    id,
    title: data.title ?? "",
    videoUrl: data.videoUrl ?? "",
    thumbnail: data.thumbnail ?? null,
    status: (data.status ?? "DRAFT") as ArticleStatus,
    twoStage: Boolean(data.twoStage),
    authorUid: data.authorUid ?? "",
    authorName: data.authorName ?? "",
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

export interface CreateReelData {
  title: string;
  videoUrl: string;
  thumbnail: string | null;
  twoStage: boolean;
  authorUid: string;
  authorName: string;
  societyId: string;
  locationId: string;
  collegeId: string | null;
  departmentId: string | null;
}

export async function createReel(data: CreateReelData): Promise<string> {
  const ref = adminDb().collection(REELS).doc();
  await ref.set({
    ...data,
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

export async function getReelRecord(id: string): Promise<ReelRecord | null> {
  const snap = await adminDb().collection(REELS).doc(id).get();
  return snap.exists ? mapReel(snap.id, snap.data()!) : null;
}

export interface UpdateReelData {
  title?: string;
  videoUrl?: string;
  thumbnail?: string | null;
}

/** Patch a reel's content (title/video/thumbnail) — status is untouched. */
export async function updateReel(id: string, patch: UpdateReelData): Promise<void> {
  await adminDb()
    .collection(REELS)
    .doc(id)
    .update({ ...patch, updatedAt: FieldValue.serverTimestamp() });
}

export interface ApplyReelActionData {
  status: ArticleStatus;
  reviewerUid?: string;
  reviewerName?: string;
  note?: string | null;
  setSubmittedAt?: boolean;
  setPublishedAt?: boolean;
}

export async function applyReelAction(
  id: string,
  data: ApplyReelActionData,
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
  await adminDb().collection(REELS).doc(id).update(patch);
}

export async function deleteReel(id: string): Promise<void> {
  await adminDb().collection(REELS).doc(id).delete();
}

export async function listReelsByAuthor(
  authorUid: string,
): Promise<ReelRecord[]> {
  const snap = await adminDb()
    .collection(REELS)
    .where("authorUid", "==", authorUid)
    .get();
  return snap.docs
    .map((d) => mapReel(d.id, d.data()))
    .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
}

/**
 * Role-aware reel review queue (mirrors the article queue + two-stage rules).
 * Society Admin's queue excludes Student (two-stage) SUBMITTED reels — only
 * their own college admin may act on those (see canApproveStage1); legacy
 * PENDING_LOCATION records still show (stage-2 fallback does allow Admin).
 */
export async function listReelReviewQueueForUser(
  user: UserProfile,
): Promise<ReelRecord[]> {
  const col = adminDb().collection(REELS);
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
      loc.where("status", "==", "SUBMITTED").where("twoStage", "==", false).get(),
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
    .map((d) => mapReel(d.id, d.data()))
    .sort((a, b) => (a.submittedAt ?? 0) - (b.submittedAt ?? 0));
}

export async function listPublishedReelRecords(
  societyId: string,
): Promise<ReelRecord[]> {
  const snap = await adminDb()
    .collection(REELS)
    .where("societyId", "==", societyId)
    .where("status", "==", "PUBLISHED")
    .get();
  return snap.docs
    .map((d) => mapReel(d.id, d.data()))
    .sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
}

/** Map a record to the public Reel shape used by the reel UI. */
export function toPublicReel(r: ReelRecord): Reel {
  return {
    id: r.id,
    title: r.title,
    thumbnail: r.thumbnail ?? `https://picsum.photos/seed/${r.id}/600/900`,
    date: r.publishedAt
      ? new Date(r.publishedAt).toLocaleDateString(undefined, {
          day: "numeric",
          month: "short",
        })
      : "",
    videoUrl: r.videoUrl,
  };
}

/** Published reels for the public site, mapped to the UI shape. */
export async function listPublishedReels(societyId: string): Promise<Reel[]> {
  return (await listPublishedReelRecords(societyId)).map(toPublicReel);
}

/**
 * Public reel feed: real published reels first, then the built-in demo reels as
 * a fallback so the reels experience is never empty.
 */
export async function getPublicReels(societyId: string): Promise<Reel[]> {
  return [...(await listPublishedReels(societyId)), ...DEMO_REELS];
}

export async function getPublicReel(
  societyId: string,
  id: string,
): Promise<Reel | null> {
  return (await getPublicReels(societyId)).find((r) => r.id === id) ?? null;
}
