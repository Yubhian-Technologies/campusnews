/**
 * Organization hierarchy: Society → Location → College → Department.
 *
 * Each entity's document id is a human-chosen slug (e.g. "bhimavaram", "vit"),
 * so existing free-text references on users/articles stay valid and URLs/scopes
 * remain readable. IDs are immutable once created.
 */

export type OrgEntity = "locations" | "colleges" | "departments";

export const ORG_ENTITIES: OrgEntity[] = [
  "locations",
  "colleges",
  "departments",
];

export interface Location {
  id: string;
  societyId: string;
  name: string;
  createdAt: number | null;
  updatedAt: number | null;
}

export interface College {
  id: string;
  societyId: string;
  locationId: string;
  name: string;
  /** Email domain for this college, e.g. "vishnu.edu.in". Students must use an
   *  address on this domain to contribute. Null when not configured. */
  domain: string | null;
  createdAt: number | null;
  updatedAt: number | null;
}

export interface Department {
  id: string;
  societyId: string;
  locationId: string;
  collegeId: string;
  name: string;
  createdAt: number | null;
  updatedAt: number | null;
}

/** Lightweight option shape used to populate scope dropdowns. */
export interface OrgOption {
  id: string;
  name: string;
  locationId?: string;
  collegeId?: string;
}
