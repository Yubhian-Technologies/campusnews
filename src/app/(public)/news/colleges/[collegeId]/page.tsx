import { notFound } from "next/navigation";
import { listPublishedArticles } from "@/lib/firebase/articles";
import { getCollege } from "@/lib/firebase/org";
import { DEFAULT_SOCIETY_ID } from "@/lib/config";
import { Feed } from "@/components/content/Feed";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ collegeId: string }>;
}) {
  const { collegeId } = await params;
  const college = await getCollege(collegeId);
  return { title: college ? `${college.name} · CampusNews` : "CampusNews" };
}

export default async function CollegeFeedPage({
  params,
}: {
  params: Promise<{ collegeId: string }>;
}) {
  const { collegeId } = await params;
  const college = await getCollege(collegeId);
  if (!college || college.societyId !== DEFAULT_SOCIETY_ID) notFound();

  const articles = await listPublishedArticles(DEFAULT_SOCIETY_ID, {
    collegeId,
  });

  return (
    <Feed
      title={college.name}
      subtitle="College news"
      articles={articles}
      emptyText="No stories from this college yet."
    />
  );
}
