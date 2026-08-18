"use client";

/**
 * Reviewer's queue of SUBMITTED articles. Approve publishes immediately; Reject
 * requires a note (captured inline) and sends the article back to the author.
 * Reviewed items drop out of the local list.
 */
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CheckCircle2, Inbox, Loader2, X } from "lucide-react";
import type { Article } from "@/lib/content/types";
import { CATEGORY_LABELS } from "@/lib/content/types";
import { articleActionClient } from "@/lib/api/articles-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

function scopeLabel(a: Article): string {
  return [a.locationId, a.collegeId].filter(Boolean).join(" · ") || "—";
}

export function ReviewQueue({ initial }: { initial: Article[] }) {
  const [articles, setArticles] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [note, setNote] = useState("");

  function drop(id: string) {
    setArticles((prev) => prev.filter((a) => a.id !== id));
  }

  async function approve(article: Article) {
    setBusy(article.id);
    try {
      await articleActionClient(article.id, { action: "approve" });
      drop(article.id);
      toast.success(`Published “${article.title}”.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Approve failed.");
    } finally {
      setBusy(null);
    }
  }

  async function reject(article: Article) {
    if (note.trim().length < 3) {
      toast.error("Add a short note so the author knows what to fix.");
      return;
    }
    setBusy(article.id);
    try {
      await articleActionClient(article.id, { action: "reject", note });
      drop(article.id);
      setRejecting(null);
      setNote("");
      toast.success("Sent back to the author.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reject failed.");
    } finally {
      setBusy(null);
    }
  }

  if (articles.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
          <Inbox className="size-6" />
        </div>
        <p className="font-medium">Nothing to review</p>
        <p className="text-sm text-muted-foreground">
          Submitted articles in your scope will appear here.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {articles.map((article) => (
        <Card key={article.id} className="space-y-3 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <div className="text-xs text-muted-foreground">
                {CATEGORY_LABELS[article.category]} · {scopeLabel(article)} · by{" "}
                {article.authorName}
              </div>
              <Link
                href={`/newsroom/${article.id}`}
                className="block font-medium hover:underline"
              >
                {article.title}
              </Link>
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {article.summary}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                size="sm"
                disabled={busy === article.id}
                onClick={() => approve(article)}
              >
                <CheckCircle2 className="size-4" />
                Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={busy === article.id}
                onClick={() =>
                  setRejecting((r) => (r === article.id ? null : article.id))
                }
              >
                <X className="size-4" />
                Reject
              </Button>
            </div>
          </div>

          {rejecting === article.id && (
            <div className="space-y-2 border-t pt-3">
              <Textarea
                rows={2}
                autoFocus
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What needs to change before this can be published?"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setRejecting(null);
                    setNote("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={busy === article.id}
                  onClick={() => reject(article)}
                >
                  {busy === article.id && (
                    <Loader2 className="size-4 animate-spin" />
                  )}
                  Send back
                </Button>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
