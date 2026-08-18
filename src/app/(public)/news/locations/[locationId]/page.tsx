import { notFound } from "next/navigation";
import { listPublishedArticles } from "@/lib/firebase/articles";
import { listLocations } from "@/lib/firebase/org";
import { DEFAULT_SOCIETY_ID } from "@/lib/config";
import { Feed } from "@/components/content/Feed";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locationId: string }>;
}) {
  const { locationId } = await params;
  const loc = (await listLocations(DEFAULT_SOCIETY_ID)).find(
    (l) => l.id === locationId,
  );
  return { title: loc ? `${loc.name} · CampusNews` : "CampusNews" };
}

export default async function LocationFeedPage({
  params,
}: {
  params: Promise<{ locationId: string }>;
}) {
  const { locationId } = await params;
  const loc = (await listLocations(DEFAULT_SOCIETY_ID)).find(
    (l) => l.id === locationId,
  );
  if (!loc) notFound();

  const articles = await listPublishedArticles(DEFAULT_SOCIETY_ID, {
    locationId,
  });

  return (
    <Feed
      title={loc.name}
      subtitle="Local news"
      articles={articles}
      emptyText="No stories from this location yet."
    />
  );
}
