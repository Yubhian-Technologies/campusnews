import { requireRole } from "@/lib/auth/session";
import {
  listArticlesByAuthor,
  listPublishedArticles,
  listReviewQueueForUser,
} from "@/lib/firebase/articles";
import { HeadDashboard } from "@/components/dashboard/HeadDashboard";

export const metadata = { title: "News Head · CampusNews" };

export default async function NewsHeadDashboardPage() {
  const { uid, profile } = await requireRole(
    ["location_news_head"],
    "/news-head/dashboard",
  );

  const [queue, published, mine] = await Promise.all([
    listReviewQueueForUser(profile),
    listPublishedArticles(profile.societyId, {
      locationId: profile.locationId ?? undefined,
    }),
    listArticlesByAuthor(uid),
  ]);

  return (
    <HeadDashboard
      title="Location Admin"
      profile={profile}
      pending={queue.length}
      publishedInScope={published.length}
      myDrafts={mine.filter((a) => a.status === "DRAFT").length}
      queue={queue}
      canManageColleges
    />
  );
}
