import { requireRole } from "@/lib/auth/session";
import { listArticlesByAuthor } from "@/lib/firebase/articles";
import { AuthorDashboard } from "@/components/dashboard/AuthorDashboard";

export const metadata = { title: "Student · CampusNews" };

export default async function StudentDashboardPage() {
  const { uid, profile } = await requireRole(["student"], "/student/dashboard");
  const articles = await listArticlesByAuthor(uid);
  return (
    <AuthorDashboard
      title="Student Contributor"
      profile={profile}
      articles={articles}
    />
  );
}
