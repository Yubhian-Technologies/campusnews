import { requireRole } from "@/lib/auth/session";
import {
  listArticlesByAuthor,
  listPublishedArticles,
  listReviewQueueForUser,
} from "@/lib/firebase/articles";
import { HeadDashboard } from "@/components/dashboard/HeadDashboard";

export const metadata = { title: "College Head · CampusNews" };

export default async function CollegeHeadDashboardPage() {
  const { uid, profile } = await requireRole(
    ["college_head"],
    "/college-head/dashboard",
  );

  const [queue, publishedInLocation, mine] = await Promise.all([
    listReviewQueueForUser(profile),
    listPublishedArticles(profile.societyId, {
      locationId: profile.locationId ?? undefined,
    }),
    listArticlesByAuthor(uid),
  ]);

  const publishedInScope = publishedInLocation.filter(
    (a) => a.collegeId === profile.collegeId,
  ).length;

  return (
    <HeadDashboard
      title="College Admin"
      profile={profile}
      pending={queue.length}
      publishedInScope={publishedInScope}
      myDrafts={mine.filter((a) => a.status === "DRAFT").length}
      queue={queue}
      canManageColleges={false}
    />
  );
}
