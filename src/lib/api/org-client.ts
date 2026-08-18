"use client";

/** Client wrappers for org read (dropdowns) and admin CRUD. */
import type { OrgEntity, OrgOption } from "@/lib/org/types";

async function parseError(res: Response): Promise<string> {
  const data = (await res.json().catch(() => null)) as { error?: string } | null;
  return data?.error ?? "Request failed. Please try again.";
}

/** Authenticated dropdown options (any content role). */
export async function fetchOrgOptions(
  type: OrgEntity,
  filter: { locationId?: string; collegeId?: string } = {},
): Promise<OrgOption[]> {
  const qs = new URLSearchParams({ type });
  if (filter.locationId) qs.set("locationId", filter.locationId);
  if (filter.collegeId) qs.set("collegeId", filter.collegeId);
  const res = await fetch(`/api/org?${qs.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(await parseError(res));
  return ((await res.json()) as { options: OrgOption[] }).options;
}

/** Admin: list full entity records for management. */
export async function listOrgAdmin<T>(
  entity: OrgEntity,
  filter: { locationId?: string; collegeId?: string } = {},
): Promise<T[]> {
  const qs = new URLSearchParams();
  if (filter.locationId) qs.set("locationId", filter.locationId);
  if (filter.collegeId) qs.set("collegeId", filter.collegeId);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  const res = await fetch(`/api/admin/org/${entity}${suffix}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await parseError(res));
  return ((await res.json()) as { items: T[] }).items;
}

export async function createOrgAdmin(
  entity: OrgEntity,
  payload: Record<string, string>,
): Promise<string> {
  const res = await fetch(`/api/admin/org/${entity}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return ((await res.json()) as { id: string }).id;
}

export async function deleteOrgAdmin(
  entity: OrgEntity,
  id: string,
): Promise<void> {
  const res = await fetch(`/api/admin/org/${entity}/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(await parseError(res));
}
