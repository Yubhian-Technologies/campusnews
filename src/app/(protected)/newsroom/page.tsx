import Link from "next/link";
import { Plus } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { listArticlesByAuthor } from "@/lib/firebase/articles";
import { MyArticles } from "./_components/MyArticles";
import { Button } from "@/components/ui/button";

export const metadata = { title: "My Articles · CampusNews" };

export default async function NewsroomPage() {
  const { uid } = await requireRole([
    "reporter",
    "student",
    "college_head",
    "location_news_head",
    "society_admin",
  ]);
  const articles = await listArticlesByAuthor(uid);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Articles</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Write, submit for review, and track your stories.
          </p>
        </div>
        <Button render={<Link href="/newsroom/new" />}>
          <Plus className="size-4" />
          New post
        </Button>
      </div>

      <MyArticles initial={articles} />
    </div>
  );
}
