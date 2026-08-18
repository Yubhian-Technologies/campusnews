"use client";

/**
 * Inshorts / Way2News-style news reader: a full-screen vertical snap feed of
 * cards. Each card is half cover image, half text, with a source bar and a
 * bottom action bar (Like + Share). Swiping up moves to the next story with an
 * upward flip animation; opens at `startSlug`.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, GraduationCap } from "lucide-react";
import type { Article } from "@/lib/content/types";
import { timeAgo } from "@/lib/content/format";
import { CategoryChip } from "./CategoryChip";
import { CoverImage } from "./CoverImage";
import { ArticleActions } from "./ArticleActions";

export function NewsCardFeed({
  articles,
  startSlug,
}: {
  articles: Article[];
  startSlug: string;
}) {
  const [activeSlug, setActiveSlug] = useState<string>(startSlug);

  // Jump to the opened article, then track the active card for the flip anim +
  // to update the address bar as you swipe.
  useEffect(() => {
    document.getElementById(`card-${startSlug}`)?.scrollIntoView();

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const slug = (entry.target as HTMLElement).dataset.slug;
          if (slug && entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            setActiveSlug(slug);
            window.history.replaceState(null, "", `/news/${slug}`);
          }
        }
      },
      { threshold: [0, 0.6, 1] },
    );
    for (const a of articles) {
      const el = document.getElementById(`card-${a.slug}`);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, [articles, startSlug]);

  return (
    <div className="fixed inset-0 z-50 snap-y snap-mandatory overflow-y-scroll overscroll-contain bg-background [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <Link
        href="/news"
        aria-label="Close"
        className="fixed left-4 top-4 z-10 grid size-10 place-items-center rounded-full bg-black/40 text-white backdrop-blur hover:bg-black/60"
      >
        <ArrowLeft className="size-5" />
      </Link>

      {articles.map((article) => {
        const paragraphs = article.body.split(/\n{2,}/).filter((p) => p.trim());
        return (
          <section
            key={article.id}
            id={`card-${article.slug}`}
            data-slug={article.slug}
            className="flex h-dvh snap-start snap-always items-stretch justify-center"
          >
            <div
              className={`flex h-full w-full max-w-md flex-col bg-background ${
                activeSlug === article.slug ? "animate-news-flip" : ""
              }`}
            >
              {/* Top half — cover image */}
              <div className="relative h-[44%] shrink-0">
                <CoverImage
                  src={article.coverImage}
                  category={article.category}
                  sizes="(max-width: 640px) 100vw, 448px"
                  className="size-full"
                />
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute left-4 top-4">
                  <CategoryChip category={article.category} onDark />
                </div>
              </div>

              {/* Source bar */}
              <div className="flex items-center gap-2 border-b px-4 py-2">
                <span className="grid size-6 place-items-center rounded bg-gradient-to-br from-violet-500 to-fuchsia-500">
                  <GraduationCap className="size-3.5 text-white" />
                </span>
                <span className="text-sm font-bold tracking-tight">
                  Campus<span className="text-fuchsia-500">News</span>
                </span>
              </div>

              {/* Bottom half — text (scrolls internally if long) */}
              <div className="flex-1 overflow-y-auto px-5 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <h1 className="text-xl font-bold leading-snug tracking-tight">
                  {article.title}
                </h1>
                <p className="mt-2 font-medium text-muted-foreground">
                  {article.summary}
                </p>
                <div className="mt-3 space-y-3 text-[0.95rem] leading-7 text-foreground/90">
                  {paragraphs.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  By {article.authorName}
                </p>
              </div>

              {/* Action bar */}
              <div className="flex items-center justify-between border-t px-4 py-3">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3.5" />
                  {timeAgo(article.publishedAt)}
                </span>
                <ArticleActions slug={article.slug} title={article.title} />
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
