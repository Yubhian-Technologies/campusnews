import { listPublishedArticles } from "@/lib/firebase/articles";
import { DEFAULT_SOCIETY_ID } from "@/lib/config";
import { NewsCardFeed } from "@/components/content/NewsCardFeed";

export const metadata = { title: "News · CampusNews" };
export const revalidate = 60;

export default async function AllNewsPage() {
  const articles = await listPublishedArticles(DEFAULT_SOCIETY_ID);

  if (articles.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed py-20 text-center">
        <p className="text-lg font-medium">No stories yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Check back soon for the latest campus news.
        </p>
      </div>
    );
  }

  // Tapping "News" opens the flip reader directly, starting at the newest story.
  return <NewsCardFeed articles={articles} startSlug={articles[0].slug} />;
}
