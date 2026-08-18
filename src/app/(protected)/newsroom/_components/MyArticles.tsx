"use client";

/**
 * Author's article list with inline Submit and Delete (own DRAFT) actions.
 * Submit goes to SUBMITTED for Reporter/Student, or straight to PUBLISHED for
 * Super Admin / Location Admin / College Admin (see authorAutoPublishes).
 * Optimistically updates local state from the server's authoritative response.
 */
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { FileText, Send, Rocket, Trash2, SquarePen } from "lucide-react";
import type { Article } from "@/lib/content/types";
import { CATEGORY_LABELS } from "@/lib/content/types";
import { authorAutoPublishes } from "@/lib/content/authorize";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  articleActionClient,
  deleteArticleClient,
} from "@/lib/api/articles-client";
import { ArticleStatusBadge } from "@/components/content/ArticleStatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function formatDate(ms: number | null): string {
  if (!ms) return "—";
  return new Date(ms).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function MyArticles({ initial }: { initial: Article[] }) {
  const { profile } = useAuth();
  const autoPublish = profile ? authorAutoPublishes(profile) : false;
  const [articles, setArticles] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);

  async function submit(article: Article) {
    setBusy(article.id);
    try {
      const updated = await articleActionClient(article.id, { action: "submit" });
      setArticles((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      toast.success(autoPublish ? "Published." : "Submitted for review.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submit failed.");
    } finally {
      setBusy(null);
    }
  }

  async function remove(article: Article) {
    setBusy(article.id);
    try {
      await deleteArticleClient(article.id);
      setArticles((prev) => prev.filter((a) => a.id !== article.id));
      toast.success("Draft deleted.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setBusy(null);
    }
  }

  if (articles.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
          <FileText className="size-6" />
        </div>
        <div>
          <p className="font-medium">No articles yet</p>
          <p className="text-sm text-muted-foreground">
            Start writing your first story.
          </p>
        </div>
        <Button render={<Link href="/newsroom/new" />}>New post</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {articles.map((article) => {
        const canSubmit =
          article.status === "DRAFT" || article.status === "REJECTED";
        const canDelete = article.status === "DRAFT";
        return (
          <Card key={article.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <ArticleStatusBadge status={article.status} />
                  <span className="text-xs text-muted-foreground">
                    {CATEGORY_LABELS[article.category]} · Updated{" "}
                    {formatDate(article.updatedAt)}
                  </span>
                </div>
                <Link
                  href={`/newsroom/${article.id}`}
                  className="block font-medium hover:underline"
                >
                  {article.title}
                </Link>
                <p className="line-clamp-1 text-sm text-muted-foreground">
                  {article.summary}
                </p>
                {article.status === "REJECTED" && article.reviewNote && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Reviewer: {article.reviewNote}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Button
                  render={<Link href={`/newsroom/${article.id}`} />}
                  variant="outline"
                  size="sm"
                >
                  <SquarePen className="size-4" />
                  Edit
                </Button>
                {canSubmit && (
                  <Button
                    size="sm"
                    disabled={busy === article.id}
                    onClick={() => submit(article)}
                  >
                    {autoPublish ? (
                      <Rocket className="size-4" />
                    ) : (
                      <Send className="size-4" />
                    )}
                    {autoPublish ? "Publish" : "Submit"}
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground"
                    disabled={busy === article.id}
                    onClick={() => remove(article)}
                    aria-label="Delete draft"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
