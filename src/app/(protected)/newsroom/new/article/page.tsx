import { requireRole } from "@/lib/auth/session";
import { ArticleEditor } from "../../_components/ArticleEditor";

export const metadata = { title: "New article · CampusNews" };

export default async function NewArticlePage() {
  const { profile } = await requireRole([
    "reporter",
    "student",
    "college_head",
    "location_news_head",
    "society_admin",
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">New article</h1>
      <ArticleEditor profile={profile} />
    </div>
  );
}
