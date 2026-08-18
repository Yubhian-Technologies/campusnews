"use client";

/** Like toggle for a reel — account-backed when logged in, device-local for guests. */
import { Heart } from "lucide-react";
import { useLikes } from "@/components/likes/LikesProvider";
import { cn } from "@/lib/utils";

export function ReelLikeButton({ reelId }: { reelId: string }) {
  const { isLiked, toggle } = useLikes();
  const liked = isLiked("reel", reelId);

  return (
    <button
      type="button"
      onClick={() => toggle("reel", reelId)}
      aria-pressed={liked}
      aria-label={liked ? "Unlike" : "Like"}
      className="flex flex-col items-center gap-1 text-white"
    >
      <span className="grid size-12 place-items-center rounded-full bg-black/40 backdrop-blur transition-transform active:scale-90">
        <Heart
          className={cn("size-6", liked && "fill-rose-500 text-rose-500")}
        />
      </span>
      <span className="text-xs font-medium">{liked ? "Liked" : "Like"}</span>
    </button>
  );
}
