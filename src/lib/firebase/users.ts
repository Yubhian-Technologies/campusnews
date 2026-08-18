/**
 * Server-side Firestore access for /users/{uid} profiles (Admin SDK).
 * Handles Timestamp <-> epoch-millis mapping so the rest of the app deals in
 * plain serializable objects.
 */
import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "./admin";
import type { RoleId, UserProfile, UserStatus } from "@/lib/types";

const USERS = "users";

function tsToMillis(value: unknown): number | null {
  if (value instanceof Timestamp) return value.toMillis();
  return null;
}

/** Convert a raw Firestore document into a serializable UserProfile. */
export function mapUserDoc(
  uid: string,
  data: FirebaseFirestore.DocumentData,
): UserProfile {
  return {
    uid,
    email: data.email ?? "",
    displayName: data.displayName ?? "",
    phoneNumber: data.phoneNumber ?? null,
    profileImage: data.profileImage ?? null,
    status: (data.status ?? "PENDING_APPROVAL") as UserStatus,
    societyId: data.societyId ?? "",
    locationId: data.locationId ?? null,
    collegeId: data.collegeId ?? null,
    departmentId: data.departmentId ?? null,
    roleIds: (data.roleIds ?? []) as RoleId[],
    isReporter: Boolean(data.isReporter),
    createdAt: tsToMillis(data.createdAt),
    updatedAt: tsToMillis(data.updatedAt),
    lastLoginAt: tsToMillis(data.lastLoginAt),
  };
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await adminDb().collection(USERS).doc(uid).get();
  if (!snap.exists) return null;
  return mapUserDoc(uid, snap.data()!);
}

export interface CreateUserProfileInput {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber?: string | null;
  status: UserStatus;
  societyId: string;
  locationId?: string | null;
  collegeId?: string | null;
  departmentId?: string | null;
  roleIds: RoleId[];
}

/** Write a new /users/{uid} document. Never stores passwords/credentials. */
export async function createUserProfile(
  input: CreateUserProfileInput,
): Promise<void> {
  await adminDb()
    .collection(USERS)
    .doc(input.uid)
    .set({
      uid: input.uid,
      email: input.email,
      displayName: input.displayName,
      phoneNumber: input.phoneNumber ?? null,
      profileImage: null,
      status: input.status,
      societyId: input.societyId,
      locationId: input.locationId ?? null,
      collegeId: input.collegeId ?? null,
      departmentId: input.departmentId ?? null,
      roleIds: input.roleIds,
      isReporter: input.roleIds.includes("reporter"),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      lastLoginAt: null,
    });
}

export interface UpdateUserProfileInput {
  displayName?: string;
  phoneNumber?: string | null;
  status?: UserStatus;
  locationId?: string | null;
  collegeId?: string | null;
  departmentId?: string | null;
  roleIds?: RoleId[];
}

/** Patch a /users/{uid} document; keeps isReporter mirrored from roleIds. */
export async function updateUserProfile(
  uid: string,
  patch: UpdateUserProfileInput,
): Promise<void> {
  const data: FirebaseFirestore.DocumentData = {
    ...patch,
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (patch.roleIds) data.isReporter = patch.roleIds.includes("reporter");
  await adminDb().collection(USERS).doc(uid).update(data);
}

/** The reel ids a user has saved (personal bookmarks). */
export async function getSavedReels(uid: string): Promise<string[]> {
  const snap = await adminDb().collection(USERS).doc(uid).get();
  return (snap.data()?.savedReels ?? []) as string[];
}

/** Add or remove a reel id from the user's saved list. */
export async function setReelSaved(
  uid: string,
  reelId: string,
  save: boolean,
): Promise<void> {
  await adminDb()
    .collection(USERS)
    .doc(uid)
    .update({
      savedReels: save
        ? FieldValue.arrayUnion(reelId)
        : FieldValue.arrayRemove(reelId),
      updatedAt: FieldValue.serverTimestamp(),
    });
}

/** A user's account-persisted likes (news article slugs + reel ids). */
export async function getLikes(
  uid: string,
): Promise<{ articles: string[]; reels: string[] }> {
  const snap = await adminDb().collection(USERS).doc(uid).get();
  const d = snap.data() ?? {};
  return {
    articles: (d.likedArticles ?? []) as string[],
    reels: (d.likedReels ?? []) as string[],
  };
}

/** Toggle a single like on the user's account. */
export async function setLike(
  uid: string,
  kind: "article" | "reel",
  id: string,
  like: boolean,
): Promise<void> {
  const field = kind === "article" ? "likedArticles" : "likedReels";
  await adminDb()
    .collection(USERS)
    .doc(uid)
    .update({
      [field]: like ? FieldValue.arrayUnion(id) : FieldValue.arrayRemove(id),
      updatedAt: FieldValue.serverTimestamp(),
    });
}

/** Merge device-local likes into the account (called on login). */
export async function mergeLikes(
  uid: string,
  articles: string[],
  reels: string[],
): Promise<void> {
  const patch: FirebaseFirestore.DocumentData = {
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (articles.length) patch.likedArticles = FieldValue.arrayUnion(...articles);
  if (reels.length) patch.likedReels = FieldValue.arrayUnion(...reels);
  await adminDb().collection(USERS).doc(uid).update(patch);
}

/** Record last login time (called after a session cookie is minted). */
export async function touchLastLogin(uid: string): Promise<void> {
  await adminDb()
    .collection(USERS)
    .doc(uid)
    .update({ lastLoginAt: FieldValue.serverTimestamp() });
}

export interface ListUsersFilter {
  status?: UserStatus;
  roleId?: RoleId;
  locationId?: string;
  collegeId?: string;
}

/**
 * List users within a society, optionally filtered. Search-by-text is applied
 * in-memory by the caller since Firestore lacks substring search.
 */
export async function listUsers(
  societyId: string,
  filter: ListUsersFilter = {},
): Promise<UserProfile[]> {
  let query: FirebaseFirestore.Query = adminDb()
    .collection(USERS)
    .where("societyId", "==", societyId);

  if (filter.status) query = query.where("status", "==", filter.status);
  if (filter.roleId) query = query.where("roleIds", "array-contains", filter.roleId);
  if (filter.locationId) query = query.where("locationId", "==", filter.locationId);
  if (filter.collegeId) query = query.where("collegeId", "==", filter.collegeId);

  const snap = await query.get();
  return snap.docs
    .map((doc) => mapUserDoc(doc.id, doc.data()))
    .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
}
