import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { getArticle } from "@/lib/firebase/articles";
import { canReviewArticle } from "@/lib/content/authorize";
import { ArticleStatusBadge } from "@/components/content/ArticleStatusBadge";
import { ArticleEditor } from "../_components/ArticleEditor";

export const metadata = { title: "Edit article · CampusNews" };

export default async function EditArticlePage({
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

  const article = await getArticle(id);
  if (!article || article.societyId !== profile.societyId) notFound();

  // Author (any status) or in-scope reviewer may open it; otherwise bounce.
  const isAuthor = article.authorUid === profile.uid;
  if (!isAuthor && !canReviewArticle(profile, article)) {
    redirect("/newsroom");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Edit article</h1>
        <ArticleStatusBadge status={article.status} />
      </div>
      <ArticleEditor profile={profile} article={article} />
    </div>
  );
}
