import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { listColleges, listLocations } from "@/lib/firebase/org";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { ScopedOrgManager } from "@/components/org/ScopedOrgManager";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Colleges · CampusNews" };

export default async function NewsHeadCollegesPage() {
  const { profile } = await requireRole(
    ["location_news_head"],
    "/news-head/colleges",
  );

  if (!profile.locationId) {
    // A News Head without a location can't scope colleges.
    redirect("/news-head/dashboard");
  }

  const [locations, colleges] = await Promise.all([
    listLocations(profile.societyId),
    listColleges(profile.societyId, profile.locationId),
  ]);
  const locationName =
    locations.find((l) => l.id === profile.locationId)?.name ??
    profile.locationId;

  return (
    <DashboardShell
      title="Colleges"
      nav={
        <>
          <Button render={<Link href="/news-head/dashboard" />} variant="ghost" size="sm">
            Overview
          </Button>
          <Button render={<Link href="/newsroom/review" />} variant="ghost" size="sm">
            Review
          </Button>
          <Button render={<Link href="/newsroom" />} variant="ghost" size="sm">
            Newsroom
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Colleges &amp; departments
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the colleges and departments in {locationName}.
          </p>
        </div>
        <ScopedOrgManager
          locationId={profile.locationId}
          locationName={locationName}
          initialColleges={colleges}
        />
      </div>
    </DashboardShell>
  );
}
