/**
 * Slug generation for articles. A kebab-cased title plus a short random suffix
 * keeps URLs readable while guaranteeing practical uniqueness without a
 * separate uniqueness query.
 */

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

/** A 6-char base36 suffix, e.g. "k3p9zq". */
export function shortSuffix(): string {
  return Math.random().toString(36).slice(2, 8).padEnd(6, "0");
}

/** Full slug: "campus-fest-2026-k3p9zq". Falls back to "post" for empty titles. */
export function makeSlug(title: string): string {
  const base = slugify(title) || "post";
  return `${base}-${shortSuffix()}`;
}
