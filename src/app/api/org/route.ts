/**
 * GET /api/org?type=locations|colleges|departments&locationId=&collegeId=
 * Returns option lists for scope dropdowns. Available to any authenticated,
 * ACTIVE user (the article editor and user-create dialog both consume it),
 * always scoped to the caller's society.
 */
import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-guard";
import { listOrgOptions, type OrgCollection } from "@/lib/firebase/org";
import { ORG_ENTITIES } from "@/lib/org/types";

export async function GET(request: Request) {
  const guard = await requireApiUser();
  if (guard instanceof NextResponse) return guard;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "";
  if (!(ORG_ENTITIES as string[]).includes(type)) {
    return NextResponse.json({ error: "Unknown type." }, { status: 400 });
  }

  const options = await listOrgOptions(
    type as OrgCollection,
    guard.user.profile.societyId,
    {
      locationId: searchParams.get("locationId") ?? undefined,
      collegeId: searchParams.get("collegeId") ?? undefined,
    },
  );
  return NextResponse.json({ options });
}
