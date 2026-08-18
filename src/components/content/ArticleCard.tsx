import Link from "next/link";
import type { Article } from "@/lib/content/types";
import { CoverImage } from "./CoverImage";
import { CategoryChip } from "./CategoryChip";
import { Byline } from "./Byline";

/** Standard story card used in the public news grid. */
export function ArticleCard({ article }: { article: Article }) {
  return (
    <Link
      href={`/news/${article.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
    >
      <CoverImage
        src={article.coverImage}
        category={article.category}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="aspect-[16/10] w-full"
      />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <CategoryChip category={article.category} className="w-fit" />
        <h3 className="text-lg font-semibold leading-snug tracking-tight group-hover:underline">
          {article.title}
        </h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {article.summary}
        </p>
        <Byline
          name={article.authorName}
          date={article.publishedAt}
          className="mt-auto pt-2"
        />
      </div>
    </Link>
  );
}
