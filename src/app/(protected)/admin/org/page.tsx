import { requirePermission } from "@/lib/auth/session";
import { listLocations } from "@/lib/firebase/org";
import { OrgConsole } from "./_components/OrgConsole";

export const metadata = { title: "Organization · CampusNews" };

/**
 * Society Admin console for the org hierarchy: Locations → Colleges →
 * Departments. These records back the scope dropdowns used when creating users
 * and authoring articles.
 */
export default async function AdminOrgPage() {
  const { profile } = await requirePermission("users:read", {}, "/admin/org");
  const locations = await listLocations(profile.societyId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Organization</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage the locations, colleges, and departments that define scope
          across CampusNews.
        </p>
      </div>
      <OrgConsole initialLocations={locations} />
    </div>
  );
}
