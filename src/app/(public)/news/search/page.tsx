import { listPublishedArticles } from "@/lib/firebase/articles";
import { getPublicReels } from "@/lib/firebase/reels";
import { DEFAULT_SOCIETY_ID } from "@/lib/config";
import { SearchNews } from "@/components/content/SearchNews";

export const metadata = { title: "Search · CampusNews" };
export const revalidate = 60;

export default async function SearchPage() {
  const [articles, reels] = await Promise.all([
    listPublishedArticles(DEFAULT_SOCIETY_ID),
    getPublicReels(DEFAULT_SOCIETY_ID),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Search</h1>
      <SearchNews articles={articles} reels={reels} />
    </div>
  );
}
