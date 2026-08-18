import { notFound } from "next/navigation";
import { listPublishedArticles } from "@/lib/firebase/articles";
import { DEFAULT_SOCIETY_ID } from "@/lib/config";
import {
  ARTICLE_CATEGORIES,
  CATEGORY_LABELS,
  type ArticleCategory,
} from "@/lib/content/types";
import { Feed } from "@/components/content/Feed";

export const revalidate = 60;

function isCategory(v: string): v is ArticleCategory {
  return (ARTICLE_CATEGORIES as readonly string[]).includes(v);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  if (!isCategory(category)) return { title: "CampusNews" };
  return { title: `${CATEGORY_LABELS[category]} · CampusNews` };
}

export default async function CategoryFeedPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  if (!isCategory(category)) notFound();

  const articles = await listPublishedArticles(DEFAULT_SOCIETY_ID, { category });

  return (
    <Feed
      title={CATEGORY_LABELS[category]}
      subtitle={`${articles.length} ${articles.length === 1 ? "story" : "stories"}`}
      articles={articles}
      emptyText="Nothing published in this category yet."
    />
  );
}
