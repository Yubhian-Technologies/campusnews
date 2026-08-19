import { requireRole } from "@/lib/auth/session";
import { ArticleEditor } from "../../_components/ArticleEditor";

export const metadata = { title: "New event · CampusNews" };

export default async function NewEventPage() {
  // Events are admin-tier content only — College/Location/Super Admin, the
  // same roles that auto-publish everything else (see authorAutoPublishes).
  // Reporter and Student don't get this category at all.
  const { profile } = await requireRole(
    ["college_head", "location_news_head", "society_admin"],
    "/newsroom/new/event",
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">New event</h1>
      <ArticleEditor profile={profile} initialCategory="EVENTS" />
    </div>
  );
}
