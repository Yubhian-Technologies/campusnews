/**
 * Server-side Firestore access for the org hierarchy (Admin SDK).
 * Collections: /locations, /colleges, /departments. Document id = slug.
 */
import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "./admin";
import type {
  College,
  Department,
  Location,
  OrgOption,
} from "@/lib/org/types";
import type { UserProfile } from "@/lib/types";

function ms(v: unknown): number | null {
  return v instanceof Timestamp ? v.toMillis() : null;
}

// --- Locations -------------------------------------------------------------

export async function listLocations(societyId: string): Promise<Location[]> {
  const snap = await adminDb()
    .collection("locations")
    .where("societyId", "==", societyId)
    .get();
  return snap.docs
    .map((d) => ({
      id: d.id,
      societyId: d.data().societyId,
      name: d.data().name ?? d.id,
      createdAt: ms(d.data().createdAt),
      updatedAt: ms(d.data().updatedAt),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function createLocation(input: {
  id: string;
  societyId: string;
  name: string;
}): Promise<void> {
  await adminDb()
    .collection("locations")
    .doc(input.id)
    .set({
      societyId: input.societyId,
      name: input.name,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
}

// --- Colleges --------------------------------------------------------------

export async function listColleges(
  societyId: string,
  locationId?: string,
): Promise<College[]> {
  let q: FirebaseFirestore.Query = adminDb()
    .collection("colleges")
    .where("societyId", "==", societyId);
  if (locationId) q = q.where("locationId", "==", locationId);
  const snap = await q.get();
  return snap.docs
    .map((d) => ({
      id: d.id,
      societyId: d.data().societyId,
      locationId: d.data().locationId,
      name: d.data().name ?? d.id,
      domain: d.data().domain ?? null,
      createdAt: ms(d.data().createdAt),
      updatedAt: ms(d.data().updatedAt),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Find the college whose configured email domain matches, if any (self-registration). */
export async function getCollegeByDomain(domain: string): Promise<College | null> {
  const snap = await adminDb()
    .collection("colleges")
    .where("domain", "==", domain)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const d = snap.docs[0].data();
  return {
    id: snap.docs[0].id,
    societyId: d.societyId,
    locationId: d.locationId,
    name: d.name ?? snap.docs[0].id,
    domain: d.domain ?? null,
    createdAt: ms(d.createdAt),
    updatedAt: ms(d.updatedAt),
  };
}

/** Fetch a single college by its (slug) id. */
export async function getCollege(id: string): Promise<College | null> {
  const snap = await adminDb().collection("colleges").doc(id).get();
  if (!snap.exists) return null;
  const d = snap.data()!;
  return {
    id: snap.id,
    societyId: d.societyId,
    locationId: d.locationId,
    name: d.name ?? snap.id,
    domain: d.domain ?? null,
    createdAt: ms(d.createdAt),
    updatedAt: ms(d.updatedAt),
  };
}

/**
 * Returns an error message if a STUDENT contributor's email doesn't match their
 * college's configured domain (e.g. must be @vishnu.edu.in), else null. Only
 * students are restricted; staff accounts are unrestricted. When the college has
 * no domain configured, verification is skipped (allowed).
 */
export async function studentDomainError(
  profile: UserProfile,
): Promise<string | null> {
  const roles = profile.roleIds;
  const isStudent =
    roles.includes("student") &&
    !roles.includes("reporter") &&
    !roles.includes("college_head") &&
    !roles.includes("location_news_head") &&
    !roles.includes("society_admin");
  if (!isStudent) return null;

  if (!profile.collegeId) {
    return "Your account isn't linked to a college yet, so you can't contribute.";
  }
  const college = await getCollege(profile.collegeId);
  const domain = college?.domain ?? null;
  if (!domain) return null; // nothing to verify against

  const email = (profile.email ?? "").toLowerCase();
  if (!email.endsWith(`@${domain}`)) {
    return `Contributions require your college email address (@${domain}).`;
  }
  return null;
}

export async function createCollege(input: {
  id: string;
  societyId: string;
  locationId: string;
  name: string;
  domain?: string | null;
}): Promise<void> {
  await adminDb()
    .collection("colleges")
    .doc(input.id)
    .set({
      societyId: input.societyId,
      locationId: input.locationId,
      name: input.name,
      domain: input.domain ?? null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
}

// --- Departments -----------------------------------------------------------

export async function listDepartments(
  societyId: string,
  collegeId?: string,
): Promise<Department[]> {
  let q: FirebaseFirestore.Query = adminDb()
    .collection("departments")
    .where("societyId", "==", societyId);
  if (collegeId) q = q.where("collegeId", "==", collegeId);
  const snap = await q.get();
  return snap.docs
    .map((d) => ({
      id: d.id,
      societyId: d.data().societyId,
      locationId: d.data().locationId,
      collegeId: d.data().collegeId,
      name: d.data().name ?? d.id,
      createdAt: ms(d.data().createdAt),
      updatedAt: ms(d.data().updatedAt),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function createDepartment(input: {
  id: string;
  societyId: string;
  locationId: string;
  collegeId: string;
  name: string;
}): Promise<void> {
  await adminDb()
    .collection("departments")
    .doc(input.id)
    .set({
      societyId: input.societyId,
      locationId: input.locationId,
      collegeId: input.collegeId,
      name: input.name,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
}

// --- Shared helpers --------------------------------------------------------

const COLLECTION_BY_ENTITY = {
  locations: "locations",
  colleges: "colleges",
  departments: "departments",
} as const;

export type OrgCollection = keyof typeof COLLECTION_BY_ENTITY;

/** Does a document with this id already exist in the collection? */
export async function orgDocExists(
  entity: OrgCollection,
  id: string,
): Promise<boolean> {
  const snap = await adminDb()
    .collection(COLLECTION_BY_ENTITY[entity])
    .doc(id)
    .get();
  return snap.exists;
}

/** Delete an org document (used by admin management). */
export async function deleteOrgDoc(
  entity: OrgCollection,
  id: string,
): Promise<void> {
  await adminDb().collection(COLLECTION_BY_ENTITY[entity]).doc(id).delete();
}

/** Map an entity+society to option lists for dropdowns. */
export async function listOrgOptions(
  entity: OrgCollection,
  societyId: string,
  filter: { locationId?: string; collegeId?: string } = {},
): Promise<OrgOption[]> {
  if (entity === "locations") {
    return (await listLocations(societyId)).map((l) => ({
      id: l.id,
      name: l.name,
    }));
  }
  if (entity === "colleges") {
    return (await listColleges(societyId, filter.locationId)).map((c) => ({
      id: c.id,
      name: c.name,
      locationId: c.locationId,
    }));
  }
  return (await listDepartments(societyId, filter.collegeId)).map((d) => ({
    id: d.id,
    name: d.name,
    locationId: d.locationId,
    collegeId: d.collegeId,
  }));
}
