import type { Article } from "@/lib/content/types";
import { ArticleCard } from "./ArticleCard";

/** A titled vertical list of story cards, with an empty state. */
export function Feed({
  title,
  subtitle,
  articles,
  emptyText = "No stories here yet.",
}: {
  title: string;
  subtitle?: string;
  articles: Article[];
  emptyText?: string;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      {articles.length === 0 ? (
        <div className="rounded-2xl border border-dashed py-16 text-center text-sm text-muted-foreground">
          {emptyText}
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
