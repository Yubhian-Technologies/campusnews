import Link from "next/link";
import {
  ChevronRight,
  Building2,
  GraduationCap,
  Trophy,
  CalendarDays,
  Palette,
  Megaphone,
  Newspaper,
  type LucideIcon,
} from "lucide-react";
import {
  ARTICLE_CATEGORIES,
  CATEGORY_LABELS,
  type ArticleCategory,
} from "@/lib/content/types";
import { categoryStyle } from "@/lib/content/categoryStyle";
import { cn } from "@/lib/utils";

const CATEGORY_ICON: Record<ArticleCategory, LucideIcon> = {
  CAMPUS: Building2,
  ACADEMICS: GraduationCap,
  SPORTS: Trophy,
  EVENTS: CalendarDays,
  CULTURE: Palette,
  ANNOUNCEMENTS: Megaphone,
  OTHER: Newspaper,
};

/** Way2News-style tappable list of news categories with colored icon tiles. */
export function CategoryList() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      {ARTICLE_CATEGORIES.map((category, i) => {
        const style = categoryStyle(category);
        const Icon = CATEGORY_ICON[category];
        return (
          <Link
            key={category}
            href={`/news/category/${category}`}
            className={cn(
              "flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-accent",
              i > 0 && "border-t",
            )}
          >
            <span
              className={cn(
                "grid size-10 shrink-0 place-items-center rounded-xl",
                style.soft,
                style.text,
              )}
            >
              <Icon className="size-5" />
            </span>
            <span className="flex-1 font-medium">
              {CATEGORY_LABELS[category]}
            </span>
            <ChevronRight className="size-5 text-muted-foreground" />
          </Link>
        );
      })}
    </div>
  );
}
