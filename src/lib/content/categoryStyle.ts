/**
 * Per-category color system for the public site. Each category gets a distinct
 * hue used across chips, gradient placeholders, and accents so the news feed
 * reads as colorful but coherent. Class strings are literal so Tailwind's
 * scanner picks them up.
 */
import type { ArticleCategory } from "./types";

export interface CategoryStyle {
  /** Solid chip (used over light surfaces). */
  chip: string;
  /** Chip that reads on top of a dark image overlay. */
  chipOnDark: string;
  /** Gradient used for cover-image fallbacks and accents. */
  gradient: string;
  /** Text accent color. */
  text: string;
  /** A soft tinted surface. */
  soft: string;
}

export const CATEGORY_STYLE: Record<ArticleCategory, CategoryStyle> = {
  CAMPUS: {
    chip: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200",
    chipOnDark: "bg-violet-500/90 text-white",
    gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
    text: "text-violet-600 dark:text-violet-300",
    soft: "bg-violet-50 dark:bg-violet-500/10",
  },
  ACADEMICS: {
    chip: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200",
    chipOnDark: "bg-sky-500/90 text-white",
    gradient: "from-sky-500 via-blue-500 to-indigo-500",
    text: "text-sky-600 dark:text-sky-300",
    soft: "bg-sky-50 dark:bg-sky-500/10",
  },
  SPORTS: {
    chip: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-200",
    chipOnDark: "bg-orange-500/90 text-white",
    gradient: "from-orange-500 via-amber-500 to-yellow-500",
    text: "text-orange-600 dark:text-orange-300",
    soft: "bg-orange-50 dark:bg-orange-500/10",
  },
  EVENTS: {
    chip: "bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-200",
    chipOnDark: "bg-pink-500/90 text-white",
    gradient: "from-pink-500 via-rose-500 to-red-500",
    text: "text-pink-600 dark:text-pink-300",
    soft: "bg-pink-50 dark:bg-pink-500/10",
  },
  CULTURE: {
    chip: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
    chipOnDark: "bg-emerald-500/90 text-white",
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    text: "text-emerald-600 dark:text-emerald-300",
    soft: "bg-emerald-50 dark:bg-emerald-500/10",
  },
  ANNOUNCEMENTS: {
    chip: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200",
    chipOnDark: "bg-amber-500/90 text-white",
    gradient: "from-amber-500 via-orange-500 to-red-500",
    text: "text-amber-600 dark:text-amber-300",
    soft: "bg-amber-50 dark:bg-amber-500/10",
  },
  OTHER: {
    chip: "bg-slate-200 text-slate-700 dark:bg-slate-500/20 dark:text-slate-200",
    chipOnDark: "bg-slate-600/90 text-white",
    gradient: "from-slate-500 via-slate-600 to-slate-700",
    text: "text-slate-600 dark:text-slate-300",
    soft: "bg-slate-100 dark:bg-slate-500/10",
  },
};

export function categoryStyle(category: ArticleCategory): CategoryStyle {
  return CATEGORY_STYLE[category] ?? CATEGORY_STYLE.OTHER;
}
