/**
 * /api/admin/org/[entity]   (entity ∈ locations | colleges | departments)
 *   GET  — list entities in the admin's society (optionally filtered by parent).
 *   POST — create one. Society-Admin gated; validates parent references and id
 *          uniqueness. The document id is the admin-chosen slug.
 */
import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api-guard";
import {
  createCollege,
  createDepartment,
  createLocation,
  listColleges,
  listDepartments,
  listLocations,
  orgDocExists,
} from "@/lib/firebase/org";
import {
  createCollegeSchema,
  createDepartmentSchema,
  createLocationSchema,
} from "@/lib/validation/org";
import { ORG_ENTITIES, type OrgEntity } from "@/lib/org/types";

type Ctx = { params: Promise<{ entity: string }> };

function isEntity(v: string): v is OrgEntity {
  return (ORG_ENTITIES as string[]).includes(v);
}

export async function GET(request: Request, ctx: Ctx) {
  const { entity } = await ctx.params;
  if (!isEntity(entity)) {
    return NextResponse.json({ error: "Unknown entity." }, { status: 404 });
  }
  // Any user who can create content needs to read the org tree for dropdowns,
  // but this admin route is for management; gate on users:read.
  const guard = await requireApiPermission("users:read");
  if (guard instanceof NextResponse) return guard;

  const societyId = guard.user.profile.societyId;
  const { searchParams } = new URL(request.url);

  if (entity === "locations") {
    return NextResponse.json({ items: await listLocations(societyId) });
  }
  if (entity === "colleges") {
    const locationId = searchParams.get("locationId") ?? undefined;
    return NextResponse.json({ items: await listColleges(societyId, locationId) });
  }
  const collegeId = searchParams.get("collegeId") ?? undefined;
  return NextResponse.json({ items: await listDepartments(societyId, collegeId) });
}

export async function POST(request: Request, ctx: Ctx) {
  const { entity } = await ctx.params;
  if (!isEntity(entity)) {
    return NextResponse.json({ error: "Unknown entity." }, { status: 404 });
  }
  // Locations are Society-Admin only; colleges/departments may also be managed
  // by a Location News Head — but only within their own location.
  const perm =
    entity === "locations" ? "org:manage_locations" : "org:manage_colleges";
  const guard = await requireApiPermission(perm);
  if (guard instanceof NextResponse) return guard;

  const user = guard.user.profile;
  const societyId = user.societyId;
  const isAdmin = user.roleIds.includes("society_admin");
  const body = await request.json().catch(() => null);

  if (entity === "locations") {
    const parsed = createLocationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed.", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    if (await orgDocExists("locations", parsed.data.id)) {
      return NextResponse.json(
        { error: `A location with id “${parsed.data.id}” already exists.` },
        { status: 409 },
      );
    }
    await createLocation({ ...parsed.data, societyId });
    return NextResponse.json({ ok: true, id: parsed.data.id }, { status: 201 });
  }

  if (entity === "colleges") {
    const parsed = createCollegeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed.", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    if (!isAdmin && parsed.data.locationId !== user.locationId) {
      return NextResponse.json(
        { error: "You can only add colleges within your own location." },
        { status: 403 },
      );
    }
    const locations = await listLocations(societyId);
    if (!locations.some((l) => l.id === parsed.data.locationId)) {
      return NextResponse.json(
        { error: "That location does not exist." },
        { status: 400 },
      );
    }
    if (await orgDocExists("colleges", parsed.data.id)) {
      return NextResponse.json(
        { error: `A college with id “${parsed.data.id}” already exists.` },
        { status: 409 },
      );
    }
    await createCollege({ ...parsed.data, societyId });
    return NextResponse.json({ ok: true, id: parsed.data.id }, { status: 201 });
  }

  // departments
  const parsed = createDepartmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  if (!isAdmin && parsed.data.locationId !== user.locationId) {
    return NextResponse.json(
      { error: "You can only add departments within your own location." },
      { status: 403 },
    );
  }
  const colleges = await listColleges(societyId, parsed.data.locationId);
  if (!colleges.some((c) => c.id === parsed.data.collegeId)) {
    return NextResponse.json(
      { error: "That college does not exist in the selected location." },
      { status: 400 },
    );
  }
  if (await orgDocExists("departments", parsed.data.id)) {
    return NextResponse.json(
      { error: `A department with id “${parsed.data.id}” already exists.` },
      { status: 409 },
    );
  }
  await createDepartment({ ...parsed.data, societyId });
  return NextResponse.json({ ok: true, id: parsed.data.id }, { status: 201 });
}
