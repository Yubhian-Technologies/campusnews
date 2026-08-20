import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { getReelRecord } from "@/lib/firebase/reels";
import { canReviewArticle } from "@/lib/content/authorize";
import { ArticleStatusBadge } from "@/components/content/ArticleStatusBadge";
import { ReelEditor } from "@/components/content/ReelEditor";

export const metadata = { title: "Edit reel · CampusNews" };

export default async function EditReelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile } = await requireRole([
    "reporter",
    "student",
    "college_head",
    "location_news_head",
    "society_admin",
  ]);

  const reel = await getReelRecord(id);
  if (!reel || reel.societyId !== profile.societyId) notFound();

  // Author (any status) or in-scope reviewer may open it; otherwise bounce.
  const isAuthor = reel.authorUid === profile.uid;
  if (!isAuthor && !canReviewArticle(profile, reel)) {
    redirect("/newsroom");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Edit reel</h1>
        <ArticleStatusBadge status={reel.status} />
      </div>
      <ReelEditor profile={profile} reel={reel} />
    </div>
  );
}
