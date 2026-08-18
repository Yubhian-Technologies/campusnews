import { requireRole } from "@/lib/auth/session";
import { listArticlesByAuthor } from "@/lib/firebase/articles";
import { AuthorDashboard } from "@/components/dashboard/AuthorDashboard";

export const metadata = { title: "Reporter · CampusNews" };

export default async function ReporterDashboardPage() {
  const { uid, profile } = await requireRole(["reporter"], "/reporter/dashboard");
  const articles = await listArticlesByAuthor(uid);
  return <AuthorDashboard title="Reporter" profile={profile} articles={articles} />;
}
