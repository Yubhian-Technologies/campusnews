"use client";

/**
 * Reader action bar: a Like remembered on this device (localStorage) and a Share
 * that opens the app-target share sheet (WhatsApp, Instagram, etc.). No backend
 * — never touches the editorial flow.
 */
import { useState } from "react";
import { Heart, Share2 } from "lucide-react";
import { useLikes } from "@/components/likes/LikesProvider";
import { ShareSheet } from "./ShareSheet";
import { cn } from "@/lib/utils";

export function ArticleActions({
  slug,
  title,
}: {
  slug: string;
  title: string;
}) {
  const { isLiked, toggle } = useLikes();
  const liked = isLiked("article", slug);
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => toggle("article", slug)}
        aria-pressed={liked}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
          liked
            ? "border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400"
            : "hover:bg-accent",
        )}
      >
        <Heart className={cn("size-4", liked && "fill-current")} />
        {liked ? "Liked" : "Like"}
      </button>
      <button
        type="button"
        onClick={() => setShareOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
      >
        <Share2 className="size-4" />
        Share
      </button>

      <ShareSheet
        open={shareOpen}
        onOpenChange={setShareOpen}
        title={title}
        path={`/news/${slug}`}
      />
    </div>
  );
}
