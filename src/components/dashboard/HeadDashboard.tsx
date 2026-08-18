import Link from "next/link";
import { Inbox, CheckCircle2, FileEdit, Plus, Building2 } from "lucide-react";
import type { Article } from "@/lib/content/types";
import type { UserProfile } from "@/lib/types";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatTile } from "@/components/dashboard/StatTile";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Dashboard hub for Location Admin / College Admin: review queue front-and-
 * centre (their own posts publish directly, no review needed), scope stats,
 * and (Location Admin only) college management.
 */
export function HeadDashboard({
  title,
  profile,
  pending,
  publishedInScope,
  myDrafts,
  queue,
  canManageColleges,
}: {
  title: string;
  profile: UserProfile;
  pending: number;
  publishedInScope: number;
  myDrafts: number;
  queue: Article[];
  canManageColleges: boolean;
}) {
  const scope = [profile.locationId, profile.collegeId]
    .filter(Boolean)
    .join(" · ");

  return (
    <DashboardShell
      title={title}
      nav={
        <>
          <Button render={<Link href="/newsroom/review" />} variant="ghost" size="sm">
            Review
          </Button>
          {canManageColleges && (
            <Button render={<Link href="/news-head/colleges" />} variant="ghost" size="sm">
              Colleges
            </Button>
          )}
          <Button render={<Link href="/newsroom" />} variant="ghost" size="sm">
            Newsroom
          </Button>
        </>
      }
    >
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome, {profile.displayName?.split(" ")[0] ?? "there"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {scope ? `Managing ${scope}` : "Review and publish content in your scope."}
            </p>
          </div>
          <div className="flex gap-2">
            <Button render={<Link href="/newsroom/review" />}>
              <Inbox className="size-4" />
              Review queue
            </Button>
            <Button render={<Link href="/newsroom/new" />} variant="outline">
              <Plus className="size-4" />
              New post
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile label="Pending review" value={pending} icon={<Inbox className="size-5" />} />
          <StatTile label="Published in scope" value={publishedInScope} icon={<CheckCircle2 className="size-5" />} />
          <StatTile label="My drafts" value={myDrafts} icon={<FileEdit className="size-5" />} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Awaiting your review</CardTitle>
              <CardDescription>
                Submitted stories in your scope.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {queue.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nothing to review right now.
                </p>
              ) : (
                <ul className="divide-y">
                  {queue.slice(0, 5).map((a) => (
                    <li key={a.id}>
                      <Link
                        href={`/newsroom/${a.id}`}
                        className="flex items-center justify-between gap-3 py-3 hover:opacity-80"
                      >
                        <span className="min-w-0 truncate font-medium">
                          {a.title}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {a.authorName}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {canManageColleges && (
            <Card>
              <CardHeader>
                <CardTitle>Colleges &amp; departments</CardTitle>
                <CardDescription>
                  Manage the colleges in your location.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button render={<Link href="/news-head/colleges" />}>
                  <Building2 className="size-4" />
                  Manage colleges
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
