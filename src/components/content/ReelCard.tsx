import Link from "next/link";
import Image from "next/image";
import { Play, Clock } from "lucide-react";
import type { Reel } from "@/lib/content/reels";
import { cn } from "@/lib/utils";

/** A vertical reel thumbnail with a play overlay, title, and date. */
export function ReelCard({
  reel,
  className,
}: {
  reel: Reel;
  className?: string;
}) {
  return (
    <Link
      href={`/news/reels/${reel.id}`}
      className={cn(
        "group relative block aspect-[9/16] overflow-hidden rounded-2xl bg-slate-900 shadow-sm",
        className,
      )}
    >
      <Image
        src={reel.thumbnail}
        alt=""
        fill
        sizes="(max-width: 640px) 50vw, 220px"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/30" />

      {/* Play button */}
      <span className="absolute left-1/2 top-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/25 backdrop-blur transition-transform group-hover:scale-110">
        <Play className="size-5 translate-x-0.5 fill-white text-white" />
      </span>

      <div className="absolute inset-x-0 bottom-0 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white">
          {reel.title}
        </h3>
        <p className="mt-1 flex items-center gap-1 text-xs text-white/70">
          <Clock className="size-3" />
          {reel.date}
        </p>
      </div>
    </Link>
  );
}
