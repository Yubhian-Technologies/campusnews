import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { authorAutoPublishes } from "@/lib/content/authorize";
import { ArticleEditor } from "@/app/(protected)/newsroom/_components/ArticleEditor";

export const metadata = { title: "Write a blog · CampusNews" };
export const revalidate = 0;

export default async function ContributeArticlePage() {
  const user = await getCurrentUser();
  if (!user || user.profile.status !== "ACTIVE") {
    redirect("/login?next=/news/contribute/article");
  }

  const isStudent =
    user.profile.roleIds.includes("student") &&
    !user.profile.roleIds.some((r) =>
      ["reporter", "college_head", "location_news_head", "society_admin"].includes(r),
    );
  const autoPublish = authorAutoPublishes(user.profile);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Write a blog</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isStudent
            ? "Your blog goes to your College Admin for approval — that's the only step before it's published."
            : autoPublish
              ? "Your blog publishes immediately once submitted."
              : "Draft an article, then submit it for review."}
        </p>
      </div>
      <ArticleEditor profile={user.profile} afterSaveHref="/news/contribute" />
    </div>
  );
}
