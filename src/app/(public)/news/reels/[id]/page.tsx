import { notFound } from "next/navigation";
import { getPublicReel, getPublicReels } from "@/lib/firebase/reels";
import { DEFAULT_SOCIETY_ID } from "@/lib/config";
import { ReelViewer } from "@/components/content/ReelViewer";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const reel = await getPublicReel(DEFAULT_SOCIETY_ID, id);
  return { title: reel ? `${reel.title} · CampusNews` : "CampusNews" };
}

export default async function ReelPlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const reels = await getPublicReels(DEFAULT_SOCIETY_ID);
  if (!reels.some((r) => r.id === id)) notFound();

  // Full-screen vertical feed of all reels, opened at the selected one.
  return <ReelViewer reels={reels} startId={id} />;
}
