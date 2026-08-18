import { notFound } from "next/navigation";
import {
  getArticleBySlug,
  listPublishedArticles,
} from "@/lib/firebase/articles";
import { DEFAULT_SOCIETY_ID } from "@/lib/config";
import { NewsCardFeed } from "@/components/content/NewsCardFeed";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article || article.status !== "PUBLISHED") return { title: "CampusNews" };
  return { title: `${article.title} · CampusNews`, description: article.summary };
}

export default async function ReaderPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (
    !article ||
    article.status !== "PUBLISHED" ||
    article.societyId !== DEFAULT_SOCIETY_ID
  ) {
    notFound();
  }

  // The whole published feed powers the swipe-up navigation; open at this story.
  const feed = await listPublishedArticles(DEFAULT_SOCIETY_ID);
  const articles = feed.some((a) => a.slug === slug) ? feed : [article, ...feed];

  return <NewsCardFeed articles={articles} startSlug={slug} />;
}
