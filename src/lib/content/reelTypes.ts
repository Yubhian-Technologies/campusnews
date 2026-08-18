/**
 * Reel record stored in Firestore /reels/{id}. Shares the article workflow
 * (statuses + two-stage flag) so the same approval authorization applies.
 */
import type { ArticleStatus } from "./types";

export interface ReelRecord {
  id: string;
  title: string;
  videoUrl: string;
  thumbnail: string | null;
  status: ArticleStatus;
  /** Author is a student → two-stage approval (college head → location head). */
  twoStage: boolean;
  authorUid: string;
  authorName: string;
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
