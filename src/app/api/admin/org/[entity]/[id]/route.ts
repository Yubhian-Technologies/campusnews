/**
 * DELETE /api/admin/org/[entity]/[id] — remove an org entity. Society-Admin
 * gated. Blocks deletion when child entities still reference it, to avoid
 * orphaning colleges/departments.
 */
import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api-guard";
import {
  deleteOrgDoc,
  listColleges,
  listDepartments,
  orgDocExists,
} from "@/lib/firebase/org";
import { ORG_ENTITIES, type OrgEntity } from "@/lib/org/types";

type Ctx = { params: Promise<{ entity: string; id: string }> };

function isEntity(v: string): v is OrgEntity {
  return (ORG_ENTITIES as string[]).includes(v);
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const { entity, id } = await ctx.params;
  if (!isEntity(entity)) {
    return NextResponse.json({ error: "Unknown entity." }, { status: 404 });
  }
  const perm =
    entity === "locations" ? "org:manage_locations" : "org:manage_colleges";
  const guard = await requireApiPermission(perm);
  if (guard instanceof NextResponse) return guard;

  const user = guard.user.profile;
  const societyId = user.societyId;
  const isAdmin = user.roleIds.includes("society_admin");

  if (!(await orgDocExists(entity, id))) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  // Non-admins (News Head) may only delete colleges/departments in their location.
  if (!isAdmin) {
    if (entity === "colleges") {
      const college = (await listColleges(societyId)).find((c) => c.id === id);
      if (!college || college.locationId !== user.locationId) {
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      }
    } else if (entity === "departments") {
      const dept = (await listDepartments(societyId)).find((d) => d.id === id);
      if (!dept || dept.locationId !== user.locationId) {
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      }
    }
  }

  // Guard against orphaning children.
  if (entity === "locations") {
    const colleges = await listColleges(societyId, id);
    if (colleges.length > 0) {
      return NextResponse.json(
        { error: "Remove this location's colleges first." },
        { status: 409 },
      );
    }
  }
  if (entity === "colleges") {
    const departments = await listDepartments(societyId, id);
    if (departments.length > 0) {
      return NextResponse.json(
        { error: "Remove this college's departments first." },
        { status: 409 },
      );
    }
  }

  await deleteOrgDoc(entity, id);
  return NextResponse.json({ ok: true });
}
