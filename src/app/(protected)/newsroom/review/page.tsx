import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { canReview } from "@/lib/content/authorize";
import { listReviewQueueForUser } from "@/lib/firebase/articles";
import { listReelReviewQueueForUser } from "@/lib/firebase/reels";
import { ReviewQueue } from "../_components/ReviewQueue";
import { ReelReviewQueue } from "../_components/ReelReviewQueue";

export const metadata = { title: "Review queue · CampusNews" };

export default async function ReviewPage() {
  const { profile } = await requireRole([
    "college_head",
    "location_news_head",
    "society_admin",
  ]);
  if (!canReview(profile)) redirect("/newsroom");

  const [articles, reels] = await Promise.all([
    listReviewQueueForUser(profile),
    listReelReviewQueueForUser(profile),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Review queue</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Submitted content awaiting your review, within your scope.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-bold tracking-tight">
          Articles ({articles.length})
        </h2>
        <ReviewQueue initial={articles} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold tracking-tight">
          Reels ({reels.length})
        </h2>
        <ReelReviewQueue initial={reels} />
      </section>
    </div>
  );
}
