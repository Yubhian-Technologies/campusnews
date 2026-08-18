import Link from "next/link";
import { FileEdit, Send, CheckCircle2, RotateCcw, Plus } from "lucide-react";
import type { Article } from "@/lib/content/types";
import type { UserProfile } from "@/lib/types";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatTile } from "@/components/dashboard/StatTile";
import { ArticleStatusBadge } from "@/components/content/ArticleStatusBadge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Dashboard hub for content authors (Reporter, Student Contributor): status
 * stats for their own work + quick actions into the Newsroom.
 */
export function AuthorDashboard({
  title,
  profile,
  articles,
}: {
  title: string;
  profile: UserProfile;
  articles: Article[];
}) {
  const count = (s: Article["status"]) =>
    articles.filter((a) => a.status === s).length;
  const recent = articles.slice(0, 5);

  return (
    <DashboardShell
      title={title}
      nav={
        <Button render={<Link href="/newsroom" />} variant="ghost" size="sm">
          Newsroom
        </Button>
      }
    >
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome, {profile.displayName?.split(" ")[0] ?? "there"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Write stories and track them through review.
            </p>
          </div>
          <Button render={<Link href="/newsroom/new" />}>
            <Plus className="size-4" />
            New post
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Drafts" value={count("DRAFT")} icon={<FileEdit className="size-5" />} />
          <StatTile label="In review" value={count("SUBMITTED")} icon={<Send className="size-5" />} />
          <StatTile label="Published" value={count("PUBLISHED")} icon={<CheckCircle2 className="size-5" />} />
          <StatTile label="Needs changes" value={count("REJECTED")} icon={<RotateCcw className="size-5" />} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your recent articles</CardTitle>
            <CardDescription>Pick up where you left off.</CardDescription>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <div className="flex flex-col items-start gap-3">
                <p className="text-sm text-muted-foreground">
                  You haven&apos;t written anything yet.
                </p>
                <Button render={<Link href="/newsroom/new" />} size="sm">
                  Create your first post
                </Button>
              </div>
            ) : (
              <ul className="divide-y">
                {recent.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/newsroom/${a.id}`}
                      className="flex items-center justify-between gap-3 py-3 hover:opacity-80"
                    >
                      <span className="min-w-0 truncate font-medium">
                        {a.title}
                      </span>
                      <ArticleStatusBadge status={a.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
