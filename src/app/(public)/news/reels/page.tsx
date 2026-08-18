import { getPublicReels } from "@/lib/firebase/reels";
import { DEFAULT_SOCIETY_ID } from "@/lib/config";
import { ReelsBrowser } from "@/components/content/ReelsBrowser";

export const metadata = { title: "Reels · CampusNews" };
export const revalidate = 60;

export default async function ReelsPage() {
  const reels = await getPublicReels(DEFAULT_SOCIETY_ID);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reels</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Short campus videos, updated daily.
        </p>
      </div>

      <ReelsBrowser reels={reels} />
    </div>
  );
}
