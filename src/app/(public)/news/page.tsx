import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { listPublishedArticles } from "@/lib/firebase/articles";
import { listColleges, listLocations } from "@/lib/firebase/org";
import { DEFAULT_SOCIETY_ID } from "@/lib/config";
import { HomeFeatureCarousel } from "@/components/content/HomeFeatureCarousel";
import { ReelCard } from "@/components/content/ReelCard";
import { getPublicReels } from "@/lib/firebase/reels";

export const metadata = {
  title: "CampusNews — Latest stories",
  description: "Short campus news from across the community.",
};

export const revalidate = 60;

export default async function NewsHomePage() {
  const [all, locations, colleges, reels] = await Promise.all([
    listPublishedArticles(DEFAULT_SOCIETY_ID),
    listLocations(DEFAULT_SOCIETY_ID),
    listColleges(DEFAULT_SOCIETY_ID),
    getPublicReels(DEFAULT_SOCIETY_ID),
  ]);

  if (all.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed py-20 text-center">
        <p className="text-lg font-medium">No stories yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Check back soon for the latest campus news.
        </p>
      </div>
    );
  }

  return (
    // Single-screen home — a bounded feature carousel keeps the cards a
    // comfortable size (no full-height stretch / empty middle) plus a Latest row.
    <div className="space-y-5">
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight">For you</h1>
          <Link
            href="/news/all"
            className="flex items-center gap-0.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            See all
            <ChevronRight className="size-4" />
          </Link>
        </div>
        <div className="h-[52dvh] max-h-[430px] min-h-[300px]">
          <HomeFeatureCarousel
            articles={all}
            locations={locations.map((l) => ({ id: l.id, name: l.name }))}
            colleges={colleges.map((c) => ({ id: c.id, name: c.name }))}
          />
        </div>
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold tracking-tight">News Reels</h2>
          <Link
            href="/news/reels"
            className="flex items-center gap-0.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            See all
            <ChevronRight className="size-4" />
          </Link>
        </div>
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {reels.map((reel, i) => (
            <ReelCard
              key={reel.id}
              reel={reel}
              className="w-32 shrink-0"
              priority={i === 0}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
