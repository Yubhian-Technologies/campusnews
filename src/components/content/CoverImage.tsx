import Image from "next/image";
import { Newspaper } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ArticleCategory } from "@/lib/content/types";
import { categoryStyle } from "@/lib/content/categoryStyle";

/**
 * Article cover with a category-colored gradient fallback when no image URL is
 * present, so every card stays vibrant even without artwork.
 */
export function CoverImage({
  src,
  category,
  sizes,
  priority,
  className,
}: {
  src: string | null;
  category: ArticleCategory;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const style = categoryStyle(category);
  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      {src ? (
        <Image
          src={src}
          alt=""
          fill
          sizes={sizes ?? "100vw"}
          priority={priority}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div
          className={cn(
            "flex size-full items-center justify-center bg-gradient-to-br",
            style.gradient,
          )}
        >
          <Newspaper className="size-10 text-white/70" />
        </div>
      )}
    </div>
  );
}
