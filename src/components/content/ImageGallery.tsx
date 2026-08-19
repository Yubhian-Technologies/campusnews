"use client";

/**
 * Horizontally swipeable image gallery for an article. Falls back to a
 * single static image (or the category gradient, matching CoverImage) when
 * there are 0 or 1 images — the snap-scroller + "1/N" badge only kick in
 * once there's actually something to scroll to.
 */
import { useState } from "react";
import Image from "next/image";
import { Newspaper } from "lucide-react";
import type { ArticleCategory } from "@/lib/content/types";
import { categoryStyle } from "@/lib/content/categoryStyle";
import { cn } from "@/lib/utils";

export function ImageGallery({
  images,
  category,
  sizes,
  priority,
  className,
}: {
  images: string[];
  category: ArticleCategory;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const [index, setIndex] = useState(0);

  if (images.length === 0) {
    const style = categoryStyle(category);
    return (
      <div className={cn("relative overflow-hidden bg-muted", className)}>
        <div
          className={cn(
            "flex size-full items-center justify-center bg-gradient-to-br",
            style.gradient,
          )}
        >
          <Newspaper className="size-10 text-white/70" />
        </div>
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <div className={cn("relative overflow-hidden bg-muted", className)}>
        <Image
          src={images[0]}
          alt=""
          fill
          sizes={sizes ?? "100vw"}
          priority={priority}
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      <div
        className="flex size-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onScroll={(e) => {
          const el = e.currentTarget;
          const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
          setIndex(Math.min(images.length - 1, Math.max(0, i)));
        }}
      >
        {images.map((src, i) => (
          <div
            key={`${i}-${src}`}
            className="relative h-full w-full shrink-0 snap-center"
          >
            <Image
              src={src}
              alt=""
              fill
              sizes={sizes ?? "100vw"}
              priority={priority && i === 0}
              className="object-cover"
            />
          </div>
        ))}
      </div>
      <span className="pointer-events-none absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-xs font-medium text-white backdrop-blur">
        {index + 1}/{images.length}
      </span>
    </div>
  );
}
