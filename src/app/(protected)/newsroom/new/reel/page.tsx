import { requireRole } from "@/lib/auth/session";
import { ReelUploadForm } from "@/components/content/ReelUploadForm";

export const metadata = { title: "New reel · CampusNews" };

export default async function NewReelPage() {
  await requireRole(
    ["reporter", "student", "college_head", "location_news_head", "society_admin"],
    "/newsroom/new/reel",
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">New reel</h1>
      <ReelUploadForm />
    </div>
  );
}
