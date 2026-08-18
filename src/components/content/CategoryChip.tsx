import Link from "next/link";
import { cn } from "@/lib/utils";
import { CATEGORY_LABELS, type ArticleCategory } from "@/lib/content/types";
import { categoryStyle } from "@/lib/content/categoryStyle";

/** Colorful category pill. `onDark` variant reads over image overlays. */
export function CategoryChip({
  category,
  onDark = false,
  href,
  className,
}: {
  category: ArticleCategory;
  onDark?: boolean;
  href?: string;
  className?: string;
}) {
  const style = categoryStyle(category);
  const classes = cn(
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
    onDark ? style.chipOnDark : style.chip,
    className,
  );
  const label = CATEGORY_LABELS[category];

  if (href) {
    return (
      <Link href={href} className={cn(classes, "hover:opacity-90")}>
        {label}
      </Link>
    );
  }
  return <span className={classes}>{label}</span>;
}
