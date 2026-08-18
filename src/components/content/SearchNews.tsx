"use client";

/** Instant client-side search across published stories and reels. */
import { useMemo, useState } from "react";
import { Search as SearchIcon, X } from "lucide-react";
import type { Article } from "@/lib/content/types";
import { CATEGORY_LABELS } from "@/lib/content/types";
import type { Reel } from "@/lib/content/reels";
import { ArticleCard } from "./ArticleCard";
import { ReelCard } from "./ReelCard";
import { Input } from "@/components/ui/input";

export function SearchNews({
  articles,
  reels,
}: {
  articles: Article[];
  reels: Reel[];
}) {
  const [q, setQ] = useState("");
  const term = q.trim().toLowerCase();

  const articleResults = useMemo(() => {
    if (!term) return [];
    return articles.filter((a) =>
      `${a.title} ${a.summary} ${a.body} ${CATEGORY_LABELS[a.category]} ${a.authorName} ${a.locationId ?? ""} ${a.collegeId ?? ""}`
        .toLowerCase()
        .includes(term),
    );
  }, [term, articles]);

  const reelResults = useMemo(() => {
    if (!term) return [];
    return reels.filter((r) => r.title.toLowerCase().includes(term));
  }, [term, reels]);

  const total = articleResults.length + reelResults.length;

  return (
    <div className="space-y-5">
      <div className="relative">
        <SearchIcon className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search stories & reels…"
          className="h-11 rounded-full pl-10 pr-10 text-base"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-accent"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {term === "" ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          Search across {articles.length} stories and {reels.length} reels.
        </p>
      ) : total === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          Nothing matches “{q}”.
        </p>
      ) : (
        <div className="space-y-8">
          <p className="text-sm text-muted-foreground">
            {total} {total === 1 ? "result" : "results"}
          </p>

          {articleResults.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-bold text-muted-foreground">
                Stories ({articleResults.length})
              </h2>
              <div className="space-y-4">
                {articleResults.map((a) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
            </section>
          )}

          {reelResults.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-bold text-muted-foreground">
                Reels ({reelResults.length})
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {reelResults.map((r) => (
                  <ReelCard key={r.id} reel={r} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
