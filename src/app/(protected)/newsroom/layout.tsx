import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { canReview } from "@/lib/content/authorize";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Button } from "@/components/ui/button";

/**
 * Unified authoring area shared by every content role, so the article editor
 * and review queue live in one place instead of being duplicated under each
 * role prefix. Authoritative role gate here; scope checks happen per-article.
 */
export default async function NewsroomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireRole(
    ["reporter", "student", "college_head", "location_news_head", "society_admin"],
    "/newsroom",
  );

  return (
    <DashboardShell
      title="Newsroom"
      nav={
        <>
          <Button render={<Link href="/newsroom" />} variant="ghost" size="sm">
            My Articles
          </Button>
          {canReview(profile) && (
            <Button
              render={<Link href="/newsroom/review" />}
              variant="ghost"
              size="sm"
            >
              Review
            </Button>
          )}
          <Button render={<Link href="/news" />} variant="ghost" size="sm">
            Public site
          </Button>
        </>
      }
    >
      {children}
    </DashboardShell>
  );
}
